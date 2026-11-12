// What this project needs from Neon besides Postgres. `neon deploy` creates it on the linked branch.
import { defineConfig } from '@neon/config/v1';

export default defineConfig({
	buckets: {
		// Uploads: course images, resources, logos and students' assignments. Private: every file is
		// served through the app (src/routes/files), which decides who may read it.
		files: { access: 'private' }
	}
});
