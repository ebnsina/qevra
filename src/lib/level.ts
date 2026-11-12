/** Badge color for a course level: beginner blue, intermediate amber, advanced red, anything else gray. */
export function levelTone(level: string) {
	const text = level.toLowerCase();
	if (text.includes('beginner')) return 'accent';
	if (text.includes('intermediate')) return 'warning';
	if (text.includes('advanced')) return 'danger';
	return 'neutral';
}
