export interface UnreadBulletin {
	id: string;
	title: string;
	content: string;
	createdAt: string;
}

export interface BulletinListItem {
	id: string;
	title: string;
	createdAt: string;
	isRead: boolean;
	userReactions: string[];
	reactionCounts: Record<string, number>;
}

export interface BulletinContent {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	isRead: boolean;
	userReactions: string[];
	reactionCounts: Record<string, number>;
}

export interface CreateBulletinRequest {
	title: string;
	content: string;
	expiresInDays: number;
}

export interface CreateBulletinData {
	id: string;
	title: string;
	content: string;
	expiresAt: string;
	createdAt: string;
	createdByUserName: string | null;
}

export interface ReactToBulletinRequest {
	emoji: string;
}

export interface ReactToBulletinData {
	userReactions: string[];
	reactionCounts: Record<string, number>;
}

