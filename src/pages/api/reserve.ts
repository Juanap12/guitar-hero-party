import type { APIRoute } from 'astro';
import { db, ensureSchema } from '../../lib/db';
import { errorResponse, readJson } from '../../lib/http';

export const POST: APIRoute = async ({ request }) => {
	try {
		await ensureSchema();
		const body = await readJson(request);
		const id = Number(body.id);
		if (!Number.isInteger(id) || id <= 0) {
			return errorResponse('Invalid song id');
		}

		const singer = typeof body.singer === 'string' && body.singer.trim() ? body.singer.trim() : null;
		const guitar_1 =
			typeof body.guitar_1 === 'string' && body.guitar_1.trim() ? body.guitar_1.trim() : null;
		const guitar_2 =
			typeof body.guitar_2 === 'string' && body.guitar_2.trim() ? body.guitar_2.trim() : null;
		const drums = typeof body.drums === 'string' && body.drums.trim() ? body.drums.trim() : null;

		const check = await db().execute({
			sql: 'SELECT status FROM songs WHERE id = ?',
			args: [id],
		});

		if (!check.rows.length) {
			return errorResponse('Song not found', 404);
		}

		if (check.rows[0]?.status === 'PLAYED') {
			return errorResponse('Cannot edit a song that has already been played.');
		}

		await db().execute({
			sql: `UPDATE songs 
          SET status = 'RESERVED', singer = ?, guitar_1 = ?, guitar_2 = ?, drums = ?, reserved_at = COALESCE(reserved_at, CURRENT_TIMESTAMP) 
          WHERE id = ?`,
			args: [singer, guitar_1, guitar_2, drums, id],
		});

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to reserve song';
		return errorResponse(message, 400);
	}
};
