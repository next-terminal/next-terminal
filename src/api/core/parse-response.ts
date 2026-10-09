export const parseResponse = async <T>(response: Response): Promise<T> => {
    if (response.status === 204) {
        return undefined as T;
    }
    if (response.headers.get('Content-Type')?.includes('application/json')) {
        return await response.json() as T;
    }
    return await response.text() as T;
};
