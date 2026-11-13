<script lang="ts">
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data, form } = $props();
	const working = (c: (typeof data.coupons)[number]) =>
		c.active && (!c.expires_at || new Date(c.expires_at) > new Date()) && (c.max_uses === null || c.uses < c.max_uses);
</script>

<Seo title="Coupons | Admin" description="Discount codes for course fees." noindex />

<CrudPage
	title="Coupons"
	noun="coupon"
	empty="Make a discount code to share. Students type it when they enroll, and the fee they are asked to pay goes down."
	items={data.coupons}
	defaults={{ active: true }}
	{form}
	columns={[
		{ label: 'Code', text: (c) => c.code },
		{ label: 'Discount', text: (c) => `${c.percent_off}%`, numeric: true },
		{ label: 'Works on', text: (c) => c.course ?? 'Every course' },
		{ label: 'Used', text: (c) => (c.max_uses ? `${c.uses} of ${c.max_uses}` : String(c.uses)), numeric: true },
		{ label: 'Ends', text: (c) => (c.expires_at ? date(c.expires_at) : 'No end date') },
		{ label: 'Status' }
	]}
	fields={[
		{ name: 'code', label: 'Code', placeholder: 'WELCOME10', required: true, hint: 'What students type, like WELCOME10. Capitals or not, it works the same.' },
		{ name: 'percent_off', label: 'Percent off', placeholder: '10', type: 'number', required: true, hint: '1 to 100.' },
		{ name: 'course_id', label: 'Works on', type: 'select', options: [{ value: '', label: 'Every course' }, ...data.courses.map((c) => ({ value: c.id, label: c.title }))] },
		{ name: 'expires_at', label: 'Ends (Bangladesh time)', type: 'datetime', hint: 'Leave empty for no end date.' },
		{ name: 'max_uses', label: 'How many times it can be used', placeholder: '100', type: 'number', hint: 'Leave empty for no limit. Payments you could not confirm do not count.' },
		{ name: 'active', label: 'Switched on', type: 'switch', hint: 'Off stops the code working without deleting it.' }
	]}
>
	{#snippet cell(coupon)}
		<Badge tone={working(coupon) ? 'accent' : 'neutral'}>{working(coupon) ? 'Working' : 'Not working'}</Badge>
	{/snippet}
</CrudPage>
