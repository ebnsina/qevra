import { marked } from 'marked';

/** Markdown to HTML. Only staff write this content, so it is trusted and not sanitized. */
export function renderMarkdown(source: string) {
	// Text written in the admin's editor is already HTML; older and seeded text is Markdown.
	if (source.trimStart().startsWith('<')) return source;
	return marked.parse(source, { async: false });
}
