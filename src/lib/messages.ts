// Every error code the server returns, in plain words. The server never sends raw error text.
const MESSAGES = {
	email_taken: 'An account with this email already exists. Sign in instead.',
	bad_login: "That email and password don't match. Check both and try again.",
	too_many_attempts: 'Too many failed attempts. Wait 15 minutes and try again. If you forgot your password, message us and we will set a new one.',
	reset_expired: 'This reset link has been used or has expired. Ask for a new one.',
	wrong_password: 'Your current password is not right.',
	file_missing: 'Choose a file first.',
	file_not_image: 'Upload a JPG, PNG or WebP image.',
	file_type: 'Upload a PDF, Word document, JPG, PNG or WebP file.',
	file_too_large: 'That file is over 4 MB. Choose a smaller one.',
	slug_taken: 'Another item already uses this web address. Pick a different one.',
	in_use: "This can't be deleted because students have records attached to it. Unpublish it instead.",
	transaction_used: 'This transaction ID was already submitted. Check it and try again.',
	payment_pending: 'You already sent a payment for this course. We are checking it.',
	coupon_invalid: "That coupon can't be used on this course any more. Remove it and try again.",
	already_enrolled: 'You are already enrolled in this course.',
	already_reviewed: 'This was already reviewed, so it can no longer be changed.',
	not_found: "We couldn't find that. It may have been removed."
} as const;

export type ErrorCode = keyof typeof MESSAGES;

export function message(code: string | undefined | null) {
	if (!code) return '';
	return (MESSAGES as Record<string, string>)[code] ?? 'Something went wrong. Please try again.';
}
