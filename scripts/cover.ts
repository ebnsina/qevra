// Draws a cover picture for a course or a post: an aurora gradient (soft clouds of blue melting into
// each other, with a light film grain). Generated when seeding, so the repository carries no
// photographs. Plain PNG, written by hand with Node's zlib; no dependency.
import { crc32, deflateSync } from 'node:zlib';

const WIDTH = 800;
const HEIGHT = 420;

type Rgb = [number, number, number];

const hex = (color: string): Rgb => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as Rgb;
// Blue families, light to deep. Each cover takes one, so neighbors differ but all sit with a blue brand.
const PALETTES = [
	['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#023e8a'],
	['#2563eb', '#60a5fa', '#bfdbfe', '#e0f2fe', '#1e3a8a'],
	['#4f46e5', '#38bdf8', '#a5b4fc', '#e0e7ff', '#1d4ed8'],
	['#0ea5e9', '#22d3ee', '#a5f3fc', '#dbeafe', '#1e40af']
].map((palette) => palette.map(hex));
const GRAIN = 6;

function chunk(type: string, data: Buffer) {
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const out = Buffer.alloc(body.length + 8);
	out.writeUInt32BE(data.length, 0);
	body.copy(out, 4);
	out.writeUInt32BE(crc32(body) >>> 0, body.length + 4);
	return out;
}

/** A cover that is always the same for the same number, and different from its neighbors. */
export function coverPng(seed: number): Uint8Array<ArrayBuffer> {
	let state = (seed + 1) * 2654435761;
	const random = () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
	const palette = PALETTES[seed % PALETTES.length];
	// One cloud per color, each with its own place and reach.
	const clouds = palette.map((color) => ({
		color,
		x: random() * WIDTH,
		y: random() * HEIGHT,
		reach: (0.28 + random() * 0.3) * WIDTH
	}));

	// Film grain: specks two pixels wide on about a third of the picture. Finer or denser grain
	// looks the same at card size but makes the file ten times heavier.
	const grains = Int8Array.from({ length: (WIDTH >> 1) * (HEIGHT >> 1) }, () =>
		random() < 0.35 ? (random() < 0.5 ? -GRAIN : GRAIN) : 0
	);

	const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
	for (let y = 0; y < HEIGHT; y++) {
		const row = y * (WIDTH * 3 + 1);
		raw[row] = 1; // "Sub" filter: each byte is stored as its difference from the pixel to its left
		const before = [0, 0, 0];
		for (let x = 0; x < WIDTH; x++) {
			// Every cloud pulls the pixel toward its color, more strongly the nearer it is.
			const pixel = [0, 0, 0];
			let total = 0;
			for (const cloud of clouds) {
				const pull = Math.exp(-((x - cloud.x) ** 2 + (y - cloud.y) ** 2) / (2 * (cloud.reach / 2) ** 2)) + 0.002;
				total += pull;
				for (let i = 0; i < 3; i++) pixel[i] += cloud.color[i] * pull;
			}
			const grain = grains[(y >> 1) * (WIDTH >> 1) + (x >> 1)];
			for (let i = 0; i < 3; i++) {
				const value = Math.max(0, Math.min(255, Math.round(pixel[i] / total) + grain));
				raw[row + 1 + x * 3 + i] = (value - before[i]) & 255;
				before[i] = value;
			}
		}
	}

	const header = Buffer.alloc(13);
	header.writeUInt32BE(WIDTH, 0);
	header.writeUInt32BE(HEIGHT, 4);
	header.set([8, 2, 0, 0, 0], 8); // 8 bits per channel, RGB
	const png = Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0))
	]);
	return new Uint8Array(png.buffer.slice(png.byteOffset, png.byteOffset + png.length) as ArrayBuffer);
}
