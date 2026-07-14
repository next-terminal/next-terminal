import userApi, {
    type UserSSHKeyItem,
    type UserWebauthnCredential,
} from "@/api/user-api";
import times from "@/components/time/times";
import {useMutation, useQuery} from "@tanstack/react-query";
import {App, Button, Descriptions, Empty, Popconfirm, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";

interface UserAuthenticationProps {
    active: boolean;
    userId: string;
}

const UserAuthentication = ({active, userId}: UserAuthenticationProps) => {
    const {t} = useTranslation();
    const {message} = App.useApp();

    const userQuery = useQuery({
        queryKey: ['user', userId],
        queryFn: () => userApi.getById(userId),
        enabled: active && !!userId,
    });

    const passkeyQuery = useQuery({
        queryKey: ['user-webauthn-credentials', userId],
        queryFn: () => userApi.getWebauthnCredentials(userId),
        enabled: active && !!userId,
    });

    const sshKeyQuery = useQuery({
        queryKey: ['user-ssh-keys', userId],
        queryFn: () => userApi.getSSHKeys(userId),
        enabled: active && !!userId,
    });

    const resetTotpMutation = useMutation({
        mutationFn: () => userApi.resetTOTP([userId]),
        onSuccess: () => {
            message.success(t('general.success'));
            userQuery.refetch();
        },
    });

    const deletePasskeyMutation = useMutation({
        mutationFn: (credentialId: string) => userApi.deleteWebauthnCredential(userId, credentialId),
        onSuccess: () => {
            message.success(t('general.success'));
            passkeyQuery.refetch();
        },
    });

    const deleteSSHKeyMutation = useMutation({
        mutationFn: (sshKeyId: string) => userApi.deleteSSHKey(userId, sshKeyId),
        onSuccess: () => {
            message.success(t('general.success'));
            sshKeyQuery.refetch();
        },
    });

    const passkeyColumns: ColumnsType<UserWebauthnCredential> = [
        {
            title: t('general.name'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: t('account.passkey_used_time'),
            dataIndex: 'usedAt',
            key: 'usedAt',
            render: (usedAt?: number) => usedAt ? times.format(usedAt) : '-',
            width: 180,
        },
        {
            title: t('account.passkey_add_time'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt?: number) => createdAt ? times.format(createdAt) : '-',
            width: 180,
        },
        {
            title: t('actions.label'),
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title={t('account.passkey_delete_title')}
                    onConfirm={() => deletePasskeyMutation.mutate(record.id)}
                >
                    <Button danger type="link" loading={deletePasskeyMutation.isPending}>
                        {t('actions.delete')}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    const sshKeyColumns: ColumnsType<UserSSHKeyItem> = [
        {
            title: t('account.ssh_key_name'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: t('account.ssh_key_algorithm'),
            dataIndex: 'algorithm',
            key: 'algorithm',
            width: 120,
            render: (algorithm?: string) => algorithm ? <Tag color="blue">{algorithm}</Tag> : '-',
        },
        {
            title: t('account.ssh_key_fingerprint'),
            dataIndex: 'fingerprint',
            key: 'fingerprint',
            render: (fingerprint?: string) => fingerprint ? (
                <Typography.Text code copyable={{text: fingerprint}}>{fingerprint}</Typography.Text>
            ) : '-',
        },
        {
            title: t('account.ssh_key_last_used'),
            dataIndex: 'lastUsedAt',
            key: 'lastUsedAt',
            render: (lastUsedAt?: number) => lastUsedAt ? times.format(lastUsedAt) : '-',
            width: 180,
        },
        {
            title: t('general.created_at'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt?: number) => createdAt ? times.format(createdAt) : '-',
            width: 180,
        },
        {
            title: t('actions.label'),
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title={t('account.ssh_key_delete_title')}
                    onConfirm={() => deleteSSHKeyMutation.mutate(record.id)}
                >
                    <Button danger type="link" loading={deleteSSHKeyMutation.isPending}>
                        {t('actions.delete')}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    const user = userQuery.data;

    return (
        <div className="space-y-6">
            <div>
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label={t('account.change.password')}>
                        {user?.passwordSet ? (
                            <Tag color="success">{t('identity.user.admin_auth.password_set')}</Tag>
                        ) : (
                            <Tag>{t('identity.user.admin_auth.password_not_set')}</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('identity.user.otp')}>
                        <Space>
                            {user?.enabledTotp ? (
                                <Tag color="success">{t('general.enabled')}</Tag>
                            ) : (
                                <Tag>{t('general.disabled')}</Tag>
                            )}
                            {user?.enabledTotp && (
                                <Popconfirm
                                    title={t('identity.user.reset_otp.confirm_title')}
                                    onConfirm={() => resetTotpMutation.mutate()}
                                >
                                    <Button size="small" danger loading={resetTotpMutation.isPending}>
                                        {t('identity.user.reset_otp.action')}
                                    </Button>
                                </Popconfirm>
                            )}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('account.passkey')}>
                        <Tag color={passkeyQuery.data?.length ? 'success' : undefined}>
                            {passkeyQuery.data?.length ?? 0}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('account.ssh_key')}>
                        <Tag color={sshKeyQuery.data?.length ? 'success' : undefined}>
                            {sshKeyQuery.data?.length ?? 0}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>
            </div>

            <div>
                <Typography.Title level={5}>{t('account.passkey')}</Typography.Title>
                <Table
                    rowKey="id"
                    size="small"
                    columns={passkeyColumns}
                    dataSource={passkeyQuery.data}
                    loading={passkeyQuery.isLoading || deletePasskeyMutation.isPending}
                    pagination={false}
                    locale={{emptyText: <Empty description={t('identity.user.admin_auth.passkey_empty')}/>}}
                />
            </div>

            <div>
                <Typography.Title level={5}>{t('account.ssh_key')}</Typography.Title>
                <Table
                    rowKey="id"
                    size="small"
                    columns={sshKeyColumns}
                    dataSource={sshKeyQuery.data}
                    loading={sshKeyQuery.isLoading || deleteSSHKeyMutation.isPending}
                    pagination={false}
                    scroll={{x: 1000}}
                    locale={{emptyText: <Empty description={t('account.ssh_key_empty')}/>}}
                />
            </div>
        </div>
    );
};

export default UserAuthentication;
