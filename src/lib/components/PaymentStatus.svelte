<script lang="ts">
	import Badge from '#lib/sinaui/ui/Badge.svelte';

	let { status }: { status: 'pending' | 'approved' | 'rejected' } = $props();
	const look = { pending: ['warning', 'Waiting'], approved: ['accent', 'Confirmed'], rejected: ['danger', 'Not confirmed'] } as const;
</script>

<Badge tone={look[status][0]}>{look[status][1]}</Badge>
