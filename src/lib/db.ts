import { createClient, type Client } from '@libsql/client';
import schemaSql from './schema.sql?raw';

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

/** LibSQL client singleton (call `ensureSchema()` before first write). */
export function getDb(): Client {
	if (!client) {
		const url = import.meta.env.TURSO_DATABASE_URL;
		if (!url) {
			throw new Error('Missing environment variable: TURSO_DATABASE_URL');
		}
		const authToken = import.meta.env.TURSO_AUTH_TOKEN;
		client = createClient({
			url,
			authToken: authToken || undefined,
		});
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
