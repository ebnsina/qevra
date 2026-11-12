/** White or near-black, whichever reads better on the given #rrggbb color (WCAG contrast). */
export function onColor(hex: string) {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	const withWhite = 1.05 / (luminance + 0.05);
	const withInk = (luminance + 0.05) / 0.055;
	return withWhite >= withInk ? '#ffffff' : '#0f0f10';
}
