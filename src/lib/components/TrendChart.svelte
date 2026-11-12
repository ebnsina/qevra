<script lang="ts">
	// One measure over a run of days, as a line: the overview pages' chart.
	import { areaY, defineChart, lineY } from '@tanstack/charts';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { scalePoint } from '@tanstack/charts/scales/point';
	import { tooltip } from '@tanstack/charts/tooltip';
	import Chart from '#lib/sinaui/ui/Chart.svelte';

	interface Props {
		/** Names the chart for everyone, screen readers included. */
		title: string;
		description?: string;
		/** One label per point, oldest first ("3 Nov"). */
		labels: string[];
		values: number[];
		aspectRatio?: number;
	}
	let { title, description, labels, values, aspectRatio = 3.2 }: Props = $props();

	const definition = $derived.by(() => {
		const points = values.map((value, i) => ({ day: labels[i], value }));
		// About seven evenly spaced day labels, ending on the latest day, however long the run is.
		const step = Math.ceil(labels.length / 7);
		const ticks = labels.filter((_, i) => (labels.length - 1 - i) % step === 0);
		return defineChart({
			marks: [areaY(points, { x: 'day', y: 'value', fillOpacity: 0.08 }), lineY(points, { x: 'day', y: 'value', strokeWidth: 2 })],
			scales: {
				x: { scale: () => scalePoint<string>().padding(0.2), axis: { ticks: { values: ticks } } },
				y: { scale: scaleLinear, nice: true, grid: true, axis: { ticks: { count: 4 } } }
			},
			tooltip
		});
	});
</script>

<Chart {title} {description} {definition} {aspectRatio} />
