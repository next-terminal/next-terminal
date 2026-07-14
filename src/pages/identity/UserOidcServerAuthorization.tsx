import userApi, {type UserOidcConsentItem} from "@/api/user-api";
import times from "@/components/time/times";
import {useMutation, useQuery} from "@tanstack/react-query";
import {App, Button, Empty, Popconfirm, Space, Table, Tag} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";

interface UserOidcServerAuthorizationProps {
    active: boolean;
    userId: string;
}

const UserOidcServerAuthorization = ({active, userId}: UserOidcServerAuthorizationProps) => {
    const {t} = useTranslation();
    const {message} = App.useApp();

    const consentQuery = useQuery({
        queryKey: ['user-oidc-server-consents', userId],
        queryFn: () => userApi.getOidcServerConsents(userId),
        enabled: active && !!userId,
    });

    const revokeMutation = useMutation({
        mutationFn: (clientId: string) => userApi.revokeOidcServerConsent(userId, clientId),
        onSuccess: () => {
            message.success(t('account.oidc_server_authorization_revoked'));
            consentQuery.refetch();
        },
    });

    const columns: ColumnsType<UserOidcConsentItem> = [
        {
            title: t('identity.oidc_client.client_id_label'),
            dataIndex: 'clientId',
            key: 'clientId',
            ellipsis: true,
        },
        {
            title: t('account.oidc_server_scopes'),
            dataIndex: 'scopes',
            key: 'scopes',
            render: (scopes?: string[]) => (
                <Space wrap>
                    {(scopes || []).map(scope => (
                        <Tag key={scope} color="blue">{scope}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: t('authorised.label.authorised_at'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (createdAt?: number) => createdAt ? times.format(createdAt) : '-',
        },
        {
            title: t('general.updated_at'),
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 180,
            render: (updatedAt?: number) => updatedAt ? times.format(updatedAt) : '-',
        },
        {
            title: t('actions.label'),
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title={t('account.oidc_server_authorization_revoke_title')}
                    onConfirm={() => revokeMutation.mutate(record.clientId)}
                >
                    <Button danger type="link" loading={revokeMutation.isPending && revokeMutation.variables === record.clientId}>
                        {t('account.oidc_server_revoke')}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={consentQuery.data}
            loading={consentQuery.isLoading || revokeMutation.isPending}
            pagination={false}
            locale={{emptyText: <Empty description={t('account.oidc_server_no_authorizations')}/>}}
        />
    );
};

export default UserOidcServerAuthorization;
