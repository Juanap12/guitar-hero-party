import type { Row } from '@libsql/client';
import type { ReservePayload, Song, SongStatus, StatusPayload } from '../types/song';
import { ensureSchema, getDb } from './db';

const MAX_NAME_LEN = 80;

function rowToSong(row: Row): Song {
	return {
		id: Number(row.id),
		title: String(row.title),
		band: String(row.band),
		status: String(row.status) as SongStatus,
		singer: row.singer != null ? String(row.singer) : null,
		guitar_1: row.guitar_1 != null ? String(row.guitar_1) : null,
		guitar_2: row.guitar_2 != null ? String(row.guitar_2) : null,
		drums: row.drums != null ? String(row.drums) : null,
		reserved_at: row.reserved_at != null ? String(row.reserved_at) : null,
	};
}

function cleanOptional(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return trimmed.slice(0, MAX_NAME_LEN);
}

function parseSongId(value: unknown): number {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error('Invalid song id');
	}
	return id;
}

async function ready() {
	await ensureSchema();
	return getDb();
}

export async function listAllSongs(): Promise<Song[]> {
	const db = await ready();
	const result = await db.execute({
		sql: 'SELECT * FROM songs ORDER BY band ASC, title ASC',
		args: [],
	});
	return result.rows.map(rowToSong);
}

export async function reserveSong(payload: ReservePayload): Promise<Song> {
	const db = await ready();
	const id = parseSongId(payload.id);
	const singer = cleanOptional(payload.singer);
	const guitar_1 = cleanOptional(payload.guitar_1);
	const guitar_2 = cleanOptional(payload.guitar_2);
	const drums = cleanOptional(payload.drums);

	const result = await db.execute({
		sql: `
			UPDATE songs
			SET status = 'RESERVED',
			    singer = ?,
			    guitar_1 = ?,
			    guitar_2 = ?,
			    drums = ?,
			    reserved_at = CURRENT_TIMESTAMP
			WHERE id = ? AND status = 'AVAILABLE'
			RETURNING *
		`,
		args: [singer, guitar_1, guitar_2, drums, id],
	});

	if (!result.rows.length) {
		throw new Error('Song is not available to reserve');
	}

	return rowToSong(result.rows[0]);
}

export async function getQueue(): Promise<Song[]> {
	const db = await ready();
	const result = await db.execute({
		sql: `SELECT * FROM songs WHERE status = 'RESERVED' ORDER BY reserved_at ASC`,
		args: [],
	});
	return result.rows.map(rowToSong);
}

export async function getRecentlyPlayed(limit = 10): Promise<Song[]> {
	const db = await ready();
	const result = await db.execute({
		sql: `SELECT * FROM songs WHERE status = 'PLAYED' ORDER BY reserved_at DESC LIMIT ?`,
		args: [limit],
	});
	return result.rows.map(rowToSong);
}

export async function updateSongStatus(payload: StatusPayload): Promise<Song> {
	const db = await ready();
	const id = parseSongId(payload.id);

	if (payload.status === 'AVAILABLE') {
		const result = await db.execute({
			sql: `
				UPDATE songs
				SET status = 'AVAILABLE',
				    singer = NULL,
				    guitar_1 = NULL,
				    guitar_2 = NULL,
				    drums = NULL,
				    reserved_at = NULL
				WHERE id = ?
				RETURNING *
			`,
			args: [id],
		});

		if (!result.rows.length) {
			throw new Error('Song not found');
		}

		return rowToSong(result.rows[0]);
	}

	if (payload.status === 'PLAYED') {
		const result = await db.execute({
			sql: `UPDATE songs SET status = 'PLAYED' WHERE id = ? RETURNING *`,
			args: [id],
		});

		if (!result.rows.length) {
			throw new Error('Song not found');
		}

		return rowToSong(result.rows[0]);
	}

	throw new Error('Invalid status');
}
