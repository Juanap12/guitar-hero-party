import type { APIRoute } from 'astro';
import { errorResponse } from '../../lib/http';
import { getQueue } from '../../lib/songs';

export const GET: APIRoute = async () => {
	try {
		const queue = await getQueue();
		return new Response(JSON.stringify(queue), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to load queue';
		return errorResponse(message, 500);
	}
};
