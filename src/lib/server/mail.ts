import nodemailer from 'nodemailer';
import { MAIL_FROM, MAIL_SMTP_URL } from '$app/env/private';

const transport = nodemailer.createTransport(MAIL_SMTP_URL);

export async function sendMail(to: string, subject: string, text: string) {
	await transport.sendMail({ from: MAIL_FROM, to, subject, text });
}
