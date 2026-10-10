export type SongStatus = 'AVAILABLE' | 'RESERVED' | 'PLAYED';

export interface Song {
	id: number;
	title: string;
	band: string;
	status: SongStatus;
	singer: string | null;
	guitar_1: string | null;
	guitar_2: string | null;
	drums: string | null;
	reserved_at: string | null;
}

export interface ReservePayload {
	id: number;
	singer?: string;
	guitar_1?: string;
	guitar_2?: string;
	drums?: string;
}

export interface StatusPayload {
	id: number;
	status: 'AVAILABLE' | 'PLAYED';
}

export interface SeedSong {
	title: string;
	band: string;
}
