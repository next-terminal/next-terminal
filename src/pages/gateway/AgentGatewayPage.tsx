import agentGatewayApi,{ AgentGateway,GatewayReferenceError,SortPositionRequest } from "@/api/agent-gateway-api";
import Disabled from "@/components/Disabled";
import { DragHandle } from "@/components/DraggableTable";
import NButton from "@/components/NButton";
import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { useLicense } from "@/hook/LicenseContext";
import AgentGatewayModal from "@/pages/gateway/AgentGatewayModal";
import AgentGatewayRegister from "@/pages/gateway/AgentGatewayRegister";
import AgentGatewayStat from "@/pages/gateway/AgentGatewayStat";
import AgentGatewayTokenDrawer from "@/pages/gateway/AgentGatewayTokenDrawer";
import { getSort } from "@/utils/sort";
import { getColor,renderSize } from "@/utils/utils";
import { useMutation,useQuery } from "@tanstack/react-query";
import { App,Button,Popconfirm,Progress,Space,Tag } from "antd";
import { ArrowDown,ArrowUp } from "lucide-react";
import { useRef,useState } from 'react';
import { useTranslation } from "react-i18next";

const api = agentGatewayApi;

const linuxImg = new URL('@/assets/images/linux.png', import.meta.url).href;
const windowsImg = new URL('@/assets/images/windows.png', import.meta.url).href;
const macosImg = new URL('@/assets/images/macos.png', import.meta.url).href;

const AgentGatewayPage = () => {

    const {t} = useTranslation();
    const actionRef = useRef<NTableActionType>(null);

    let [open, setOpen] = useState<boolean>(false);
    let [registerOpen, setRegisterOpen] = useState<boolean>(false);
    let [selectedRowKey, setSelectedRowKey] = useState<string>('');
    let { license } = useLicense();
    const hasPremiumFeatures = license.hasPremiumFeatures();
    let [dataSource, setDataSource] = useState<AgentGateway[]>([]);

    let [tokenManageOpen, setTokenManageOpen] = useState<boolean>(false);
    let [statOpen, setStatOpen] = useState<boolean>(false);

    const selectedGateway = selectedRowKey ? dataSource.find(item => item.id === selectedRowKey) : undefined;

    const {message, modal} = App.useApp();

    // 获取 agent 版本号
    const {data: versionData} = useQuery({
        queryKey: ['agentVersion'],
        queryFn: () => api.getVersion(),
        enabled: hasPremiumFeatures,
        staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
    });

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
            // 重新获取数据
            actionRef.current?.reload();
            setOpen(false);
            setSelectedRowKey('');
            showSuccess();
        }
    });

    const updateSortMutation = useMutation({
        mutationFn: (req: SortPositionRequest) => api.updateSortPosition(req),
        onSuccess: () => {
            // 不立即重新加载，让 polling 自然更新数据
            message.success(t('general.success'));
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

    const handleDragSortEnd = (_beforeIndex: number, afterIndex: number, newDataSource: AgentGateway[]) => {
        // console.log('排序操作', {beforeIndex, afterIndex});

        // 立即更新本地状态，避免闪烁
        setDataSource(newDataSource);

        // 获取被拖拽的项
        const draggedItem = newDataSource[afterIndex];

        // 因为使用 DESC 排序，sort 大的在前面
        // 所以 beforeId 对应的 sort 应该更大，afterId 对应的 sort 应该更小
        const req: SortPositionRequest = {
            id: draggedItem.id,
            // 前一项的 sort 更大（DESC 排序）
            beforeId: afterIndex > 0 ? newDataSource[afterIndex - 1].id : '',
            // 后一项的 sort 更小（DESC 排序）
            afterId: afterIndex < newDataSource.length - 1 ? newDataSource[afterIndex + 1].id : ''
        };

        // 服务器更新
        updateSortMutation.mutate(req);
    };

    const renderLoadStatus = (load?: number, cores?: number) => {
        if (load === undefined || load === null || !cores) return null;
        const ratio = load / cores;
        if (ratio < 0.7) return {color: 'green', text: t('gateways.load.normal')};
        if (ratio < 1.0) return {color: 'orange', text: t('gateways.load.moderate')};
        return {color: 'red', text: t('gateways.load.busy')};
    };

    const renderPingTag = (ping?: number) => {
        if (ping === undefined || ping === null) return '-';
        let color = 'green';
        if (ping >= 200) color = 'red';
        else if (ping >= 120) color = 'orange';
        else if (ping >= 60) color = 'gold';
        return <Tag color={color} variant="filled" className="!m-0">{ping} ms</Tag>;
    };

    let columns: NColumn<AgentGateway>[] = [
        {
            title: t('assets.sort'),
            dataIndex: 'sort',
            width: 60,
            className: 'drag-visible',
            hideInSearch: true,
            fixed: 'left',
            render: () => <DragHandle title={t('assets.sort')}/>,
        },
        {
            title: t('general.name'),
            dataIndex: 'name',
            hideInSearch: true,
            className: 'drag-visible',
            width: 260,
            fixed: 'left',
            render: (_text, record) => {
                let osImg = '';
                switch (record.os) {
                    case 'linux':
                        osImg = linuxImg;
                        break;
                    case 'windows':
                        osImg = windowsImg;
                        break;
                    case 'darwin':
                        osImg = macosImg;
                        break;
                }
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <img src={osImg} className="w-5 h-5" alt="os"/>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{record.name}</span>
                                {record.version && (
                                    <Tag color="blue" variant="filled" className="!m-0">v{record.version}</Tag>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="font-mono">{record.ip || '-'}</span>
                                <span className="text-gray-300">•</span>
                                <span>{record.os}/{record.arch}</span>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            title: t('general.status'),
            dataIndex: 'online',
            key: 'online',
            hideInSearch: true,
            width: 90,
            render: (_text, record) => {
                if (record.online === false) {
                    return <Tag variant="filled" className="!m-0">{t('general.offline')}</Tag>;
                }
                return <Tag color="green" variant="filled" className="!m-0">{t('general.online')}</Tag>;
            }
        },
        {
            title: t('gateways.stat.ping'),
            dataIndex: 'stat.ping',
            key: 'stat.ping',
            hideInSearch: true,
            width: 90,
            render: (_text, record) => {
                if (record.online === false) return '-';
                return renderPingTag(record.stat?.ping);
            }
        },
        {
            title: t('gateways.stat.load'),
            dataIndex: 'stat.load',
            key: 'stat.load',
            hideInSearch: true,
            width: 120,
            render: (_text, record) => {
                if (record.online === false) {
                    return '-';
                }
                const load1 = record.stat?.load?.load_1;
                const load = `${record.stat?.load?.load_1?.toFixed(2) || '-'}, ${record.stat?.load?.load_5?.toFixed(2) || '-'}, ${record.stat?.load?.load_15?.toFixed(2) || '-'}`;
                const cores = record.stat?.cpu?.logical_cores;
                const status = renderLoadStatus(load1, cores);
                return (
                    <div className="flex flex-col gap-1">
                        <div className="text-xs text-gray-500">{load}</div>
                        {status ? <Tag color={status.color} variant="filled" className="!m-0 w-fit">{status.text}</Tag> : '-'}
                    </div>
                );
            }
        },
        {
            title: 'CPU',
            dataIndex: 'stat.cpu',
            key: 'stat.cpu',
            hideInSearch: true,
            width: 100,
            render: (_text, record) => {
                if (!record.stat?.cpu.percent) return '-';
                return <Progress
                    size="small"
                    strokeColor={getColor(record.stat?.cpu.percent)}
                    percent={record.stat?.cpu.percent}
                    format={(percent) => `${percent?.toFixed(1)}%`}
                />
            }
        },
        {
            title: t('gateways.stat.memory'),
            dataIndex: 'stat.memory',
            key: 'stat.memory',
            hideInSearch: true,
            width: 100,
            render: (_text, record) => {
                if (!record.stat?.memory.percent) return '-';
                return <Progress
                    size="small"
                    strokeColor={getColor(record.stat?.memory.percent)}
                    percent={record.stat?.memory.percent}
                    format={(percent) => `${percent?.toFixed(1)}%`}
                />
            }
        },
        {
            title: t('gateways.stat.disk'),
            dataIndex: 'stat.disk',
            key: 'stat.disk',
            hideInSearch: true,
            width: 100,
            render: (_text, record) => {
                if (!record.stat?.disk.percent) return '-';
                return <Progress
                    size="small"
                    strokeColor={getColor(record.stat?.disk.percent)}
                    percent={record.stat?.disk.percent}
                    format={(percent) => `${percent?.toFixed(1)}%`}
                />
            }
        },
        {
            title: t('gateways.stat.network_io'),
            dataIndex: 'stat.network_io',
            key: 'stat.network_io',
            hideInSearch: true,
            width: 100,
            render: (_text, record) => {
                if (!record.stat?.network) return '-';
                return <div className="flex flex-col gap-0.5 text-xs">
                    <div className={'flex items-center gap-1 text-green-600'}>
                        <ArrowUp className={'h-3 w-3'}/>
                        {renderSize(record.stat?.network.tx_sec)}/s
                    </div>
                    <div className={'flex items-center gap-1 text-blue-600'}>
                        <ArrowDown className={'h-3 w-3'}/>
                        {renderSize(record.stat?.network.rx_sec)}/s
                    </div>
                </div>
            }
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            width: 100,
            fixed: 'right',
            render: (_text, record) => (
                <Space>
                    <NButton
                        key="stat"
                        onClick={() => {
                            setStatOpen(true);
                            setSelectedRowKey(record.id);
                        }}
                    >
                        {t('gateways.monitor.action')}
                    </NButton>
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
        <div className={'w-full'}>
            <Disabled disabled={!hasPremiumFeatures}>
                <NTable
                    headerTitle={
                        <div className={'flex items-center gap-2'}>
                            <span>{t('menus.gateway.submenus.agent_gateway')}</span>
                            {versionData?.version && (
                                <Tag color="blue" variant="filled">v{versionData.version}</Tag>
                            )}
                        </div>
                    }
                    columns={columns}
                    actionRef={actionRef}
                    rowKey="id"
                    options={{
                        search: true,
                    }}
                    search={false}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true
                    }}
                    request={async (params = {}, sort, _filter) => {
                        if (!hasPremiumFeatures) {
                            setDataSource([]);
                            return {
                                data: [],
                                success: true,
                                total: 0
                            };
                        }

                        let [sortOrder, sortField] = getSort(sort);
                        if (sortOrder === "" && sortField === "") {
                            sortOrder = "desc";  // 使用降序，让最大的 sort 显示在最上面
                            sortField = "sort";
                        }

                        let queryParams = {
                            pageIndex: params.current,
                            pageSize: params.pageSize,
                            sortOrder: sortOrder,
                            sortField: sortField,
                            keyword: params.keyword,
                        }
                        let result = await api.getPaging(queryParams);
                        // 直接使用后端返回的数据，包含 sortOrder 字段
                        setDataSource(result['items']);
                        return {
                            data: result['items'],
                            success: true,
                            total: result['total']
                        };
                    }}
                    dataSource={dataSource}
                    dragSortKey="sort"
                    onDragSortEnd={handleDragSortEnd}
                    rowClassName={(record) => {
                        if (!record.online) {
                            return 'grayscale';
                        }
                        return '';
                    }}
                    dateFormatter="string"
                    toolBarRender={() => [
                        <Button key="token-manage" color={'purple'} variant={'filled'} onClick={() => {
                            setTokenManageOpen(true)
                        }}>
                            {t('gateways.token_manage')}
                        </Button>,
                        <Button
                            key="register-button"
                            type="primary"
                            onClick={() => {
                                setRegisterOpen(true)
                            }}
                        >
                            {t('gateways.register')}
                        </Button>
                    ]}
                    polling={hasPremiumFeatures ? 5000 : undefined}
                    scroll={{
                        x: 'max-content'
                    }}
                />

                {hasPremiumFeatures && (
                    <>
                        <AgentGatewayModal
                            id={selectedRowKey}
                            open={open}
                            confirmLoading={mutation.isPending}
                            handleCancel={() => {
                                setOpen(false);
                                setSelectedRowKey('');
                            }}
                            handleOk={mutation.mutate}
                        />

                        <AgentGatewayRegister
                            open={registerOpen}
                            handleCancel={() => {
                                setRegisterOpen(false);
                            }}
                        />

                        <AgentGatewayTokenDrawer
                            open={tokenManageOpen}
                            onClose={() => {
                                setTokenManageOpen(false);
                            }}
                        />

                        <AgentGatewayStat
                            open={statOpen}
                            id={selectedRowKey}
                            updatedAt={selectedGateway?.updatedAt}
                            onClose={() => {
                                setStatOpen(false);
                            }}
                        />
                    </>
                )}
            </Disabled>
        </div>
    );
};

export default AgentGatewayPage;
