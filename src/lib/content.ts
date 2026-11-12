// The editable website content: its shape, and what a fresh setup starts with.
import * as v from 'valibot';

const line = (max = 200) => v.pipe(v.string(), v.trim(), v.maxLength(max, `Keep this under ${max} characters`));
const needed = (max = 200) => v.pipe(line(max), v.minLength(1, 'This is required'));

export const SettingsSchema = v.object({
	name: needed(60),
	brand_color: v.pipe(v.string(), v.trim(), v.regex(/^#[0-9a-fA-F]{6}$/, 'Enter a color like #0047ab')),
	tagline: line(120),
	description: line(300),
	email: line(120),
	phone: line(40),
	whatsapp: line(40),
	address: line(200),
	facebook: line(200),
	youtube: line(200),
	instagram: line(200),
	bkash_number: line(40),
	nagad_number: line(40),
	payment_note: line(500)
});
/** The logo is uploaded on its own, so it sits beside the form fields rather than in the schema. */
export type Settings = v.InferOutput<typeof SettingsSchema> & { logo_key: string };

export const HomeSchema = v.object({
	badge: line(80),
	title: needed(120),
	lede: line(400),
	cta_label: needed(40),
	facts: line(600),
	trusted_title: line(120),
	about_title: line(120),
	about_text: line(1200),
	about_quote: line(400),
	about_name: line(80),
	about_role: line(120),
	points_title: line(120),
	points: line(1500),
	closing_title: line(120),
	closing_text: line(400)
});
export type Home = v.InferOutput<typeof HomeSchema>;

export const DEFAULT_SETTINGS: Settings = {
	name: 'Your Academy',
	brand_color: '#0047ab',
	logo_key: '',
	tagline: '',
	description: 'Online courses with recorded lessons, live classes, quizzes and certificates.',
	email: '',
	phone: '',
	whatsapp: '',
	address: '',
	facebook: '',
	youtube: '',
	instagram: '',
	bkash_number: '',
	nagad_number: '',
	payment_note: 'Use Send Money, then enter the transaction ID here. We confirm payments within a day.'
};

export const DEFAULT_HOME: Home = {
	badge: '',
	title: 'Learn with us',
	lede: '',
	cta_label: 'See the courses',
	facts: '',
	trusted_title: '',
	about_title: '',
	about_text: '',
	about_quote: '',
	about_name: '',
	about_role: '',
	points_title: '',
	points: '',
	closing_title: 'Not sure which course fits you?',
	closing_text: 'Tell us your goals and we will help you choose.'
};

/** Lines written as "first | second" (facts, points) as pairs; lines without a bar keep an empty second part. */
export function pairs(text: string) {
	return text
		.split('\n')
		.map((row) => row.split('|').map((part) => part.trim()))
		.filter(([first]) => first)
		.map(([first, second = '']) => ({ first, second }));
}
