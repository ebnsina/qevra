import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import * as v from 'valibot';

// Required when the app starts; not needed to build it.
const required = building ? v.optional(v.string(), '') : v.pipe(v.string(), v.minLength(1));

export const variables = defineEnvVars({
	// The restricted role the app runs as. (DATABASE_URL, the owner, is only for migrations.)
	DATABASE_APP_URL: { schema: required },

	// Object storage, under the names Neon gives them (any S3-compatible bucket works).
	AWS_ENDPOINT_URL_S3: { schema: required },
	AWS_REGION: { schema: required },
	AWS_ACCESS_KEY_ID: { schema: required },
	AWS_SECRET_ACCESS_KEY: { schema: required },

	MAIL_SMTP_URL: { schema: required },
	MAIL_FROM: { schema: required }
});
