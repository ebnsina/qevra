<script lang="ts">
	interface Props {
		/** The points, oldest first. */
		values: number[];
		/** What it shows, read out in place of the drawing ("Visitors, last 7 days: rising"). */
		label: string;
		/** Height in px; it always fills the width it's given. */
		height?: number;
		/** Shade the area under the line. */
		area?: boolean;
		class?: string;
	}

	let { values, label, height = 32, area = true, class: className }: Props = $props();

	// Drawn in a 100×height box and stretched to the width; the stroke keeps its width.
	const path = $derived.by(() => {
		if (values.length < 2) return { line: '', fill: '' };
		const max = Math.max(...values);
		const min = Math.min(...values, 0);
		const span = max - min || 1;
		const pad = 1.5;
		const pts = values.map((v, i) => [
			(i / (values.length - 1)) * 100,
			pad + (1 - (v - min) / span) * (height - pad * 2)
		]);
		const line = pts
			.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`)
			.join(' ');
		return { line, fill: `${line} L100 ${height} L0 ${height} Z` };
	});
</script>

<svg
	class={['sparkline', className]}
	viewBox="0 0 100 {height}"
	preserveAspectRatio="none"
	style:block-size="{height}px"
	role="img"
	aria-label={label}
>
	{#if path.line}
		{#if area}<path class="fill" d={path.fill} />{/if}
		<path class="line" d={path.line} vector-effect="non-scaling-stroke" />
	{:else}
		<line
			class="line flat"
			x1="0"
			x2="100"
			y1={height - 1.5}
			y2={height - 1.5}
			vector-effect="non-scaling-stroke"
		/>
	{/if}
</svg>

<style>
	.sparkline {
		display: block;
		inline-size: 100%;
		overflow: visible;
		color: var(--ui-chart-1, var(--ui-accent));
	}
	.line {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.flat {
		stroke: var(--ui-line);
	}
	.fill {
		fill: currentColor;
		opacity: 0.08;
	}
</style>
