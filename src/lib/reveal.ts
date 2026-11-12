// Scroll reveal for the public site: section heads and cards fade and rise in as they enter the view.
// Styles live in app.css and only apply once JavaScript is running (the .js flag set in app.html).
const TARGETS = '.reveal, .site-card';

/** Watches the targets on the page now. Returns a function that stops watching. */
export function reveal() {
	const elements = [...document.querySelectorAll<HTMLElement>(TARGETS)].filter((el) => !el.classList.contains('in'));
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('in');
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -8% 0px' }
	);
	for (const el of elements) {
		// Already on screen when the page opens: show at once, nothing above the fold waits.
		if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in', 'instant');
		else observer.observe(el);
	}
	return () => observer.disconnect();
}
