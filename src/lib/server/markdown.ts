import { marked } from 'marked';

/** Markdown to HTML. Only staff write this content, so it is trusted and not sanitized. */
export function renderMarkdown(source: string) {
	return marked.parse(source, { async: false });
}
