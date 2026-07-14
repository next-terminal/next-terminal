import userApi, {type UserAccessTokenItem} from "@/api/user-api";
import times from "@/components/time/times";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Button, Empty, Popconfirm, Table, Tag, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";

interface UserAccessTokenProps {
    active: boolean;
    userId: string;
}

const UserAccessToken = ({active, userId}: UserAccessTokenProps) => {
    const {t} = useTranslation();

    const tokenQuery = useQuery({
        queryKey: ['user-access-tokens', userId],
        queryFn: () => userApi.getAccessTokens(userId),
        enabled: active && !!userId,
    });

    const deleteMutation = useMutation({
        mutationFn: (tokenId: string) => userApi.deleteAccessToken(userId, tokenId),
        onSuccess: () => tokenQuery.refetch(),
    });

    const tokenTypeLabel = (type: string) => {
        switch (type) {
            case 'api':
                return t('account.access_token_type_values.api');
            case 'db-password':
                return t('account.access_token_type_values.db_password');
            case 'oauth':
                return t('account.access_token_type_values.oauth');
            default:
                return type;
        }
    };

    const tokenTypeColor = (type: string) => {
        switch (type) {
            case 'api':
                return 'blue';
            case 'db-password':
                return 'gold';
            case 'oauth':
                return 'purple';
            default:
                return 'default';
        }
    };

    const columns: ColumnsType<UserAccessTokenItem> = [
        {
            title: t('account.access_token'),
            dataIndex: 'token',
            key: 'token',
            render: (token?: string) => token ? <Typography.Text code>{token}</Typography.Text> : '-',
        },
        {
            title: t('account.access_token_type'),
            dataIndex: 'type',
            key: 'type',
            width: 140,
            render: (type: string) => <Tag color={tokenTypeColor(type)}>{tokenTypeLabel(type)}</Tag>,
        },
        {
            title: t('account.access_token_source'),
            dataIndex: 'sourceName',
            key: 'sourceName',
            render: (sourceName?: string) => sourceName || <Typography.Text type="secondary">{t('account.access_token_source_manual')}</Typography.Text>,
        },
        {
            title: t('account.access_token_expires_at'),
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            width: 180,
            render: (expiresAt?: number) => expiresAt ? times.format(expiresAt) : <Typography.Text type="secondary">{t('account.access_token_expires_never')}</Typography.Text>,
        },
        {
            title: t('general.created_at'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (createdAt?: number) => createdAt ? times.format(createdAt) : '-',
        },
        {
            title: t('actions.label'),
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title={t('general.confirm_delete')}
                    onConfirm={() => deleteMutation.mutate(record.id)}
                >
                    <Button danger type="link" loading={deleteMutation.isPending && deleteMutation.variables === record.id}>
                        {t('actions.delete')}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={tokenQuery.data}
            loading={tokenQuery.isLoading || deleteMutation.isPending}
            pagination={false}
            locale={{emptyText: <Empty description={t('identity.user.admin_auth.access_token_empty')}/>}}
        />
    );
};

export default UserAccessToken;
