import type {SelectProps} from 'antd';
import {Select} from 'antd';
import {useSelectRequest} from '@/hook/use-antd-form-query';

type QueryKeyPart = string | number | boolean | null | undefined | Record<string, unknown> | QueryKeyPart[];

type QuerySelectProps = SelectProps & {
    request?: (params?: Record<string, any>) => Promise<any[]>;
    params?: Record<string, any>;
    queryKey?: QueryKeyPart[];
};

const QuerySelect = ({request, params, queryKey, options, loading, optionFilterProp = 'label', ...props}: QuerySelectProps) => {
    const query = useSelectRequest(
        ['query-select', ...(queryKey ?? []), request?.toString()],
        request,
        params,
    );

    return (
        <Select
            {...props}
            loading={loading ?? query.isFetching}
            optionFilterProp={optionFilterProp}
            options={options ?? query.data ?? []}
        />
    );
};

export default QuerySelect;
