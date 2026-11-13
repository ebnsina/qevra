import {
	type AnyCalendarDate,
	type Calendar,
	type CalendarIdentifier,
	CalendarDate,
	DateFormatter,
	GregorianCalendar,
	getLocalTimeZone,
	toCalendar
} from '@internationalized/date';

/**
 * The Bengali calendar (Bangabda) as Bangladesh keeps it. The year starts on Pohela Boishakh, 14 April,
 * and is the Gregorian year - 593. Month lengths follow the Bangla Academy's rules: the 2019 revision
 * from 1426 BS (Boishakh–Ashwin 31, Falgun 29 or 30 in a leap year, the rest 30), the 1987 rules
 * before it (Boishakh–Bhadro 31, Falgun 31 in a leap year, the rest 30). Not West Bengal's calendar,
 * which is astronomical. Browsers' Intl has no Bangla calendar, so this plugs one into
 * @internationalized/date, which does all the arithmetic.
 */
const gregorian = new GregorianCalendar();
const OFFSET = 593;
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const REVISED = 1426; // first year of the 2019 revision
// Boishakh … Choitro. Falgun is the 11th month and falls in the February of Gregorian year + 594.
// prettier-ignore
const monthLengths = (year: number) => {
	const leap = isLeap(year + OFFSET + 1);
	return year >= REVISED
		? [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30]
		: [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, leap ? 31 : 30, 30];
};
const newYear = (year: number) => gregorian.toJulianDay(new CalendarDate(year + OFFSET, 4, 14));

export class BanglaCalendar implements Calendar {
	identifier = 'bangla' as CalendarIdentifier;

	fromJulianDay(jd: number): CalendarDate {
		let year = gregorian.fromJulianDay(jd).year - OFFSET;
		if (jd < newYear(year)) year--;
		let day = jd - newYear(year);
		let month = 0;
		const lengths = monthLengths(year);
		while (day >= lengths[month]) day -= lengths[month++];
		return new CalendarDate(this, 'BS', year, month + 1, day + 1);
	}
	toJulianDay(date: AnyCalendarDate): number {
		const lengths = monthLengths(date.year);
		let jd = newYear(date.year);
		for (let m = 0; m < date.month - 1; m++) jd += lengths[m];
		return jd + date.day - 1;
	}
	getDaysInMonth(date: AnyCalendarDate) {
		return monthLengths(date.year)[date.month - 1];
	}
	getMonthsInYear() {
		return 12;
	}
	getYearsInEra() {
		return 9999;
	}
	getEras() {
		return ['BS'];
	}
	getMaximumMonthsInYear() {
		return 12;
	}
	getMaximumDaysInMonth() {
		return 31;
	}
	isEqual(other: Calendar) {
		return other.identifier === this.identifier;
	}
}

export const MONTHS_BN = [
	'বৈশাখ',
	'জ্যৈষ্ঠ',
	'আষাঢ়',
	'শ্রাবণ',
	'ভাদ্র',
	'আশ্বিন',
	'কার্তিক',
	'অগ্রহায়ণ',
	'পৌষ',
	'মাঘ',
	'ফাল্গুন',
	'চৈত্র'
];
const MONTHS_EN = [
	'Boishakh',
	'Joishtho',
	'Asharh',
	'Srabon',
	'Bhadro',
	'Ashwin',
	'Kartik',
	'Ogrohayon',
	'Poush',
	'Magh',
	'Falgun',
	'Choitro'
];

/** A calendar system plus how to write its dates, for calendars Intl can't format. */
export interface CustomCalendar {
	system: Calendar;
	/** Month and year (heading), or a full date with the day and optionally the weekday. */
	format(date: CalendarDate, locale: string, parts?: { day?: boolean; weekday?: boolean }): string;
	/** Numbers in the calendar's own digits (day numbers in the grid). */
	digits(locale: string): Intl.NumberFormat;
}

export const bangla: CustomCalendar = {
	system: new BanglaCalendar(),
	// Asked for by name: WebKit's default digits for Bangla are Latin, Chromium's are Bangla.
	digits: (locale) =>
		new Intl.NumberFormat(locale, {
			useGrouping: false,
			numberingSystem: locale.startsWith('bn') ? 'beng' : undefined
		}),
	format(date, locale, { day = true, weekday = false } = {}) {
		const bn = locale.startsWith('bn');
		const n = this.digits(locale);
		const d = toCalendar(date, this.system);
		const main = [
			day && n.format(d.day),
			(bn ? MONTHS_BN : MONTHS_EN)[d.month - 1],
			`${n.format(d.year)}${day ? (bn ? ' বঙ্গাব্দ' : ' BS') : ''}`
		]
			.filter(Boolean)
			.join(' ');
		if (!weekday) return main;
		// Weekday names don't depend on the calendar: Intl has them in every locale.
		const name = new DateFormatter(locale, { weekday: 'long' }).format(
			d.toDate(getLocalTimeZone())
		);
		return `${name}, ${main}`;
	}
};
