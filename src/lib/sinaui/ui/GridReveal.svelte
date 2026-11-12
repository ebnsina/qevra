<script lang="ts">
	import { reduced } from './motion';
	import { onDestroy } from 'svelte';

	interface Props {
		/** The finished image; leave unset while it's still being made. */
		src?: string;
		alt: string;
		/** Width ÷ height, so the space is held from the start. */
		ratio?: number;
		/** Called once the finished image is fully in. */
		onrevealed?: () => void;
		/** false hides the "Adding detail" label, when you show progress your own way. */
		status?: boolean;
		class?: string;
	}

	let { src, alt, ratio = 1, onrevealed, status = true, class: className }: Props = $props();

	// A quadtree of tiles: each is a rectangle (fractions of the frame) filled with one color. Splitting
	// the busiest tile first is what makes the picture sharpen where its detail is.
	type Tile = {
		id: string;
		x: number;
		y: number;
		w: number;
		h: number;
		color: string;
		busy: number;
	};
	let tiles = $state<Tile[]>([]);
	let stage = $state<'waiting' | 'detail' | 'done'>('waiting');
	let shown = $state(false);

	let frame = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const stop = () => {
		cancelAnimationFrame(frame);
		clearTimeout(timer);
	};
	onDestroy(stop);

	// While waiting: accent tints splitting at random, so it's plainly at work.
	const tint = () =>
		`color-mix(in oklab, var(--ui-accent) ${Math.round(18 + Math.random() * 50)}%, var(--ui-surface))`;
	function waiting() {
		stop();
		stage = 'waiting';
		shown = false;
		tiles = [{ id: 'r', x: 0, y: 0, w: 1, h: 1, color: tint(), busy: 1 }];
		const grow = () => {
			if (tiles.length < 40) {
				const big = tiles.filter((t) => t.w > 0.1);
				const pick = big[Math.floor(Math.random() * big.length)];
				if (pick)
					tiles = split(
						tiles,
						pick,
						() => tint(),
						() => Math.random()
					);
			} else {
				// Settled: gently recolor a few tiles now and then, like work going on underneath.
				const t = tiles[Math.floor(Math.random() * tiles.length)];
				tiles = tiles.map((x) => (x === t ? { ...x, color: tint() } : x));
			}
			timer = setTimeout(grow, tiles.length < 40 ? 140 : 450);
		};
		if (!reduced()) timer = setTimeout(grow, 200);
	}

	function split(
		list: Tile[],
		t: Tile,
		color: (q: Omit<Tile, 'color' | 'busy' | 'id'>) => string,
		busy: (q: Omit<Tile, 'color' | 'busy' | 'id'>) => number
	) {
		const hw = t.w / 2;
		const hh = t.h / 2;
		const quads = [
			{ x: t.x, y: t.y, w: hw, h: hh },
			{ x: t.x + hw, y: t.y, w: hw, h: hh },
			{ x: t.x, y: t.y + hh, w: hw, h: hh },
			{ x: t.x + hw, y: t.y + hh, w: hw, h: hh }
		].map((q, i) => ({ ...q, id: `${t.id}${i}`, color: color(q), busy: busy(q) }));
		return [...list.filter((x) => x !== t), ...quads];
	}

	// The finished image, read small: each tile's color is the average of its pixels, and how busy it
	// is (color spread times size) decides which splits next.
	async function reveal(url: string) {
		stop();
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = url;
		try {
			await img.decode();
		} catch {
			return finish();
		}
		const W = 64;
		const H = Math.max(1, Math.round(W / ratio));
		const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H });
		const g = canvas.getContext('2d', { willReadFrequently: true })!;
		g.drawImage(img, 0, 0, W, H);
		let px: Uint8ClampedArray;
		try {
			px = g.getImageData(0, 0, W, H).data;
		} catch {
			// Another site's image without permission to read it: fade it in instead.
			return finish();
		}
		const stats = (q: { x: number; y: number; w: number; h: number }) => {
			const x0 = Math.floor(q.x * W),
				x1 = Math.max(x0 + 1, Math.floor((q.x + q.w) * W));
			const y0 = Math.floor(q.y * H),
				y1 = Math.max(y0 + 1, Math.floor((q.y + q.h) * H));
			let r = 0,
				gr = 0,
				b = 0,
				rr = 0,
				n = 0;
			for (let y = y0; y < y1; y++)
				for (let x = x0; x < x1; x++) {
					const i = (y * W + x) * 4;
					r += px[i];
					gr += px[i + 1];
					b += px[i + 2];
					rr += px[i] ** 2 + px[i + 1] ** 2 + px[i + 2] ** 2;
					n++;
				}
			const spread = rr / n - ((r / n) ** 2 + (gr / n) ** 2 + (b / n) ** 2);
			return {
				color: `rgb(${(r / n) | 0} ${(gr / n) | 0} ${(b / n) | 0})`,
				busy: Math.sqrt(Math.max(0, spread)) * q.w * q.h
			};
		};
		const root = { x: 0, y: 0, w: 1, h: 1 };
		tiles = [{ id: 'r', ...root, ...stats(root) }];
		stage = 'detail';
		if (reduced()) return finish();
		// About 150 splits over 1.8 seconds, the busiest tile first each time.
		const start = performance.now();
		let done = 0;
		const step = (now: number) => {
			const want = Math.min(150, Math.round(((now - start) / 1800) * 150));
			while (done < want) {
				const busiest = tiles.reduce((a, t) => (t.busy > a.busy && t.w * W >= 2 ? t : a), tiles[0]);
				if (busiest.w * W < 2) break;
				tiles = split(
					tiles,
					busiest,
					(q) => stats(q).color,
					(q) => stats(q).busy
				);
				done++;
			}
			if (done < 150 && now - start < 2200) frame = requestAnimationFrame(step);
			else finish();
		};
		frame = requestAnimationFrame(step);
	}

	function finish() {
		stage = 'done';
		shown = true;
		timer = setTimeout(() => onrevealed?.(), 500);
	}

	$effect(() => {
		if (src) reveal(src);
		else waiting();
	});

	const words = { waiting: 'Starting to generate', detail: 'Adding detail', done: '' };
</script>

<div
	class={['reveal', className]}
	style:aspect-ratio={ratio}
	role="img"
	aria-label={stage === 'done' ? alt : `${alt}: ${words[stage].toLowerCase()}`}
	aria-busy={stage !== 'done'}
>
	<div class={['tiles', shown && 'gone']} aria-hidden="true">
		{#each tiles as t (t.id)}
			<span
				class="tile"
				style:left="{t.x * 100}%"
				style:top="{t.y * 100}%"
				style:width="{t.w * 100}%"
				style:height="{t.h * 100}%"
				style:--c={t.color}
				style:--r="{Math.min(12, t.w * 40)}px"
			></span>
		{/each}
	</div>
	{#if src}
		<img {src} {alt} class={['final', shown && 'in']} />
	{/if}
	{#if status && stage !== 'done'}
		<span class="status" aria-hidden="true">{words[stage]}</span>
	{/if}
</div>

<style>
	.reveal {
		position: relative;
		overflow: hidden;
		border-radius: var(--ui-radius);
		background: var(--ui-subtle);
	}
	.tiles {
		position: absolute;
		inset: 0;
		transition: opacity 500ms var(--ui-ease-out);
	}
	.tiles.gone {
		opacity: 0;
	}
	/* Each tile is inset by a hair, so the grid shows between them; smaller tiles, smaller corners. */
	.tile {
		position: absolute;
		box-sizing: border-box;
		padding: 1px;
		animation: split 380ms var(--ui-ease-out) backwards;
	}
	.tile::before {
		content: '';
		display: block;
		inline-size: 100%;
		block-size: 100%;
		border-radius: var(--r);
		background: var(--c);
		transition: background-color 600ms ease;
	}
	@keyframes split {
		from {
			opacity: 0.4;
			transform: scale(0.94);
		}
	}
	.final {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
		opacity: 0;
		transform: scale(1.02);
		filter: blur(6px);
		transition:
			opacity 500ms var(--ui-ease-out),
			transform 700ms var(--ui-ease-out),
			filter 500ms var(--ui-ease-out);
	}
	.final.in {
		opacity: 1;
		transform: none;
		filter: none;
	}
	.status {
		position: absolute;
		inset-block-end: 0.75rem;
		inset-inline-start: 0.75rem;
		padding: 0.3125rem 0.625rem;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.45);
		color: #fff;
		font: 500 0.75rem/1 var(--ui-font);
		backdrop-filter: blur(6px);
		animation: pulse 1.6s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.65;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tile,
		.status {
			animation: none;
		}
		.final {
			transform: none;
			filter: none;
		}
	}
</style>
