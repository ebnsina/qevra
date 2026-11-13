// How admin screens read and write: TanStack Query over the screen's own server data.
//
//   let { data: loaded } = $props();
//   const admin = adminPage(() => loaded);      // the screen's data, kept fresh in the background
//   const data = $derived(admin.data);
//   const approve = mutating(() => close(), (old, form) => ({ ...old, rows: ... }));   // shown at once, undone if saving fails
//   <form method="post" action="?/approve" onsubmit={approve.submit}>
//
// Forms still post to the page's form actions, so the server code and its validation stay in one place.
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import { parse } from 'devalue';
import { getContext, setContext } from 'svelte';
import { deserialize } from '$app/forms';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { toast } from '#lib/sinaui/ui/toast/index.ts';
import { message } from '#lib/messages.ts';

/** What a form action answers: field errors and typed values on a refusal, a code to explain, or its own flags. */
export interface Result {
	code?: string;
	errors?: Record<string, string>;
	values?: Record<string, string>;
	[key: string]: unknown;
}
const KEY = Symbol('admin page');
// Queries fetch only in the browser; the server render already has the data.
const browser = typeof window !== 'undefined';
interface Context {
	key: () => readonly unknown[];
	report: (result: Result | null) => void;
}

/** The server said no (a validation error or a coded refusal); `data` is what the form action returned. */
class ActionFailed extends Error {
	constructor(readonly data: Result) {
		super('the form action failed');
	}
}

async function read<T>(pathname: string, search: string): Promise<T> {
	const res = await fetch(`/admin/data${pathname.replace(/^\/admin/, '')}${search}`, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`loading ${pathname} failed with ${res.status}`);
	return parse(await res.text()) as T;
}

/** A screen's data: what the server rendered first, then refetched in the background and after every save. */
export function adminPage<T extends object>(loaded: () => T) {
	const key = () => ['admin', page.url.pathname, page.url.search] as const;
	const query = createQuery(() => ({
		queryKey: key(),
		queryFn: ({ queryKey }) => read<T>(queryKey[1], queryKey[2]),
		initialData: loaded(),
		// The server has just rendered it: no refetch on arrival, only when it has had time to change.
		staleTime: 30_000,
		enabled: browser
	}));
	let form = $state<Result | null>(null);
	setContext<Context>(KEY, { key, report: (result) => (form = result) });
	return {
		/** Layout data (settings, the signed-in user) with the screen's own data on top. */
		get data(): T {
			return { ...loaded(), ...query.data };
		},
		/** What the last save answered: `errors` and `values` to show in the form, a `code` to explain, or its own flags. */
		get form() {
			return form;
		}
	};
}

/** The sidebar's waiting counts, refetched after every save anywhere in the admin area. */
export function adminCounts<T extends object>(loaded: () => T) {
	const query = createQuery(() => ({
		queryKey: ['admin', '~layout'],
		queryFn: () => read<T>('/admin/~layout', ''),
		initialData: loaded(),
		staleTime: 30_000,
		enabled: browser
	}));
	return {
		get data(): T {
			return query.data;
		}
	};
}

async function post(action: string, body: FormData): Promise<Result> {
	const res = await fetch(new URL(action, location.href), { method: 'POST', body, headers: { 'x-sveltekit-action': 'true', accept: 'application/json' } });
	const result = deserialize(await res.text());
	if (result.type === 'success') return (result.data ?? {}) as Result;
	if (result.type === 'failure') throw new ActionFailed((result.data ?? {}) as Result);
	if (result.type === 'redirect') {
		await goto(result.location, { invalidateAll: true });
		return {};
	}
	throw new Error(`saving failed with ${result.status ?? res.status}`);
}

/**
 * The screen's data with one row changed, or taken out (`patch` null), in whichever of its lists
 * holds a row with that id. For optimistic updates.
 */
export function withRow<T extends object>(data: T, id: FormDataEntryValue | null, patch: object | null): T {
	const lists = Object.entries(data).map(([name, value]) => {
		if (!Array.isArray(value) || !value.some((row) => row?.id === id)) return [name, value];
		return [name, patch ? value.map((row) => (row.id === id ? { ...row, ...patch } : row)) : value.filter((row) => row.id !== id)];
	});
	return Object.fromEntries(lists) as T;
}

/**
 * One kind of save on a screen. `done` runs once the server has saved it.
 *
 * With `optimistic`, the save is shown before the server answers: `optimistic` returns the screen's
 * data as it will look (it gets the form and which action was pressed), `done` runs at once, and
 * if the server refuses, the data is put back and a message says why.
 */
export function mutating<T extends object = Result>(
	done?: (result: Result) => void,
	optimistic?: (data: T, form: FormData, action: string) => T
) {
	const client = useQueryClient();
	const context = getContext<Context | undefined>(KEY);
	const mutation = createMutation(() => ({
		mutationFn: ({ action, body }: { action: string; body: FormData; form?: HTMLFormElement }) => post(action, body),
		onMutate: async ({ action, body }) => {
			context?.report(null);
			if (!optimistic || !context) return undefined;
			const key = context.key();
			// A refetch already on its way must not overwrite what we are about to show.
			await client.cancelQueries({ queryKey: key });
			const previous = client.getQueryData<T>(key);
			if (previous) client.setQueryData<T>(key, optimistic(previous, body, action));
			done?.({});
			return { key, previous };
		},
		onError: (error, _variables, undo) => {
			if (undo?.previous) client.setQueryData(undo.key, undo.previous);
			const failed = error instanceof ActionFailed ? error.data : { code: 'server_error' };
			context?.report(failed);
			// The change was already on screen: say that it was taken back, and why.
			if (undo?.previous) toast.error(typeof failed.code === 'string' ? message(failed.code) : 'That could not be saved, so it was put back.');
			if (!(error instanceof ActionFailed)) console.error(error);
		},
		onSuccess: (result, { form }) => {
			context?.report(result);
			// As a plain form post would: the form empties, and the refetch fills it with what was saved.
			form?.reset();
			if (!optimistic) done?.(result);
		},
		// Whatever happened, ask the server for the truth: this screen, other screens and the sidebar counts.
		onSettled: () => client.invalidateQueries({ queryKey: ['admin'] })
	}));

	function send(action: string, body: FormData, form?: HTMLFormElement) {
		mutation.mutate({ action, body, form });
	}
	return {
		get busy() {
			return mutation.isPending;
		},
		/** For `<form onsubmit>`: sends the form (and the button that was pressed) without leaving the page. */
		submit(event: SubmitEvent) {
			event.preventDefault();
			const form = event.currentTarget as HTMLFormElement;
			const button = event.submitter as HTMLButtonElement | null;
			send(button?.getAttribute('formaction') ?? form.getAttribute('action') ?? '', new FormData(form, button), form);
		},
		send
	};
}
