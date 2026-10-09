import {ApiError, getErrorMessage, isAccessControlError, isApiError} from "@/api/core/api-error";
import eventEmitter from "@/api/core/event-emitter";
import {parseResponse} from "@/api/core/parse-response";

export const baseUrl = () => {
    return '/api';
}

export const baseWebSocketUrl = () => {
    let https = 'https:' == document.location.protocol;
    if (https) {
        return 'wss://' + window.location.host + '/api';
    } else {
        return 'ws://' + window.location.host + '/api';
    }
}

// 清理 localStorage 中的残留 token
localStorage.removeItem('X-Auth-Token');

let accessControlRedirecting = false;

const redirectToAccessDenied = (errorCode: number) => {
    if (accessControlRedirecting || window.location.pathname === '/access-denied') {
        return;
    }
    accessControlRedirecting = true;
    const target = new URL('/access-denied', window.location.origin);
    target.searchParams.set('code', String(errorCode));
    target.searchParams.set('from', window.location.pathname);
    window.location.replace(`${target.pathname}${target.search}`);
};

export type ApiErrorMode = 'global' | 'local' | 'silent';

export interface RequestOptions {
    errorMode?: ApiErrorMode;
    securityToken?: string;
}

const createHttpError = async (response: Response): Promise<ApiError> => {
    let message = response.statusText;
    let code = 0;

    if (response.headers.get('Content-Type')?.includes('application/json')) {
        try {
            const data = await response.json() as {message?: unknown; code?: unknown};
            if (typeof data.message === 'string' && data.message) {
                message = data.message;
            }
            code = Number(data.code) || 0;
        } catch {
            // 响应体无法解析时保留 HTTP 状态文本。
        }
    } else {
        const responseText = await response.text();
        if (responseText) {
            message = responseText;
        }
    }

    return new ApiError(message || 'Request failed', {
        status: response.status,
        statusText: response.statusText,
        code,
        kind: 'http',
    });
};

const normalizeError = (error: unknown): ApiError => {
    if (isApiError(error)) {
        return error;
    }

    if (error instanceof TypeError) {
        eventEmitter.emit("NETWORK:UN_CONNECT");
        return new ApiError(error.message, {
            kind: 'network',
            cause: error,
        });
    }

    return new ApiError(getErrorMessage(error), {
        kind: 'unknown',
        cause: error,
    });
};

const handleCrossPageError = (error: ApiError, errorMode: ApiErrorMode): boolean => {
    if (errorMode !== 'global') {
        return false;
    }
    if (error.status === 418) {
        eventEmitter.emit("API:REDIRECT", "/setup");
        return true;
    }
    if (error.status === 401) {
        eventEmitter.emit("API:UN_AUTH");
        return true;
    }
    if (isAccessControlError(error)) {
        redirectToAccessDenied(error.code);
        return true;
    }
    return false;
};

const execute = async <T>(url: string, init: RequestInit, options: RequestOptions = {}): Promise<T> => {
    try {
        const headers = new Headers(init.headers);
        if (options.securityToken) {
            headers.set('X-Security-Token', options.securityToken);
        }
        const response = await fetch(baseUrl() + url, {...init, headers});
        if (!response.ok) {
            throw await createHttpError(response);
        }
        return await parseResponse<T>(response);
    } catch (error) {
        const apiError = normalizeError(error);
        const errorMode = options.errorMode ?? 'global';
        const handled = handleCrossPageError(apiError, errorMode);
        if (!handled && errorMode === 'global' && apiError.kind !== 'network') {
            eventEmitter.emit("API:VALIDATE_ERROR", apiError.code, apiError.message);
        }
        throw apiError;
    }
};

class Request {
    async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
        return await execute<T>(url, {
            method: "GET",
        }, options);
    }

    async post<T = any>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return await execute<T>(url, {
            method: "POST",
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
        }, options);
    }

    async postForm<T = any>(url: string, body?: BodyInit, options?: RequestOptions): Promise<T> {
        return await execute<T>(url, {
            method: "POST",
            body,
        }, options);
    }

    async put<T = any>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return await execute<T>(url, {
            method: "PUT",
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
        }, options);
    }

    async patch<T = any>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return await execute<T>(url, {
            method: "PATCH",
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
        }, options);
    }

    async delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
        return await execute<T>(url, {
            method: "DELETE",
        }, options);
    }
}

const requests = new Request();

export default requests;
