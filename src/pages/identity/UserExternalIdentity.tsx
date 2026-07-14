import userApi, {type UserExternalIdentity as UserExternalIdentityItem} from "@/api/user-api";
import times from "@/components/time/times";
import {useMutation, useQuery} from "@tanstack/react-query";
import {App, Button, Empty, Popconfirm, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";

interface UserExternalIdentityProps {
    active: boolean;
    userId: string;
}

const providerColor = (provider: string) => {
    switch (provider) {
        case 'oidc':
            return 'blue';
        case 'wechat':
            return 'green';
        case 'ldap':
            return 'purple';
        default:
            return 'default';
    }
};

const renderIdentifier = (value?: string, type?: 'secondary') => {
    if (!value) {
        return '-';
    }
    return (
        <Typography.Text
            type={type}
            copyable
            ellipsis={{tooltip: value}}
            className="max-w-[360px]"
        >
            {value}
        </Typography.Text>
    );
};

const UserExternalIdentity = ({active, userId}: UserExternalIdentityProps) => {
    const {t} = useTranslation();
    const {message} = App.useApp();

    const identitiesQuery = useQuery({
        queryKey: ['user-external-identities', userId],
        queryFn: () => userApi.getExternalIdentities(userId),
        enabled: active && !!userId,
    });

    const deleteMutation = useMutation({
        mutationFn: (identityId: string) => userApi.deleteExternalIdentity(userId, identityId),
        onSuccess: () => {
            message.success(t('general.success'));
            identitiesQuery.refetch();
        },
    });

    const providerName = (provider: string) => {
        switch (provider) {
            case 'oidc':
                return t('identity.user.external_identity.provider_oidc');
            case 'wechat':
                return t('identity.user.external_identity.provider_wechat');
            case 'ldap':
                return t('identity.user.external_identity.provider_ldap');
            default:
                return provider || '-';
        }
    };

    const columns: ColumnsType<UserExternalIdentityItem> = [
        {
            title: t('identity.user.external_identity.provider'),
            dataIndex: 'provider',
            key: 'provider',
            width: 140,
            render: (provider: string, record) => (
                <Space size={4} wrap>
                    <Tag color={providerColor(provider)}>{providerName(provider)}</Tag>
                    {record.legacy && <Tag>{t('identity.user.external_identity.legacy')}</Tag>}
                </Space>
            ),
        },
        {
            title: t('identity.user.external_identity.account_identifier'),
            dataIndex: 'username',
            key: 'username',
            render: (username?: string) => username || '-',
        },
        {
            title: t('identity.user.external_identity.display_name'),
            dataIndex: 'nickname',
            key: 'nickname',
            render: (nickname?: string) => nickname || '-',
        },
        {
            title: t('identity.user.mail'),
            dataIndex: 'mail',
            key: 'mail',
            render: (mail?: string) => mail || '-',
        },
        {
            title: t('identity.user.external_identity.identifier'),
            key: 'identifier',
            render: (_, record) => (
                <Space direction="vertical" size={0} className="w-full">
                    {renderIdentifier(record.providerKey)}
                    {renderIdentifier(record.subject, 'secondary')}
                </Space>
            ),
        },
        {
            title: t('identity.user.external_identity.last_login_at'),
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            width: 180,
            render: (lastLoginAt?: number) => lastLoginAt ? times.format(lastLoginAt) : '-',
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
                    title={t('identity.user.external_identity.unbind_confirm')}
                    onConfirm={() => deleteMutation.mutate(record.id)}
                >
                    <Button danger type="link" loading={deleteMutation.isPending}>
                        {t('actions.unbind')}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={identitiesQuery.data}
            loading={identitiesQuery.isLoading || deleteMutation.isPending}
            pagination={false}
            scroll={{x: 1000}}
            locale={{
                emptyText: <Empty description={t('identity.user.external_identity.empty')}/>,
            }}
        />
    );
};

export default UserExternalIdentity;
