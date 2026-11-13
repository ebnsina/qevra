// The main journeys, end to end: a visitor becomes a student, and a paid course opens once staff confirm payment.
import { expect, test, type Page } from '@playwright/test';

const password = 'learn-english-1';

async function register(page: Page, name: string) {
	const email = `${name.toLowerCase()}-${Date.now()}@example.com`;
	await page.goto('/register');
	await page.getByLabel('Full name').fill(name);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Phone').fill('+880 1700-000000');
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
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn the English you will actually use');
	await page.goto('/courses/english-from-scratch');
	await expect(page.getByRole('heading', { level: 1, name: 'English from Scratch' })).toBeVisible();

	await register(page, 'Amina');
	await page.goto('/portal/enroll/english-from-scratch');
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
	// The list empties at once (before the server answers), so also wait for the save itself.
	const saved = admin.waitForResponse((response) => response.url().includes('?/approve'));
	await confirm.click();
	await expect(admin.getByText('No payments are waiting')).toBeVisible();
	expect((await saved).ok()).toBe(true);

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
	const course = admin.getByRole('combobox', { name: 'Open a course without payment' });
	await expect(async () => {
		await admin.getByRole('button', { name: 'Nadia' }).click();
		await expect(course).toBeVisible({ timeout: 1000 });
	}).toPass();
	await course.click();
	await admin.getByRole('option', { name: 'Everyday Spoken English' }).click();
	await admin.getByRole('button', { name: 'Enroll' }).click();
	await expect(admin.getByText('Course opened for this student.')).toBeVisible();

	await student.goto('/portal/courses/everyday-spoken-english');
	await expect(student.getByRole('heading', { level: 1, name: 'Everyday Spoken English' })).toBeVisible();
	await expect(student.getByText('Lessons are being added')).toBeVisible();
});

test('a coupon lowers the fee, and a question under a lesson gets the teacher\'s answer', async ({ browser }) => {
	const student = await (await browser.newContext()).newPage();
	await register(student, 'Rafi');

	// WELCOME10 takes 10% off the fee.
	await student.goto('/portal/enroll/english-for-job-seekers?coupon=welcome10');
	await expect(student.getByText('Coupon WELCOME10 applied: 10% off')).toBeVisible();
	await student.goto('/portal/enroll/english-for-job-seekers?coupon=NOSUCHCODE');
	await expect(student.getByText("That code can't be used on this course")).toBeVisible();

	// Join the free course and ask a question under its first lesson.
	await student.goto('/portal/enroll/english-from-scratch');
	await student.getByRole('button', { name: 'Start the course' }).click();
	const question = `Is there homework? ${Date.now()}`;
	await expect(async () => {
		await student.getByLabel('Your question').fill(question);
		await student.getByRole('button', { name: 'Ask', exact: true }).click();
		await expect(student.getByText(question)).toBeVisible({ timeout: 3000 });
	}).toPass();

	const admin = await (await browser.newContext()).newPage();
	await admin.goto('/login');
	await signIn(admin, 'admin@example.com', 'admin12345');
	await expect(admin).toHaveURL('/admin');
	await admin.goto('/admin/questions');
	const answerBox = admin.getByLabel('Your answer');
	await expect(async () => {
		await admin.getByRole('button', { name: question }).click();
		await expect(answerBox).toBeVisible({ timeout: 1000 });
	}).toPass();
	await answerBox.fill('Yes: one short task after each section.');
	await admin.getByRole('button', { name: 'Post answer' }).click();
	await expect(admin.getByText('No questions are waiting')).toBeVisible();

	await student.reload();
	await expect(student.getByText('Yes: one short task after each section.')).toBeVisible();
	await expect(student.getByText('Teacher', { exact: true })).toBeVisible();
});

test('a post is written on its own editor page', async ({ page }) => {
	await page.goto('/login');
	await signIn(page, 'admin@example.com', 'admin12345');
	await expect(page).toHaveURL('/admin');
	await page.goto('/admin/posts/new');
	const slug = `how-to-practise-${Date.now()}`;
	await page.getByLabel('Title').fill('How to practise every day');
	await page.getByLabel('Web address').fill(slug);
	await page.getByRole('button', { name: 'Create post' }).click();
	await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}\?saved/);
	await expect(page.getByText('Saved.')).toBeVisible();
	await expect(page.getByRole('heading', { level: 1, name: 'How to practise every day' })).toBeVisible();
});

test('the course list narrows to free courses', async ({ page }) => {
	await page.goto('/courses');
	await expect(async () => {
		await page.getByRole('radio', { name: 'Free' }).check({ force: true });
		await expect(page.getByText('Showing 1 course', { exact: true })).toBeVisible({ timeout: 1000 });
	}).toPass();
	await expect(page.getByRole('link', { name: /English from Scratch/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /English for Job Seekers/ })).toBeHidden();
});

test('analytics follows the chosen period', async ({ page }) => {
	await page.goto('/login?next=/admin/analytics');
	await signIn(page, 'admin@example.com', 'admin12345');
	await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
	await expect(async () => {
		// Short timeouts: a click made before the page is interactive is simply tried again.
		if (!(await page.getByRole('option', { name: 'Last 90 days' }).isVisible())) await page.getByRole('combobox', { name: 'Period' }).click({ timeout: 2000 });
		await page.getByRole('option', { name: 'Last 90 days' }).click({ timeout: 2000 });
		await expect(page).toHaveURL(/days=90/, { timeout: 1000 });
	}).toPass();
	await expect(page.getByText('In the last 90 days', { exact: true })).toBeVisible();
	// An unknown period falls back to 30 days rather than failing.
	await page.goto('/admin/analytics?days=7');
	await expect(page.getByText('In the last 30 days', { exact: true })).toBeVisible();
});

test('staff set a new password for a student who cannot sign in', async ({ page, browser }) => {
	const email = await register(page, 'Salma');
	await page.goto('/logout');

	const staff = await (await browser.newContext()).newPage();
	await staff.goto('/login?next=/admin/students');
	await signIn(staff, 'admin@example.com', 'admin12345');
	await expect(async () => {
		await staff.getByRole('button', { name: 'Salma', exact: true }).first().click();
		await expect(staff.getByLabel('Set a new password')).toBeVisible({ timeout: 1000 });
	}).toPass();
	await staff.getByLabel('Set a new password').fill('brand-new-pass-9');
	await staff.getByRole('button', { name: 'Change password' }).click();
	await expect(staff.getByText('Password changed.')).toBeVisible();

	await page.goto('/login');
	await signIn(page, email, password);
	await expect(page.getByText(/don't match/)).toBeVisible();
	await signIn(page, email, 'brand-new-pass-9');
	await expect(page).toHaveURL('/portal');
	// The sign-in page no longer offers a reset by email.
	await page.goto('/logout');
	await page.goto('/login');
	await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveCount(0);
});

test('admin data is refetched as JSON, for staff only', async ({ page, browser }) => {
	// A visitor is sent to sign in, never handed data.
	const anonymous = await page.request.get('/admin/data/payments', { maxRedirects: 0 });
	expect(anonymous.status()).toBeGreaterThanOrEqual(300);
	expect(await anonymous.text()).not.toContain('transaction_id');

	await register(page, 'Karim');
	expect((await page.request.get('/admin/data/payments', { maxRedirects: 0 })).status()).toBe(403);

	const staff = await (await browser.newContext()).newPage();
	await staff.goto('/login');
	await signIn(staff, 'admin@example.com', 'admin12345');
	await expect(staff).toHaveURL('/admin');
	const payments = await staff.request.get('/admin/data/payments?status=all');
	expect(payments.status()).toBe(200);
	expect(await payments.text()).toContain('status');
	expect((await staff.request.get('/admin/data/~layout')).status()).toBe(200);
	expect((await staff.request.get('/admin/data/no-such-screen')).status()).toBe(404);
});

test('an item on the admin Overview opens that item, not the whole list', async ({ page }) => {
	await page.goto('/login');
	await signIn(page, 'admin@example.com', 'admin12345');
	await expect(page).toHaveURL('/admin');
	await expect(async () => {
		await page.getByRole('tab', { name: 'Latest enrollments' }).click({ timeout: 2000 });
		await expect(page.getByRole('tabpanel', { name: 'Latest enrollments' })).toBeVisible({ timeout: 1000 });
	}).toPass();
	const row = page.getByRole('tabpanel', { name: 'Latest enrollments' }).getByRole('listitem').first().getByRole('link');
	const name = await row.locator('strong').innerText();
	await row.click();
	await expect(page).toHaveURL(/\/admin\/students\?open=/);
	await expect(page.getByRole('dialog', { name })).toBeVisible();
});
