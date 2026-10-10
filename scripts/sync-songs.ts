/**
 * Sync Turso/libSQL `songs` table from songs.json.
 * - Inserts new catalog entries as AVAILABLE
 * - Removes DB rows not in songs.json
 * - Keeps status, roles, and reserved_at for matching title+band
 */
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeedSong } from '../src/types/song';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}
	return value;
}

function normalizeKey(title: string, band: string): string {
	const clean = (s: string) =>
		s
			.toLowerCase()
			.trim()
			.replace(/\u2019/g, "'")
			.replace(/[^\w\s']/g, '')
			.replace(/\s+/g, ' ');
	return `${clean(title)}|${clean(band)}`;
}

function loadSongs(): SeedSong[] {
	const songsPath = join(root, 'songs.json');
	const parsed: unknown = JSON.parse(readFileSync(songsPath, 'utf8'));
	if (!Array.isArray(parsed)) {
		throw new Error('songs.json must be a JSON array');
	}

	const seen = new Set<string>();
	const songs: SeedSong[] = [];

	for (let index = 0; index < parsed.length; index++) {
		const entry = parsed[index];
		if (!entry || typeof entry !== 'object') {
			throw new Error(`Invalid song at index ${index}`);
		}
		const record = entry as Record<string, unknown>;
		const title = typeof record.title === 'string' ? record.title.trim() : '';
		const band = typeof record.band === 'string' ? record.band.trim() : '';
		if (!title || !band) {
			throw new Error(`Song at index ${index} requires title and band`);
		}
		const key = normalizeKey(title, band);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		songs.push({ title, band });
	}

	return songs;
}

const url = requireEnv('TURSO_DATABASE_URL');
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
	url,
	authToken: authToken || undefined,
});

const schema = readFileSync(join(root, 'src/lib/schema.sql'), 'utf8');
await db.executeMultiple(schema);

const catalog = loadSongs();
const catalogKeys = new Set(catalog.map((s) => normalizeKey(s.title, s.band)));

const existing = await db.execute(
	'SELECT id, title, band, status, singer, guitar_1, guitar_2, drums, reserved_at FROM songs',
);

const existingByKey = new Map<
	string,
	{
		id: number;
		title: string;
		band: string;
		status: string;
		singer: string | null;
		guitar_1: string | null;
		guitar_2: string | null;
		drums: string | null;
		reserved_at: string | null;
	}
>();

for (const row of existing.rows) {
	const title = String(row.title);
	const band = String(row.band);
	const key = normalizeKey(title, band);
	existingByKey.set(key, {
		id: Number(row.id),
		title,
		band,
		status: String(row.status),
		singer: row.singer != null ? String(row.singer) : null,
		guitar_1: row.guitar_1 != null ? String(row.guitar_1) : null,
		guitar_2: row.guitar_2 != null ? String(row.guitar_2) : null,
		drums: row.drums != null ? String(row.drums) : null,
		reserved_at: row.reserved_at != null ? String(row.reserved_at) : null,
	});
}

let inserted = 0;
let removed = 0;
let kept = 0;

for (const song of catalog) {
	const key = normalizeKey(song.title, song.band);
	if (existingByKey.has(key)) {
		kept++;
		continue;
	}
	await db.execute({
		sql: `INSERT INTO songs (title, band, status) VALUES (?, ?, 'AVAILABLE')`,
		args: [song.title, song.band],
	});
	inserted++;
}

for (const [key, row] of existingByKey) {
	if (catalogKeys.has(key)) {
		continue;
	}
	await db.execute({
		sql: 'DELETE FROM songs WHERE id = ?',
		args: [row.id],
	});
	removed++;
}

const total = await db.execute('SELECT COUNT(*) AS c FROM songs');
const count = Number(total.rows[0].c);

console.log(`Catalog: ${catalog.length} songs`);
console.log(`Kept (with reservations/status): ${kept}`);
console.log(`Inserted: ${inserted}`);
console.log(`Removed: ${removed}`);
console.log(`Database now has ${count} songs.`);
