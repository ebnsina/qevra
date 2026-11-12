// shortcut: one fixed time zone for the whole academy; make it a setting if a setup outside Bangladesh needs it.
export const TIME_ZONE = 'Asia/Dhaka';
export const TIME_ZONE_OFFSET = '+06:00';
const LOCALE = 'en-GB';

const taka = new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: TIME_ZONE });
const dayTime = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE });
const dayOnly = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: TIME_ZONE });
const count = new Intl.NumberFormat(LOCALE);

export const money = (amount: number) => (amount === 0 ? 'Free' : taka.format(amount));
export const date = (value: Date | string) => day.format(new Date(value));
/** A day without its year ("3 Nov"), for chart axes. */
export const dayShort = (value: Date | string) => dayOnly.format(new Date(value));
export const dateTime = (value: Date | string) => dayTime.format(new Date(value));
export const number = (value: number) => count.format(value);
export const plural = (n: number, one: string, many = `${one}s`) => `${count.format(n)} ${n === 1 ? one : many}`;

/** A <input type="datetime-local"> value (academy time) for a stored moment, and back. */
export function toLocalInput(value: Date | string) {
	const shifted = new Date(new Date(value).getTime() + 6 * 3_600_000);
	return shifted.toISOString().slice(0, 16);
}
export const fromLocalInput = (value: string) => new Date(`${value}:00${TIME_ZONE_OFFSET}`);
