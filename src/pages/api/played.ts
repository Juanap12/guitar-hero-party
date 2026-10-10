import type { APIRoute } from 'astro';
import { errorResponse } from '../../lib/http';
import { getRecentlyPlayed } from '../../lib/songs';

export const GET: APIRoute = async () => {
	try {
		const played = await getRecentlyPlayed(10);
		return new Response(JSON.stringify(played), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to load played songs';
		return errorResponse(message, 500);
	}
};
