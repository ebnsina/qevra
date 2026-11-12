// The main journeys, end to end: a visitor becomes a student, and a paid course opens once staff confirm payment.
import { expect, test, type Page } from '@playwright/test';

const password = 'learn-english-1';

async function register(page: Page, name: string) {
	const email = `${name.toLowerCase()}-${Date.now()}@example.com`;
	await page.goto('/register');
	await page.getByLabel('Full name').fill(name);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page).toHaveURL('/portal');
	return email;
}

/** Fills the sign-in form on the page that is open (so a "return to" address in its link is kept). */
async function signIn(page: Page, email: string, pass: string) {
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(pass);
	await page.getByRole('button', { name: 'Sign in' }).click();
}

test('a visitor signs up, starts a free course and finishes a lesson', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Level up your English');
	await page.goto('/courses/english-for-complete-idiots');
	await expect(page.getByRole('heading', { level: 1, name: 'English for Complete Idiots' })).toBeVisible();

	await register(page, 'Amina');
	await page.goto('/portal/enroll/english-for-complete-idiots');
	await page.getByRole('button', { name: 'Start the course' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'How this course works' })).toBeVisible();

	await page.getByRole('button', { name: 'Mark as complete' }).click();
	await expect(page.getByText('1 of 4 lessons done')).toBeVisible();
});

test('a paid course opens after an admin confirms the payment', async ({ browser }) => {
	const student = await (await browser.newContext()).newPage();
	await register(student, 'Karim');
	await student.goto('/portal/enroll/english-for-beginners');
	await student.getByLabel('Number you paid from').fill('01712345678');
	const transaction = `E2E${Date.now()}`;
	await student.getByLabel('Transaction ID').fill(transaction);
	await student.getByRole('button', { name: 'Submit payment' }).click();
	await expect(student.getByText('We are checking your payment')).toBeVisible();

	// Until it is confirmed, the lessons stay closed.
	await student.goto('/portal/courses/english-for-beginners');
	await expect(student).toHaveURL(/\/portal\/enroll\/english-for-beginners/);

	const admin = await (await browser.newContext()).newPage();
	await admin.goto('/login');
	await signIn(admin, 'admin@example.com', 'admin12345');
	await expect(admin).toHaveURL('/admin');
	await admin.goto('/admin/payments');
	// The row only reacts once the page's scripts have loaded, so press it until its sheet opens.
	const confirm = admin.getByRole('button', { name: 'Confirm and open course' });
	await expect(async () => {
		await admin.getByRole('button', { name: 'Karim' }).click();
		await expect(confirm).toBeVisible({ timeout: 1000 });
	}).toPass();
	await expect(admin.getByRole('dialog').getByText(transaction)).toBeVisible();
	await confirm.click();
	await expect(admin.getByText('No payments are waiting')).toBeVisible();

	await student.goto('/portal/courses/english-for-beginners');
	await expect(student.getByRole('heading', { level: 1, name: 'Introduction to the Noun Phrase' })).toBeVisible();
});

test('students are kept out of the admin area, and visitors out of both', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
	await signIn(page, 'student@example.com', 'student12345');
	await expect(page.getByText('This area is for staff only.')).toBeVisible();
});

test('an enrolled student sees a waiting screen, not an error, while the course has no lessons', async ({ browser }) => {
	const student = await (await browser.newContext()).newPage();
	await register(student, 'Nadia');

	// Staff open a course that has no lessons yet for her.
	const admin = await (await browser.newContext()).newPage();
	await admin.goto('/login');
	await signIn(admin, 'admin@example.com', 'admin12345');
	await expect(admin).toHaveURL('/admin');
	await admin.goto('/admin/students');
	const course = admin.getByLabel('Open a course without payment');
	await expect(async () => {
		await admin.getByRole('button', { name: 'Nadia' }).click();
		await expect(course).toBeVisible({ timeout: 1000 });
	}).toPass();
	await course.selectOption({ label: 'English for Today' });
	await admin.getByRole('button', { name: 'Enroll' }).click();
	await expect(admin.getByText('Course opened for this student.')).toBeVisible();

	await student.goto('/portal/courses/english-for-today');
	await expect(student.getByRole('heading', { level: 1, name: 'English for Today' })).toBeVisible();
	await expect(student.getByText('Lessons are being added')).toBeVisible();
});
