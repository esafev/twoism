import { $ } from 'bun';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

type Region = { left: number; top: number; width: number; height: number };
type Face = { x: number; y: number; width: number; height: number };

const SIZE = 192;
const SCALE = 3;
const FACE_SCALE = 2.1;
const HEAD_SCALE = 1.3;
const HEADROOM = 0.08;
const NEIGHBORS = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];

const STYLES = [
  { file: 'portrait-light.webp', ink: [82, 96, 119], amount: (brightness: number) => 0.08 + 0.92 * (1 - brightness) ** 0.8 },
  { file: 'portrait-dark.webp', ink: [159, 176, 224], amount: (brightness: number) => 0.08 + 0.55 * brightness },
];

const VISION = `
ObjC.import('Vision');
ObjC.import('CoreImage');
ObjC.import('AppKit');

function run([input, output]) {
  const handler = $.VNImageRequestHandler.alloc.initWithURLOptions($.NSURL.fileURLWithPath(input), $());
  const subject = $.VNGenerateForegroundInstanceMaskRequest.alloc.init;
  const faces = $.VNDetectFaceRectanglesRequest.alloc.init;
  const error = $();
  handler.performRequestsError($([subject, faces]), error);

  const observation = subject.results.firstObject;
  if (observation.isNil()) throw new Error('No person found in the photo');
  const mask = observation.generateScaledMaskForImageForInstancesFromRequestHandlerError(observation.allInstances, handler, error);
  $.NSBitmapImageRep.alloc.initWithCIImage($.CIImage.imageWithCVPixelBuffer(mask))
    .representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $())
    .writeToFileAtomically(output, true);

  const face = faces.results.firstObject;
  if (face.isNil()) return 'null';
  const { origin, size } = face.boundingBox;
  return JSON.stringify({ x: origin.x, y: origin.y, width: size.width, height: size.height });
}`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

async function cutOut(photo: string, mask: string): Promise<Face | null> {
  if (!(await sharp(photo).stats()).isOpaque) {
    await sharp(photo).extractChannel('alpha').toFile(mask);
    return null;
  }
  if (process.platform !== 'darwin') {
    throw new Error('Removing the background needs macOS. Use a PNG with a transparent background instead.');
  }
  const result = await $`osascript -l JavaScript -e ${VISION} ${photo} ${mask}`.quiet().nothrow();
  if (result.exitCode !== 0) throw new Error(result.stderr.toString().replace(/^.*Error: /s, '').trim());
  return JSON.parse(result.stdout.toString());
}

async function frame(mask: string, face: Face | null): Promise<Region> {
  const { data, info: { width, height } } = await sharp(mask).grayscale().raw().toBuffer({ resolveWithObject: true });
  const chin = face ? Math.round((1 - face.y) * height) : height;
  const head = { top: height, left: width, right: 0 };
  for (let y = 0; y < chin; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] < 128) continue;
      head.top = Math.min(head.top, y);
      head.left = Math.min(head.left, x);
      head.right = Math.max(head.right, x);
    }
  }

  const faceSize = face ? Math.max(face.width * width, face.height * height) * FACE_SCALE : Infinity;
  const size = Math.round(Math.min(width, height, Math.max(faceSize, (head.right - head.left) * HEAD_SCALE)));
  return {
    left: Math.round(clamp((head.left + head.right - size) / 2, 0, width - size)),
    top: Math.round(clamp(head.top - size * HEADROOM, 0, height - size)),
    width: size,
    height: size,
  };
}

function atkinson(amounts: Float32Array, inside: Uint8Array): Uint8Array {
  const values = amounts.slice();
  const ink = new Uint8Array(values.length);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      if (!inside[i]) continue;
      ink[i] = values[i] >= 0.5 ? 1 : 0;
      const error = (values[i] - ink[i]) / 8;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < SIZE && ny < SIZE) values[ny * SIZE + nx] += error;
      }
    }
  }
  return ink;
}

async function render(ink: Uint8Array, [r, g, b]: number[], path: string) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  ink.forEach((on, i) => on && pixels.set([r, g, b, 255], i * 4));
  await sharp(pixels, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .resize(SIZE * SCALE, SIZE * SCALE, { kernel: 'nearest' })
    .webp({ lossless: true })
    .toFile(path);
}

async function createPortrait(input: string, dir: string) {
  const photo = join(dir, 'photo.png');
  const mask = join(dir, 'mask.png');
  await sharp(input)
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toFile(photo);

  const region = await frame(mask, await cutOut(photo, mask));
  const gray = await sharp(photo).extract(region).resize(SIZE, SIZE).flatten({ background: '#fff' }).grayscale().raw().toBuffer();
  const alpha = await sharp(mask).extract(region).resize(SIZE, SIZE).grayscale().raw().toBuffer();
  const inside = Uint8Array.from(alpha, (value) => (value >= 128 ? 1 : 0));

  const tones = gray.filter((_, i) => inside[i]).sort();
  const low = tones[Math.floor(tones.length * 0.02)];
  const high = tones[Math.floor(tones.length * 0.98)];
  const brightness = Float32Array.from(gray, (value) => clamp((value - low) / Math.max(high - low, 1), 0, 1));

  for (const { file, ink, amount } of STYLES) {
    const path = join(import.meta.dir, '..', 'public', file);
    await render(atkinson(brightness.map(amount), inside), ink, path);
    console.log(`Created public/${file}`);
  }
}

const [input] = Bun.argv.slice(2);

if (!input) {
  console.log('Usage: bun run portrait:create <photo>');
  process.exit(1);
}

const dir = await mkdtemp(join(tmpdir(), 'portrait-'));
try {
  await createPortrait(input, dir);
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
