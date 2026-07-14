import {useRef} from 'react';
import {Alert, App, Button, Tag, Tooltip, Typography} from "antd";
import {useMutation} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import NTable, {type NColumn, type NTableActionType} from "@/components/NTable";
import execCommandLogApi, {type ExecCommandLog} from "@/api/exec-command-log-api";
import {AssetSelect, UserSelect} from "@/components/shared/QuerySelects";
import {getSort} from "@/utils/sort";
import IPRegion from "@/components/IPRegion";

const {Text} = Typography;

const ExecCommandLogPage = () => {
    const {t} = useTranslation();
    const actionRef = useRef<NTableActionType>(null);
    const {modal} = App.useApp();

    const clearMutation = useMutation({
        mutationFn: execCommandLogApi.clear,
        onSuccess: () => {
            actionRef.current?.reload();
        }
    });

    const statusTag = (record: ExecCommandLog) => {
        if (record.status === 'success') {
            return <Tag color="success">{t('general.success')}</Tag>;
        }
        if (record.status === 'forbidden') {
            return <Tag color="warning">{t('audit.exec_command.status.forbidden')}</Tag>;
        }
        return (
            <Tooltip title={record.result}>
                <Tag color="error">{t('general.failed')}</Tag>
            </Tooltip>
        );
    };

    const columns: NColumn<ExecCommandLog>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: t('menus.identity.submenus.user'),
            dataIndex: 'userAccount',
            renderFormItem: (_, {type, ...rest}) => {
                if (type === 'form') {
                    return null;
                }
                return <UserSelect {...rest} />;
            },
            formItemProps: {
                name: 'userId',
            },
            width: 160,
        },
        {
            title: t('menus.resource.submenus.asset'),
            dataIndex: 'assetName',
            renderFormItem: (_, {type, ...rest}) => {
                if (type === 'form') {
                    return null;
                }
                return <AssetSelect {...rest} />;
            },
            formItemProps: {
                name: 'assetId',
            },
            render: (_, record) => (
                <div>
                    <div>{record.assetName}</div>
                    <Text type="secondary">{record.username}@{record.ip}:{record.port}</Text>
                </div>
            ),
            width: 220,
        },
        {
            title: t('audit.client_ip'),
            dataIndex: 'clientIp',
            hideInSearch: true,
            render: (_, record) => <IPRegion ip={record.clientIp} regionInfo={record.regionInfo}/>,
            width: 150,
        },
        {
            title: t('audit.exec_command.command'),
            dataIndex: 'command',
            render: (_, record) => (
                <Tooltip title={record.command} placement="topLeft">
                    <Text code ellipsis style={{maxWidth: 320}}>{record.command || '-'}</Text>
                </Tooltip>
            ),
            width: 360,
        },
        {
            title: t('audit.exec_command.result'),
            dataIndex: 'result',
            hideInSearch: true,
            render: (_, record) => {
                if (!record.result) {
                    return '-';
                }
                return (
                    <Tooltip title={<pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>{record.result}</pre>} placement="topLeft">
                        <Text ellipsis style={{maxWidth: 320}}>{record.result}</Text>
                    </Tooltip>
                );
            },
            width: 360,
        },
        {
            title: t('general.status'),
            dataIndex: 'status',
            valueEnum: {
                success: {text: t('general.success')},
                failed: {text: t('general.failed')},
                forbidden: {text: t('audit.exec_command.status.forbidden')},
            },
            render: (_, record) => statusTag(record),
            width: 100,
        },
        {
            title: t('audit.exec_command.risk_level'),
            dataIndex: 'riskLevel',
            valueEnum: {
                1: {text: t('audit.exec_command.risk.high')},
                3: {text: t('audit.exec_command.risk.normal')},
            },
            render: (_, record) => {
                if (record.riskLevel === 1) {
                    return <Tag color="error">{t('audit.exec_command.risk.high')}</Tag>;
                }
                return <Tag>{t('audit.exec_command.risk.normal')}</Tag>;
            },
            width: 100,
        },
        {
            title: t('audit.exec_command.exit_code'),
            dataIndex: 'exitCode',
            hideInSearch: true,
            width: 100,
        },
        {
            title: t('audit.exec_command.duration_ms'),
            dataIndex: 'durationMs',
            hideInSearch: true,
            width: 120,
        },
        {
            title: t('audit.exec_command.started_at'),
            dataIndex: 'startedAt',
            valueType: 'dateTime',
            hideInSearch: true,
            sorter: true,
            width: 180,
        },
    ];

    return (
        <div>
            <Alert
                type="info"
                showIcon
                message={t('audit.exec_command.scope_tip')}
                style={{marginBottom: 16}}
            />
            <NTable
                columns={columns}
                actionRef={actionRef}
                request={async (params = {}, sort) => {
                    const [sortOrder, sortField] = getSort(sort);
                    const queryParams = {
                        pageIndex: params.current,
                        pageSize: params.pageSize,
                        sortOrder,
                        sortField,
                        userId: params.userId,
                        assetId: params.assetId,
                        status: params.status,
                        riskLevel: params.riskLevel,
                        command: params.command,
                    };
                    const result = await execCommandLogApi.paging(queryParams);
                    return {
                        data: result['items'],
                        success: true,
                        total: result['total'],
                    };
                }}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                scroll={{
                    x: 'max-content'
                }}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                }}
                dateFormatter="string"
                headerTitle={t('menus.log_audit.submenus.exec_command_log')}
                toolBarRender={() => [
                    <Button
                        key="clear"
                        type="primary"
                        danger
                        onClick={() => {
                            modal.confirm({
                                title: t('general.clear_confirm'),
                                onOk: async () => clearMutation.mutateAsync(),
                            });
                        }}
                    >
                        {t('actions.clear')}
                    </Button>
                ]}
            />
        </div>
    );
};

export default ExecCommandLogPage;
