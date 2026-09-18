import http from './../../common/api/client';
import type { AuthTokens } from './types';

export const loginUser = (username: string, password: string): Promise<AuthTokens> =>
	http.post(`token/`, { username, password }).then(res => res.data);
