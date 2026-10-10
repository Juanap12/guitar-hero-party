import { createClient, type Client } from '@libsql/client/web';
import schemaSql from './schema.sql?raw';

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function getTursoConfig(): { url: string; authToken?: string } {
	const url = process.env.TURSO_DATABASE_URL ?? import.meta.env.TURSO_DATABASE_URL;
	if (!url) {
		throw new Error('Missing environment variable: TURSO_DATABASE_URL');
	}
	const authToken = process.env.TURSO_AUTH_TOKEN ?? import.meta.env.TURSO_AUTH_TOKEN;
	return { url, authToken: authToken || undefined };
}

/** LibSQL client singleton (call `ensureSchema()` before first write). */
export function getDb(): Client {
	if (!client) {
		const { url, authToken } = getTursoConfig();
		client = createClient({ url, authToken });
	}
	return client;
}

export async function ensureSchema(): Promise<void> {
	if (!schemaReady) {
		schemaReady = (async () => {
			const db = getDb();
			await db.executeMultiple(schemaSql);
		})();
	}
	await schemaReady;
}

export { getDb as db };
