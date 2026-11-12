import * as v from 'valibot';
import { deleteRow, saveRow } from '#lib/server/admin.ts';
import { optionalId, parseForm, requiredText, text, wholeNumber } from '#lib/server/form.ts';

const Review = v.object({
	id: optionalId,
	name: requiredText(80),
	affiliation: text(120),
	body: requiredText(600),
	rating: v.pipe(wholeNumber, v.minValue(1, 'Give 1 to 5 stars'), v.maxValue(5, 'Give 1 to 5 stars')),
	position: wholeNumber
});

export async function load({ locals }) {
	const reviews = await locals.db((tx) => tx<{ id: string; name: string; affiliation: string; body: string; rating: number; position: number }[]>`
		select id, name, affiliation, body, rating, position from reviews order by position, name`);
	return { reviews };
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Review, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		return saveRow(locals.db, 'reviews', id, row);
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'reviews', await request.formData())
};
