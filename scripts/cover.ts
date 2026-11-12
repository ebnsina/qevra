// Draws a cover picture for a course or a post: a soft gradient with a few translucent circles, in
// the green family of the default brand color. Generated when seeding, so the repository carries no
// photographs. Plain PNG, written by hand with Node's zlib; no dependency.
import { crc32, deflateSync } from 'node:zlib';

const WIDTH = 800;
const HEIGHT = 420;

type Rgb = [number, number, number];

function hsl(h: number, s: number, l: number): Rgb {
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
	};
	return [f(0), f(8), f(4)];
}

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
	const hue = 140 + random() * 30; // forest green to teal
	const top = hsl(hue, 0.6, 0.2 + random() * 0.08);
	const bottom = hsl(hue + 14, 0.5, 0.38 + random() * 0.1);
	const circles = Array.from({ length: 4 }, () => ({
		x: random() * WIDTH,
		y: random() * HEIGHT,
		r: 90 + random() * 190,
		light: random() > 0.4,
		alpha: 0.1 + random() * 0.12
	}));

	const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
	for (let y = 0; y < HEIGHT; y++) {
		const row = y * (WIDTH * 3 + 1);
		raw[row] = 0; // no filter on this line
		for (let x = 0; x < WIDTH; x++) {
			const t = (y / HEIGHT) * 0.7 + (x / WIDTH) * 0.3;
			const pixel = top.map((c, i) => c + (bottom[i] - c) * t);
			for (const circle of circles) {
				const distance = Math.hypot(x - circle.x, y - circle.y);
				if (distance > circle.r) continue;
				// Soft edge: full strength inside, fading over the last tenth of the radius.
				const strength = circle.alpha * Math.min(1, (circle.r - distance) / (circle.r * 0.1));
				const toward = circle.light ? 255 : 0;
				for (let i = 0; i < 3; i++) pixel[i] += (toward - pixel[i]) * strength;
			}
			for (let i = 0; i < 3; i++) raw[row + 1 + x * 3 + i] = Math.round(pixel[i]);
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
