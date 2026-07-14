import sessionApi,{ getSessionAccessMode,Session } from "@/api/session-api";
import IPRegion from "@/components/IPRegion";
import NButton from "@/components/NButton";
import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { getProtocolColor } from "@/helper/asset-helper";
import { getSort } from "@/utils/sort";
import { App,Popconfirm,Space,Tag,Tooltip,Typography } from "antd";
import clsx from "clsx";
import { useRef } from 'react';
import { useTranslation } from "react-i18next";

const OnlineSessionPage = () => {
    const {t} = useTranslation();
    const actionRef = useRef<NTableActionType>(null);

    const {message} = App.useApp();

    const columns: NColumn<Session>[] = [
        {
            title: t('menus.identity.submenus.user'),
            dataIndex: 'userAccount',
            key: 'userAccount',
        },
        {
            title: t('menus.resource.submenus.asset'),
            dataIndex: 'assetName',
            key: 'assetName',
            render: (text, record) => {
                let view = <div>{text}</div>;
                const title = `${record['protocol']} ${record.username}@${record.ip}:${record.port}`;
                return <div>
                    {view}
                    <Typography.Text type="secondary">{title}</Typography.Text>
                </div>
            },
        },
        {
            title: t('audit.client_ip'),
            dataIndex: 'clientIp',
            key: 'clientIp',
            render: (_, record) => <IPRegion ip={record.clientIp} regionInfo={record.regionInfo}/>,
        },

        {
            title: t('assets.protocol'),
            dataIndex: 'protocol',
            key: 'protocol',
            sorter: true,
            render: (_text, record) => {
                const accessMode = getSessionAccessMode(record);
                return <Space size={4}>
                    <span
                        className={clsx('rounded-md px-1.5 py-1 text-white font-bold', getProtocolColor(record.protocol))}
                        style={{fontSize: 9,}}>
                        {record.protocol.toUpperCase()}
                    </span>
                    {accessMode === 'rdp_proxy' && <Tag color="processing">{t('audit.rdp_proxy.label')}</Tag>}
                </Space>
            },
        },
        {
            title: t('audit.connected_at'),
            dataIndex: 'connectedAt',
            key: 'connectedAt',
            hideInSearch: true,
            valueType: 'dateTime'
        }, {
            title: t('audit.connection_duration'),
            dataIndex: 'connectionDuration',
            key: 'connectionDuration',
            hideInSearch: true,
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            render: (_text, record) => {
                const accessMode = getSessionAccessMode(record);
                const unsupportedOnlineAction = accessMode === 'rdp_proxy';
                const unsupportedTip = unsupportedOnlineAction ? t('audit.rdp_proxy.unsupported_online_action') : undefined;
                return (
                    <Space>
                        <Tooltip title={unsupportedTip}>
                            <span>
                                <NButton
                                    key='monitor'
                                    disabled={unsupportedOnlineAction}
                                    onClick={() => {
                                        switch (accessMode) {
                                            case 'terminal':
                                                window.open(`/terminal-monitor?sessionId=${record.id}`, '_blank')
                                                break;
                                            case 'guacd':
                                                window.open(`/graphics-monitor?sessionId=${record.id}`, '_blank')
                                                break;
                                            case 'rdp_proxy':
                                                message.warning(t('audit.rdp_proxy.unsupported_online_action'));
                                                break;
                                            default:
                                                message.warning(t('audit.unknown_protocol', {protocol: record.protocol}));
                                        }
                                    }}
                                >
                                    {t('gateways.monitor.action')}
                                </NButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={unsupportedTip}>
                            <span>
                                <Popconfirm
                                    key={'confirm-disconnect'}
                                    disabled={unsupportedOnlineAction}
                                    title={t('audit.options.disconnect.confirm')}
                                    onConfirm={async () => {
                                        await sessionApi.disconnect(record.id);
                                        actionRef.current?.reload();
                                    }}
                                >
                                    <NButton key='delete' danger disabled={unsupportedOnlineAction}>
                                        {t('audit.options.disconnect.action')}
                                    </NButton>
                                </Popconfirm>
                            </span>
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            <NTable
                defaultSize={'small'}
                columns={columns}
                actionRef={actionRef}
                    request={async (params = {}, sort, _filter) => {
                        let [sortOrder, sortField] = getSort(sort);
                        
                        let queryParams = {
                        pageIndex: params.current,
                        pageSize: params.pageSize,
                        sortOrder: sortOrder,
                        sortField: sortField,
                        status: 'connected',
                        keyword: params.keyword,
                    }
                    let result = await sessionApi.getPaging(queryParams);
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
                polling={1000}
                dateFormatter="string"
                headerTitle={t('menus.log_audit.submenus.online_session')}
                toolBarRender={() => []}
            />
        </div>
    );
};

export default OnlineSessionPage;
