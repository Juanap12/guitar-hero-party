// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: vercel(),
	integrations: [tailwind()],
	env: {
		schema: {
			TURSO_DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
			TURSO_AUTH_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
		},
	},
});
