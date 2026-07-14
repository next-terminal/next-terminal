import {useEffect, useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import type {FormInstance} from 'antd';

type QueryKeyPart = string | number | boolean | null | undefined | Record<string, unknown> | QueryKeyPart[];

interface UseFormRequestOptions<T extends Record<string, any>> {
    enabled?: boolean;
    transform?: (data: T) => Record<string, any>;
}

export const useFormRequest = <T extends Record<string, any>>(
    form: FormInstance,
    queryKey: QueryKeyPart[],
    request?: () => Promise<T>,
    options: boolean | UseFormRequestOptions<T> = true,
) => {
    const enabled = typeof options === 'boolean' ? options : options.enabled ?? true;
    const transform = typeof options === 'boolean' ? undefined : options.transform;

    const query = useQuery({
        queryKey,
        queryFn: async () => request ? request() : ({} as T),
        enabled: !!request && enabled,
    });

    useEffect(() => {
        if (enabled && query.data) {
            form.setFieldsValue(transform ? transform(query.data) : query.data);
        }
    }, [enabled, form, query.data, query.dataUpdatedAt, transform]);

    return query;
};

export const useSelectRequest = <T = any>(
    queryKey: QueryKeyPart[],
    request?: (params?: Record<string, any>) => Promise<T[]>,
    params?: Record<string, any>,
) => {
    const paramsKey = useMemo(() => params ?? {}, [JSON.stringify(params ?? {})]);

    return useQuery({
        queryKey: [...queryKey, paramsKey],
        queryFn: async () => request ? request(params) : [],
        enabled: !!request,
    });
};
