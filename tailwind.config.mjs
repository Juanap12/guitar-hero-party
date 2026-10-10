/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
				body: ['"Inter"', 'system-ui', 'sans-serif'],
			},
			colors: {
				stage: {
					bg: '#0a0612',
					panel: '#14101f',
					border: '#2d2440',
					neon: '#ff3d00',
					amber: '#ffb300',
					cyan: '#00e5ff',
					lime: '#76ff03',
				},
			},
			boxShadow: {
				neon: '0 0 20px rgba(255, 61, 0, 0.35)',
				'neon-cyan': '0 0 18px rgba(0, 229, 255, 0.3)',
			},
		},
	},
	plugins: [],
};
