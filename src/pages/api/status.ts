import type { APIRoute } from 'astro';
import { db, ensureSchema } from '../../lib/db';
import { errorResponse, readJson } from '../../lib/http';

export const POST: APIRoute = async ({ request }) => {
	try {
		await ensureSchema();
		const body = await readJson(request);
		const id = Number(body.id);
		const status = String(body.status ?? '');

		if (!Number.isInteger(id) || id <= 0) {
			return errorResponse('Invalid song id');
		}

		if (status !== 'PLAYED' && status !== 'AVAILABLE') {
			return errorResponse('Invalid status');
		}

		if (status === 'AVAILABLE') {
			await db().execute({
				sql: `UPDATE songs 
            SET status = 'AVAILABLE', singer = NULL, guitar_1 = NULL, guitar_2 = NULL, drums = NULL, reserved_at = NULL 
            WHERE id = ?`,
				args: [id],
			});
		} else {
			await db().execute({
				sql: 'UPDATE songs SET status = ? WHERE id = ?',
				args: [status, id],
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to update status';
		return errorResponse(message, 400);
	}
};
