import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export interface TokenPayload {
	id: string;
	email: string;
	role: string;
	name?: string;
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): TokenPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as TokenPayload;
	} catch {
		return null;
	}
}
