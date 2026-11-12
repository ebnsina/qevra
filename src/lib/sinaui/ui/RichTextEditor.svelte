<script lang="ts">
	import {
		ArrowTurnBackwardIcon,
		ArrowTurnForwardIcon,
		Heading02Icon,
		Heading03Icon,
		LeftToRightListBulletIcon,
		LeftToRightListNumberIcon,
		Link01Icon,
		QuoteDownIcon,
		SourceCodeIcon,
		TextBoldIcon,
		TextItalicIcon,
		TextStrikethroughIcon,
		Unlink01Icon
	} from '@hugeicons/core-free-icons';
	import { Editor, type AnyExtension } from '@tiptap/core';
	import { Placeholder } from '@tiptap/extensions';
	import StarterKit from '@tiptap/starter-kit';
	import { onMount, tick } from 'svelte';
	import { isApple } from './announce';
	import Button from './Button.svelte';
	import { place } from './floating';
	import Icon from './Icon.svelte';
	import { ease, reduced } from './motion';
	import { scrollEdges } from './scroll-edges';
	import Toolbar from './Toolbar.svelte';
	import Tooltip from './Tooltip.svelte';

	interface Props {
		/** Names the editor ("Notes"). Shown above it unless hideLabel. */
		label: string;
		hideLabel?: boolean;
		/** The content as HTML. */
		html?: string;
		placeholder?: string;
		/** Shows a "120 / 500" count, amber near the limit and red past it. */
		maxLength?: number;
		/** More Tiptap extensions (an image node, mentions), added after the built-in ones. */
		extensions?: AnyExtension[];
		class?: string;
	}

	let {
		label,
		hideLabel = false,
		html = $bindable(''),
		placeholder = 'Write something…',
		maxLength,
		extensions = [],
		class: className
	}: Props = $props();

	const id = $props.id();
	let editor = $state<Editor>();
	let host: HTMLDivElement;
	let box: HTMLDivElement;
	let spot: HTMLSpanElement;
	let bubble: HTMLDivElement;
	let urlInput = $state<HTMLInputElement>();
	// Bumped on every editor change, so the pressed states and count re-read the editor.
	let version = $state(0);
	let bubbleOpen = false;
	let linkMode = $state(false);
	let url = $state('');
	let apple = $state(false);
	let lastHtml = html;

	/** Puts HTML in at the cursor (or the end, if the editor hasn't been focused yet). */
	export function insert(content: string) {
		editor?.chain().focus().insertContent(content).run();
	}
	/** The Tiptap editor itself, for commands this component doesn't wrap (a slash menu). */
	export function tiptap() {
		return editor;
	}

	const active = (name: string, attrs?: object) => (void version, editor?.isActive(name, attrs));
	const count = $derived((void version, editor?.state.doc.textContent.length ?? 0));

	// Shown and hidden by the selection alone (not by outside presses): a double-click that selects a
	// word is a press in the editor, and must open the menu, not dismiss it.
	const at = { side: 'top', align: 'center', gap: 8 } as const;
	let anim: Animation | undefined;
	function showBubble() {
		anim?.cancel();
		bubble.showPopover();
		place(spot, bubble, at);
		anim = bubble.animate(
			reduced()
				? [{ opacity: 0 }, { opacity: 1 }]
				: [
						{ opacity: 0, translate: '0 6px', scale: 0.94 },
						{ opacity: 1, offset: 0.3 },
						{ opacity: 1, translate: '0 0', scale: 1 }
					],
			{ duration: reduced() ? 150 : 480, easing: ease.spring }
		);
	}
	function closeBubble() {
		anim?.cancel();
		anim = bubble.animate([{}, { opacity: 0, scale: 0.97 }], {
			duration: 130,
			easing: ease.standard,
			fill: 'forwards'
		});
		anim.onfinish = () => {
			bubble.hidePopover();
			anim?.cancel();
		};
	}

	// The selection's box, relative to the field: the bubble menu floats above it.
	function placeSpot() {
		if (!editor) return;
		const { from, to } = editor.state.selection;
		const a = editor.view.coordsAtPos(from);
		const b = editor.view.coordsAtPos(to);
		const r = box.getBoundingClientRect();
		const left = Math.min(a.left, b.left);
		spot.style.left = `${left - r.left}px`;
		spot.style.top = `${Math.min(a.top, b.top) - r.top}px`;
		spot.style.width = `${Math.max(1, Math.max(a.right, b.right) - left)}px`;
		spot.style.height = `${Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)}px`;
	}
	function hideBubble() {
		if (!bubbleOpen) return;
		bubbleOpen = false;
		linkMode = false;
		closeBubble();
	}
	function syncBubble() {
		if (!editor) return;
		const focused = editor.isFocused || bubble.contains(document.activeElement);
		if ((!editor.state.selection.empty && focused) || linkMode) {
			placeSpot();
			if (bubbleOpen) place(spot, bubble, at);
			else {
				bubbleOpen = true;
				showBubble();
			}
		} else hideBubble();
	}

	async function openLink() {
		if (!editor) return;
		url = editor.getAttributes('link').href ?? '';
		linkMode = true;
		syncBubble();
		await tick();
		urlInput?.focus();
		urlInput?.select();
	}
	function applyLink(e: SubmitEvent) {
		e.preventDefault();
		if (!editor) return;
		const raw = url.trim();
		// "example.org" means the web address, not a page on this site.
		const href = raw && !/^[a-z][a-z\d+.-]*:|^[/#]/i.test(raw) ? `https://${raw}` : raw;
		const chain = editor.chain().focus().extendMarkRange('link');
		if (!href) chain.unsetLink().run();
		else if (editor.state.selection.empty && !editor.isActive('link'))
			chain
				.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
				.run();
		else chain.setLink({ href }).run();
		linkMode = false;
		syncBubble();
	}

	onMount(() => {
		apple = isApple();
		const ed = new Editor({
			element: host,
			content: html,
			extensions: [
				StarterKit.configure({ link: { openOnClick: false, defaultProtocol: 'https' } }),
				Placeholder.configure({ placeholder }),
				...extensions
			],
			editorProps: {
				attributes: {
					role: 'textbox',
					'aria-multiline': 'true',
					'aria-labelledby': `${id}-label`,
					...(maxLength ? { 'aria-describedby': `${id}-count` } : {})
				},
				handleKeyDown: (_view, e) => {
					if (e.key.toLowerCase() === 'k' && (isApple() ? e.metaKey : e.ctrlKey)) {
						// Inside the editor ⌘K means "link": keep it from page-wide shortcuts (search).
						e.preventDefault();
						e.stopPropagation();
						openLink();
						return true;
					}
					return false;
				}
			},
			onTransaction: () => version++,
			onUpdate: ({ editor }) => {
				lastHtml = html = editor.getHTML();
			},
			onSelectionUpdate: syncBubble,
			onFocus: syncBubble,
			onBlur: ({ event }) => {
				if (!bubble.contains(event.relatedTarget as Node)) hideBubble();
			}
		});
		editor = ed;
		// It stays over the selection while the page or the editor scrolls.
		const follow = () => bubbleOpen && (placeSpot(), place(spot, bubble, at));
		addEventListener('scroll', follow, true);
		addEventListener('resize', follow);
		return () => {
			removeEventListener('scroll', follow, true);
			removeEventListener('resize', follow);
			anim?.cancel();
			ed.destroy();
		};
	});

	// Content set from outside (a reset, a loaded draft) replaces what's in the editor.
	$effect(() => {
		if (editor && html !== lastHtml) {
			lastHtml = html;
			editor.commands.setContent(html, { emitUpdate: false });
		}
	});

	type Tool = {
		name: string;
		icon: typeof TextBoldIcon;
		keys: string;
		isOn?: () => boolean | undefined;
		run: (e: Editor) => void;
	};
	const tools: (Tool | 'sep')[] = [
		{
			name: 'Bold',
			icon: TextBoldIcon,
			keys: 'B',
			isOn: () => active('bold'),
			run: (e) => e.chain().focus().toggleBold().run()
		},
		{
			name: 'Italic',
			icon: TextItalicIcon,
			keys: 'I',
			isOn: () => active('italic'),
			run: (e) => e.chain().focus().toggleItalic().run()
		},
		{
			name: 'Strikethrough',
			icon: TextStrikethroughIcon,
			keys: 'Shift+S',
			isOn: () => active('strike'),
			run: (e) => e.chain().focus().toggleStrike().run()
		},
		{
			name: 'Code',
			icon: SourceCodeIcon,
			keys: 'E',
			isOn: () => active('code'),
			run: (e) => e.chain().focus().toggleCode().run()
		},
		'sep',
		{
			name: 'Heading',
			icon: Heading02Icon,
			keys: 'Alt+2',
			isOn: () => active('heading', { level: 2 }),
			run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run()
		},
		{
			name: 'Subheading',
			icon: Heading03Icon,
			keys: 'Alt+3',
			isOn: () => active('heading', { level: 3 }),
			run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run()
		},
		{
			name: 'Bulleted list',
			icon: LeftToRightListBulletIcon,
			keys: 'Shift+8',
			isOn: () => active('bulletList'),
			run: (e) => e.chain().focus().toggleBulletList().run()
		},
		{
			name: 'Numbered list',
			icon: LeftToRightListNumberIcon,
			keys: 'Shift+7',
			isOn: () => active('orderedList'),
			run: (e) => e.chain().focus().toggleOrderedList().run()
		},
		{
			name: 'Quote',
			icon: QuoteDownIcon,
			keys: 'Shift+B',
			isOn: () => active('blockquote'),
			run: (e) => e.chain().focus().toggleBlockquote().run()
		},
		'sep',
		{
			name: 'Link',
			icon: Link01Icon,
			keys: 'K',
			isOn: () => active('link'),
			run: () => openLink()
		},
		'sep',
		{
			name: 'Undo',
			icon: ArrowTurnBackwardIcon,
			keys: 'Z',
			run: (e) => e.chain().focus().undo().run()
		},
		{
			name: 'Redo',
			icon: ArrowTurnForwardIcon,
			keys: 'Shift+Z',
			run: (e) => e.chain().focus().redo().run()
		}
	];
	const bubbleTools = tools.filter(
		(t): t is Tool => t !== 'sep' && ['Bold', 'Italic', 'Code'].includes(t.name)
	);
	const near = $derived(!!maxLength && count >= maxLength * 0.9);
	const over = $derived(!!maxLength && count > maxLength);
	const number = new Intl.NumberFormat();
	// "Shift+Z" reads ⌘⇧Z on a Mac and Ctrl+Shift+Z elsewhere.
	const shortcut = (keys: string) =>
		apple ? '⌘' + keys.replace('Shift+', '⇧').replace('Alt+', '⌥') : 'Ctrl+' + keys;
</script>

{#snippet toolButton(t: Tool)}
	<Tooltip text="{t.name}  {shortcut(t.keys)}">
		{#snippet trigger(props)}
			<Button
				variant="ghost"
				size="sm"
				square
				aria-label={t.name}
				aria-pressed={t.isOn ? !!t.isOn() : undefined}
				{...props}
				onpointerdown={(e: PointerEvent) => e.preventDefault()}
				onclick={() => editor && t.run(editor)}
			>
				<Icon icon={t.icon} size={18} />
			</Button>
		{/snippet}
	</Tooltip>
{/snippet}

<div class={['rte', className]}>
	<span class={['label', hideLabel && 'sr']} id="{id}-label">{label}</span>
	<div class={['box', over && 'over']} bind:this={box}>
		<Toolbar label="Formatting" class="rte-bar">
			{#each tools as t, i (i)}
				{#if t === 'sep'}<span role="separator"></span>{:else}{@render toolButton(t)}{/if}
			{/each}
		</Toolbar>
		<div class="surface" {@attach scrollEdges} data-fade>
			<div class="content" bind:this={host}></div>
		</div>
		{#if maxLength}
			<p class={['count', near && 'near', over && 'over']} id="{id}-count">
				{number.format(count)} / {number.format(maxLength)}
			</p>
		{/if}
		<!-- An invisible box over the selection, for the bubble menu to float above. -->
		<span class="spot" bind:this={spot} aria-hidden="true"></span>
	</div>

	<!-- Floats over a selection: quick formatting, or the link field. -->
	<div class="bubble" popover="manual" bind:this={bubble}>
		{#if linkMode}
			<form class="link" novalidate onsubmit={applyLink}>
				<input
					bind:this={urlInput}
					bind:value={url}
					type="url"
					inputmode="url"
					placeholder="https://"
					aria-label="Link address"
					onkeydown={(e) => {
						if (e.key === 'Escape') {
							e.preventDefault();
							linkMode = false;
							editor?.commands.focus();
						}
					}}
				/>
				<Button size="sm" type="submit">Apply</Button>
				{#if active('link')}
					<Button
						variant="ghost"
						size="sm"
						square
						aria-label="Remove link"
						onclick={() => {
							url = '';
							editor?.chain().focus().extendMarkRange('link').unsetLink().run();
							linkMode = false;
						}}><Icon icon={Unlink01Icon} size={18} /></Button
					>
				{/if}
			</form>
		{:else}
			{#each bubbleTools as t (t.name)}
				<Button
					variant="ghost"
					size="sm"
					square
					aria-label={t.name}
					aria-pressed={!!t.isOn?.()}
					onpointerdown={(e: PointerEvent) => e.preventDefault()}
					onclick={() => editor && t.run(editor)}><Icon icon={t.icon} size={18} /></Button
				>
			{/each}
			<Button
				variant="ghost"
				size="sm"
				square
				aria-label="Link"
				aria-pressed={!!active('link')}
				onpointerdown={(e: PointerEvent) => e.preventDefault()}
				onclick={openLink}><Icon icon={Link01Icon} size={18} /></Button
			>
		{/if}
	</div>
</div>

<style>
	.rte {
		display: grid;
		gap: 0.25rem;
		min-inline-size: 0;
		color: var(--ui-fg);
		font: var(--ui-font-size)/1.5 var(--ui-font);
	}
	.label {
		font-weight: 500;
	}
	.sr {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	/* A field: the one bordered surface, with its toolbar tinted inside it. */
	.box {
		position: relative;
		display: grid;
		min-inline-size: 0;
		border: 1px solid var(--ui-field-line);
		border-radius: var(--ui-radius);
		background: var(--ui-surface);
	}
	.box:has(:global(.ProseMirror-focused)) {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.box.over {
		border-color: var(--ui-danger);
		outline-color: var(--ui-danger);
	}
	.box :global(.rte-bar) {
		margin: 0.25rem;
		border-radius: calc(var(--ui-radius) - 0.125rem);
	}
	.surface {
		max-block-size: 24rem;
		overflow: auto;
	}
	.count {
		margin: 0;
		padding: 0 0.875rem 0.5rem;
		color: var(--ui-muted);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
		text-align: end;
		transition: color var(--ui-dur) ease;
	}
	.count.near {
		color: var(--ui-warning);
	}
	.count.over {
		color: var(--ui-danger);
	}
	.spot {
		position: absolute;
		pointer-events: none;
	}

	/* The writing surface. 16px so iOS Safari doesn't zoom on focus. */
	.content :global(.ProseMirror) {
		min-block-size: 8rem;
		padding: 0.625rem 0.875rem 0.875rem;
		outline: none;
		font-size: var(--ui-control-font);
		line-height: 1.6;
		overflow-wrap: anywhere;
	}
	.content :global(.ProseMirror > * + *) {
		margin-block-start: 0.75em;
	}
	.content :global(.ProseMirror > *) {
		margin-block-end: 0;
	}
	.content :global(p) {
		margin: 0;
	}
	.content :global(h2),
	.content :global(h3) {
		margin: 1.25em 0 0;
		line-height: 1.3;
		letter-spacing: -0.01em;
	}
	.content :global(h2) {
		font-size: 1.375em;
		font-weight: 650;
	}
	.content :global(h3) {
		font-size: 1.125em;
	}
	.content :global(.ProseMirror > :first-child) {
		margin-block-start: 0;
	}
	.content :global(ul),
	.content :global(ol) {
		margin: 0;
		padding-inline-start: 1.5em;
	}
	/* Set here, not left to the browser: CSS resets like Tailwind's remove list markers. */
	.content :global(ul) {
		list-style: disc;
	}
	.content :global(ol) {
		list-style: decimal;
	}
	.content :global(li + li) {
		margin-block-start: 0.25em;
	}
	.content :global(li p) {
		margin: 0;
	}
	.content :global(blockquote) {
		margin-inline: 0;
		padding-inline-start: 1em;
		border-inline-start: 3px solid color-mix(in srgb, var(--ui-accent) 40%, transparent);
		color: var(--ui-muted);
	}
	.content :global(code) {
		padding: 0.1em 0.3em;
		border-radius: 0.25rem;
		background: var(--ui-subtle);
		font-size: 0.875em;
	}
	.content :global(pre) {
		padding: 0.75em 1em;
		border-radius: var(--ui-radius-control);
		background: var(--ui-subtle);
		overflow-x: auto;
	}
	.content :global(pre code) {
		padding: 0;
		background: none;
	}
	.content :global(a) {
		color: color-mix(in srgb, var(--ui-accent) 80%, var(--ui-fg));
		text-underline-offset: 0.2em;
		cursor: text;
	}
	.content :global(p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: inline-start;
		block-size: 0;
		color: var(--ui-muted);
		pointer-events: none;
	}

	/* Separated by shadow, like every other overlay. */
	.bubble {
		position: fixed;
		inset: auto;
		margin: 0;
		display: none;
		gap: 0.125rem;
		padding: 0.25rem;
		border: 1px solid transparent;
		border-radius: var(--ui-radius);
		background: var(--ui-surface-overlay);
		color: var(--ui-fg);
		box-shadow: var(--ui-shadow-overlay);
	}
	.bubble:popover-open {
		display: flex;
	}
	.link {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.link input {
		inline-size: 14rem;
		min-block-size: 2rem;
		padding: 0 0.5rem;
		border: 1px solid var(--ui-field-line);
		border-radius: var(--ui-radius-control);
		outline: none;
		background: var(--ui-surface);
		color: inherit;
		font: inherit;
		font-size: var(--ui-control-font);
	}
	.link input:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: 1px;
	}
</style>
