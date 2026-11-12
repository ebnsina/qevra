import { describe, expect, it } from 'vitest';
import { embedUrl } from './embed.ts';

describe('embedUrl', () => {
	it.each([
		['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ'],
		['https://youtu.be/aqz-KE-bpKQ?t=10', 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ'],
		['https://m.youtube.com/shorts/aqz-KE-bpKQ', 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ'],
		['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
		['https://iframe.mediadelivery.net/embed/123/abc-def', 'https://iframe.mediadelivery.net/embed/123/abc-def']
	])('turns %s into a player link', (link, player) => {
		expect(embedUrl(link)).toBe(player);
	});

	it.each(['', 'not a link', 'http://youtu.be/aqz-KE-bpKQ', 'https://example.com/video.mp4', 'https://www.youtube.com/watch?v=short', 'javascript:alert(1)'])(
		'rejects %s',
		(link) => {
			expect(embedUrl(link)).toBeNull();
		}
	);
});
