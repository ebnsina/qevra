/** The player link for a YouTube, Vimeo or Bunny Stream video page, or null for anything else. */
export function embedUrl(link: string): string | null {
	let url: URL;
	try {
		url = new URL(link.trim());
	} catch {
		return null;
	}
	if (url.protocol !== 'https:') return null;
	const host = url.hostname.replace(/^(www|m)\./, '');
	const parts = url.pathname.split('/').filter(Boolean);

	if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
		const id =
			host === 'youtu.be'
				? parts[0]
				: parts[0] === 'watch'
					? url.searchParams.get('v')
					: ['embed', 'shorts', 'live'].includes(parts[0])
						? parts[1]
						: null;
		return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
	}
	if (host === 'vimeo.com' && /^\d+$/.test(parts[0] ?? '')) return `https://player.vimeo.com/video/${parts[0]}`;
	if (host === 'player.vimeo.com' && parts[0] === 'video' && /^\d+$/.test(parts[1] ?? '')) return url.href;
	if (host === 'iframe.mediadelivery.net' && parts[0] === 'embed') return url.href;
	return null;
}
