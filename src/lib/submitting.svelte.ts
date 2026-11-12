import type { SubmitFunction } from '$app/forms';

/** A form's busy flag for `use:enhance`, with an optional callback once the server accepts it. */
export function submitting(onsuccess?: () => void) {
	let busy = $state(false);
	const enhance: SubmitFunction = () => {
		busy = true;
		return async ({ result, update }) => {
			await update();
			busy = false;
			if (result.type === 'success') onsuccess?.();
		};
	};
	return {
		get busy() {
			return busy;
		},
		enhance
	};
}
