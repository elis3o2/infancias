import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import type { AuthTokens } from '../contex/types';

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface QueueItem {
  res: (token: string) => void;
  rej: (error: unknown) => void;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const axiosClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' }
});

const bareClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let queue: QueueItem[] = [];

function readStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem('tokens');

  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<AuthTokens>;
    return typeof parsed.access === 'string' && typeof parsed.refresh === 'string'
      ? { access: parsed.access, refresh: parsed.refresh }
      : null;
  } catch {
    localStorage.removeItem('tokens');
    return null;
  }
}

// inject access token
axiosClient.interceptors.request.use((cfg) => {
  const tokens = readStoredTokens();
  if (tokens?.access && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return cfg;
});

// on 401 → refresh, retry, queue others
axiosClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    if (!err.config) return Promise.reject(err);

    const orig = err.config as RetryableRequestConfig;
    const tokens = readStoredTokens();

    const shouldRefresh =
      err.response?.status === 401 &&
      tokens?.refresh &&
      !orig._retry &&
      typeof orig.url === 'string' &&
      !orig.url.includes('/token/refresh/');

    if (shouldRefresh) {
      orig._retry = true;

      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          queue.push({
            res: (token) =>
              resolve(
                axiosClient({
                  ...orig,
                  headers: { ...orig.headers, Authorization: `Bearer ${token}` }
                })
              ),
            rej: reject
          });
        });
      }

      isRefreshing = true;
      try {
        const response = await bareClient.post<{ access: string }>(
          '/token/refresh/',
          { refresh: tokens.refresh }
        );
        const newAccess = response.data.access;

        localStorage.setItem(
          'tokens',
          JSON.stringify({ access: newAccess, refresh: tokens.refresh })
        );
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        queue.forEach((p) => p.res(newAccess));
        queue = [];

        orig.headers = { ...orig.headers, Authorization: `Bearer ${newAccess}` };
        return axiosClient(orig);
      } catch (refreshError) {
        localStorage.removeItem('tokens');
        window.location.href = '/login/';
        queue.forEach((p) => p.rej(refreshError));
        queue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);



export default axiosClient;
