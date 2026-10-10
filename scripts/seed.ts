import { createClient } from '@libsql/client';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeedSong } from '../src/types/song';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_SONGS: SeedSong[] = [
	{ band: 'DragonForce', title: 'Through the Fire and Flames' },
	{ band: 'Metallica', title: 'Enter Sandman' },
	{ band: 'Queen', title: 'Bohemian Rhapsody' },
];

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}
	return value;
}

function loadSongs(): SeedSong[] {
	const songsPath = join(root, 'songs.json');
	if (!existsSync(songsPath)) {
		return DEFAULT_SONGS;
	}

	const parsed: unknown = JSON.parse(readFileSync(songsPath, 'utf8'));
	if (!Array.isArray(parsed)) {
		throw new Error('songs.json must be a JSON array');
	}

	return parsed.map((entry, index) => {
		if (!entry || typeof entry !== 'object') {
			throw new Error(`Invalid song at index ${index}`);
		}
		const record = entry as Record<string, unknown>;
		const title = typeof record.title === 'string' ? record.title.trim() : '';
		const band = typeof record.band === 'string' ? record.band.trim() : '';
		if (!title || !band) {
			throw new Error(`Song at index ${index} requires title and band`);
		}
		return { title, band };
	});
}

const url = requireEnv('TURSO_DATABASE_URL');
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
	url,
	authToken: authToken || undefined,
});

const schema = readFileSync(join(root, 'src/lib/schema.sql'), 'utf8');
await db.executeMultiple(schema);

const existing = await db.execute('SELECT COUNT(*) AS c FROM songs');
const count = Number(existing.rows[0].c);

if (count > 0) {
	console.log(`Database already has ${count} songs. Skipping seed (delete rows to re-seed).`);
	process.exit(0);
}

const songs = loadSongs();
for (const song of songs) {
	await db.execute({
		sql: `INSERT INTO songs (title, band, status) VALUES (?, ?, 'AVAILABLE')`,
		args: [song.title, song.band],
	});
}

console.log(`Seeded ${songs.length} songs.`);
