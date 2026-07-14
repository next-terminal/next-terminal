import sshGatewayApi,{ GatewayReferenceError, SSHGateway } from "@/api/ssh-gateway-api";
import Disabled from "@/components/Disabled";
import NButton from "@/components/NButton";
import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { useLicense } from "@/hook/LicenseContext";
import SshGatewayModal from "@/pages/gateway/SshGatewayModal";
import { getSort } from "@/utils/sort";
import { useMutation } from "@tanstack/react-query";
import { App,Button,Popconfirm,Space,Tag } from "antd";
import { useRef,useState } from 'react';
import { useTranslation } from "react-i18next";

const api = sshGatewayApi;

const SshGatewayPage = () => {

    let { license } = useLicense();
    const hasPremiumFeatures = license.hasPremiumFeatures();
    const {t} = useTranslation();
    const actionRef = useRef<NTableActionType>(null);

    let [open, setOpen] = useState<boolean>(false);
    let [selectedRowKey, setSelectedRowKey] = useState<string>();

    const {message, modal} = App.useApp();

    const postOrUpdate = async (values: any) => {
        if (values['id']) {
            await api.updateById(values['id'], values);
        } else {
            await api.create(values);
        }
    }

    let mutation = useMutation({
        mutationFn: postOrUpdate,
        onSuccess: () => {
            actionRef.current?.reload();
            setOpen(false);
            setSelectedRowKey(undefined);
            showSuccess();
        }
    });

    function showSuccess() {
        message.open({
            type: 'success',
            content: t('general.success'),
        });
    }

    function showDeleteError(error: unknown) {
        const referenceError = error as GatewayReferenceError;
        const referenceGroups = [
            {title: t('gateways.gateway_delete_referenced_assets'), names: referenceError.assetNames || []},
            {title: t('gateways.gateway_delete_referenced_websites'), names: referenceError.websiteNames || []},
            {title: t('gateways.gateway_delete_referenced_database_assets'), names: referenceError.databaseAssetNames || []},
            {title: t('gateways.gateway_delete_referenced_asset_groups'), names: referenceError.assetGroupNames || []},
            {title: t('gateways.gateway_delete_referenced_website_groups'), names: referenceError.websiteGroupNames || []},
            {title: t('gateways.gateway_delete_referenced_gateway_groups'), names: referenceError.gatewayGroupNames || []},
        ];
        const hasReferences = referenceGroups.some((group) => group.names.length > 0);
        modal.warning({
            title: hasReferences ? t('gateways.gateway_delete_referenced_title') : t('general.failed'),
            content: (
                <Space direction="vertical" size={12}>
                    {referenceGroups.map((group) => group.names.length > 0 && (
                        <div key={group.title}>
                            <div>{group.title}</div>
                            <ul className="m-0 pl-5">
                                {group.names.map((name, index) => (
                                    <li key={`${name}-${index}`}>{name}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {!hasReferences && (
                        <div>{t('general.error')}</div>
                    )}
                </Space>
            ),
        });
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteById(id),
        onSuccess: () => {
            actionRef.current?.reload();
            showSuccess();
        },
        onError: showDeleteError,
    });

    let columns: NColumn<SSHGateway>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: t('general.name'),
            dataIndex: 'name',
            hideInSearch: true,
        },
        {
            title: t('gateways.config_mode'),
            dataIndex: 'configMode',
            key: 'configMode',
            hideInSearch: true,
            render: (configMode) => {
                switch (configMode) {
                    case 'direct':
                        return <Tag color="blue">{t('gateways.config_mode_direct')}</Tag>
                    case 'credential':
                        return <Tag color="orange">{t('gateways.config_mode_credential')}</Tag>
                    case 'asset':
                        return <Tag color="green">{t('gateways.config_mode_asset')}</Tag>
                    default:
                        return <Tag color="blue">{t('gateways.config_mode_direct')}</Tag>
                }
            }
        },
        {
            title: 'IP',
            dataIndex: 'ip',
            key: 'ip',
            sorter: true,
            hideInSearch: true
        }, {
            title: t('gateways.port'),
            dataIndex: 'port',
            key: 'port',
            hideInSearch: true
        }, {
            title: t('assets.account_type'),
            dataIndex: 'accountType',
            key: 'accountType',
            hideInSearch: true,
            render: (accountType) => {
                switch (accountType) {
                    case 'password':
                        return <Tag color="red">{t('assets.password')}</Tag>
                    case 'private-key':
                        return <Tag color="green">{t('assets.private_key')}</Tag>
                    case 'credential':
                        return <Tag color={'orange'}>{t('menus.resource.submenus.credential')}</Tag>
                }
            }
        }, {
            title: t('gateways.username'),
            dataIndex: 'username',
            key: 'username',
            hideInSearch: true
        },
        {
            title: t('general.created_at'),
            key: 'createdAt',
            dataIndex: 'createdAt',
            hideInSearch: true,
            valueType: 'dateTime'
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            render: (_text, record, _) => (
                <Space>
                    <NButton
                        key="edit"
                        onClick={() => {
                            setOpen(true);
                            setSelectedRowKey(record.id);
                        }}
                    >
                        {t('actions.edit')}
                    </NButton>
                    <Popconfirm
                        key={'delete-confirm'}
                        title={t('general.confirm_delete')}
                        onConfirm={() => {
                            deleteMutation.mutate(record.id);
                        }}
                    >
                        <NButton key='delete' danger={true}>{t('actions.delete')}</NButton>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Disabled disabled={!hasPremiumFeatures}>
                <NTable
                    columns={columns}
                    actionRef={actionRef}
                    request={async (params = {}, sort, _filter) => {
                        if (!hasPremiumFeatures) {
                            return {
                                data: [],
                                success: true,
                                total: 0
                            };
                        }

                        let [sortOrder, sortField] = getSort(sort);

                        let queryParams = {
                            pageIndex: params.current,
                            pageSize: params.pageSize,
                            sortOrder: sortOrder,
                            sortField: sortField,
                            keyword: params.keyword,
                        }
                        let result = await api.getPaging(queryParams);
                        return {
                            data: result['items'],
                            success: true,
                            total: result['total']
                        };
                    }}
                    rowKey="id"
                    options={{
                        search: true,
                    }}
                    search={false}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true
                    }}
                    dateFormatter="string"
                    headerTitle={t('menus.gateway.submenus.ssh_gateway')}
                    toolBarRender={() => [
                        <Button key="button" type="primary" onClick={() => {
                            setOpen(true)
                        }}>
                            {t('actions.new')}
                        </Button>
                    ]}
                />

                <SshGatewayModal
                    id={selectedRowKey}
                    open={open}
                    confirmLoading={mutation.isPending}
                    handleCancel={() => {
                        setOpen(false);
                        setSelectedRowKey(undefined);
                    }}
                    handleOk={mutation.mutate}
                />
            </Disabled>

        </div>
    );
};

export default SshGatewayPage;
