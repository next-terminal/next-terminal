import { baseUrl } from "@/api/core/requests";
import sessionApi,{ getSessionAccessMode,Session } from "@/api/session-api";
import IPRegion from "@/components/IPRegion";
import NButton from "@/components/NButton";
import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { getProtocolColor } from "@/helper/asset-helper";
import { getSort } from "@/utils/sort";
import { browserDownload,renderSize } from "@/utils/utils";
import { useMutation } from "@tanstack/react-query";
import { App,Button,Popconfirm,Progress,Space,Table,Tag,Tooltip,Typography } from "antd";
import clsx from "clsx";
import {Download, PlayCircle} from "lucide-react";
import { useRef,useState } from 'react';
import { useTranslation } from "react-i18next";

const OfflineSessionPage = () => {
    const { t } = useTranslation();
    const actionRef = useRef<NTableActionType>(null);

    const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());

    const { modal, message } = App.useApp();

    const downloadRecording = (sessionId: string, recordingType?: 'video') => {
        const endpoint = recordingType === 'video' ? 'video-recording' : 'recording';
        browserDownload(`${baseUrl()}/admin/sessions/${sessionId}/${endpoint}?download=true`);
    };

    const triggerRecordingConvert = async (sessionId: string) => {
        setConvertingIds(prev => new Set(prev).add(sessionId));
        try {
            await sessionApi.triggerRecordingConvert(sessionId);
            actionRef.current?.reload();
        } catch {
            message.error(t('audit.recording_convert_status.trigger_failed'));
        } finally {
            setConvertingIds(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
        }
    };

    const batchDeleteMutation = useMutation({
        mutationFn: sessionApi.deleteById,
        onSuccess: () => actionRef.current?.reload(),
    });

    const clearMutation = useMutation({
        mutationFn: sessionApi.clear,
        onSuccess: () => actionRef.current?.reload(),
    });

    const isRecordingConvertProcessing = (record: Session) =>
        record.recordingConvertStatus === 'processing';

    const hasVideoRecording = (record: Session) =>
        (record.videoSize || 0) > 0;

    const videoRecordingSize = (record: Session) =>
        record.videoSize || 0;

    const canConvertRecording = (record: Session) => {
        const accessMode = getSessionAccessMode(record);
        const convertibleAccessMode = accessMode === 'terminal' || accessMode === 'guacd' || accessMode === 'rdp_proxy';
        const convertibleStatus = !record.recordingConvertStatus || record.recordingConvertStatus === 'pending' || record.recordingConvertStatus === 'failed';
        return record.recordingSize > 0 && convertibleAccessMode && convertibleStatus && !hasVideoRecording(record);
    };

    const openOriginalPlayback = (record: Session) => {
        const accessMode = getSessionAccessMode(record);
        switch (accessMode) {
            case 'terminal':
                window.open(`/terminal-playback?sessionId=${record.id}`, '_blank');
                break;
            case 'guacd':
                window.open(`/graphics-playback?sessionId=${record.id}`, '_blank');
                break;
            case 'rdp_proxy':
                window.open(`/graphics-playback?sessionId=${record.id}`, '_blank');
                break;
            default:
                message.warning(t('audit.unknown_protocol', {protocol: record.protocol}));
        }
    };

    const openVideoPlayback = (record: Session) => {
        window.open(`/video-playback?sessionId=${record.id}`, '_blank');
    };

    const renderRecordingActions = (record: Session, recordingType?: 'video') => (
        <Space size={4}>
            <Tooltip title={t('audit.options.playback')}>
                <Button
                    type="text"
                    size="small"
                    shape="circle"
                    className="!text-blue-600 hover:!bg-blue-50"
                    icon={<PlayCircle className="h-4 w-4"/>}
                    onClick={() => recordingType === 'video' ? openVideoPlayback(record) : openOriginalPlayback(record)}
                />
            </Tooltip>
            <Tooltip title={t('actions.download')}>
                <Button
                    type="text"
                    size="small"
                    shape="circle"
                    className="!text-gray-500 hover:!bg-gray-100 hover:!text-gray-700"
                    icon={<Download className="h-4 w-4"/>}
                    onClick={() => downloadRecording(record.id, recordingType)}
                />
            </Tooltip>
        </Space>
    );

    const renderRecordingConvertStatus = (record: Session) => {
        const canConvert = canConvertRecording(record);
        const manualConverting = convertingIds.has(record.id);
        const convertButton = canConvert ? (
            <Button
                type="link"
                size="small"
                loading={manualConverting}
                style={{padding: 0}}
                onClick={() => triggerRecordingConvert(record.id)}
            >
                {record.recordingConvertStatus === 'failed' ? t('audit.recording_convert_status.retry') : t('audit.recording_convert_status.start')}
            </Button>
        ) : null;

        switch (record.recordingConvertStatus) {
            case 'pending':
                return <Tag color="processing">{t('audit.recording_convert_status.pending')}</Tag>;
            case 'processing':
                return (
                    <div style={{ minWidth: 140 }}>
                        <div className="mb-1 text-xs text-gray-500">{t('audit.recording_convert_status.processing')}</div>
                        <Progress
                            percent={record.recordingConvertProgress || 0}
                            size="small"
                            status="active"
                        />
                    </div>
                );
            case 'completed':
                return null;
            case 'failed':
                return (
                    <Space size={6}>
                        <Tooltip title={record.message || undefined}>
                            <Tag color="error" className="!mr-0">{t('audit.recording_convert_status.failed')}</Tag>
                        </Tooltip>
                        {convertButton}
                    </Space>
                );
            default:
                return convertButton;
        }
    };

    const renderRecordingCell = (record: Session) => {
        const showOriginal = record.recordingSize > 0;
        const showVideo = hasVideoRecording(record) && !isRecordingConvertProcessing(record);
        const convertStatus = renderRecordingConvertStatus(record);

        if (!showOriginal && !showVideo && !convertStatus) {
            return '-';
        }

        return (
            <div className="space-y-1">
                {showOriginal && (
                    <div>
                        <Space size={6} wrap>
                            <Tag className="!mr-0">{t('audit.original_recording')}</Tag>
                            <Typography.Text>{renderSize(record.recordingSize)}</Typography.Text>
                            {renderRecordingActions(record)}
                        </Space>
                    </div>
                )}
                {showVideo && (
                    <div>
                        <Space size={6} wrap>
                            <Tag color="blue" className="!mr-0">{t('audit.video_recording')}</Tag>
                            <Typography.Text>{renderSize(videoRecordingSize(record))}</Typography.Text>
                            {renderRecordingActions(record, 'video')}
                        </Space>
                    </div>
                )}
                {convertStatus && <div>{convertStatus}</div>}
            </div>
        );
    };

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
                const title = `${record['protocol']} ${record.username}@${record.ip}:${record.port}`;
                return <div>
                    <div>{text}</div>
                    <Typography.Text type="secondary">{title}</Typography.Text>
                </div>;
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
            render: (_text, record) => (
                <span
                    className={clsx('rounded-md px-1.5 py-1 text-white font-bold', getProtocolColor(record.protocol))}
                    style={{ fontSize: 9 }}>
                    {record.protocol.toUpperCase()}
                </span>
            ),
        },
        {
            title: t('audit.connected_at'),
            dataIndex: 'connectedAt',
            key: 'connectedAt',
            hideInSearch: true,
            valueType: "dateTime",
        },
        {
            title: t('audit.connection_duration'),
            dataIndex: 'connectionDuration',
            key: 'connectionDuration',
            hideInSearch: true,
        },
        {
            title: t('audit.recording'),
            dataIndex: 'recordingSize',
            key: 'recordingSize',
            hideInSearch: true,
            render: (_text, record) => renderRecordingCell(record),
        },
        {
            title: t('audit.command_count'),
            dataIndex: 'commandCount',
            key: 'commandCount',
            hideInSearch: true,
            render: (_text, record) => record.commandCount || '-',
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            render: (_text, record) => {
                return (
                    <Popconfirm
                        title={t('general.confirm_delete')}
                        onConfirm={async () => {
                            await sessionApi.deleteById(record.id);
                            actionRef.current?.reload();
                        }}
                    >
                        <NButton danger={true}>{t('actions.delete')}</NButton>
                    </Popconfirm>
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
                request={async (params = {}, sort) => {
                    const [sortOrder, sortField] = getSort(sort);
                    const result = await sessionApi.getPaging({
                        pageIndex: params.current,
                        pageSize: params.pageSize,
                        sortOrder,
                        sortField,
                        status: 'disconnected',
                        keyword: params.keyword,
                    });
                    return {
                        data: result['items'],
                        success: true,
                        total: result['total'],
                    };
                }}
                rowKey="id"
                options={{
                    search: true,
                }}
                search={false}
                pagination={{ defaultPageSize: 10, showSizeChanger: true }}
                dateFormatter="string"
                headerTitle={t('menus.log_audit.submenus.offline_session')}
                rowSelection={{
                    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
                }}
                tableAlertOptionRender={({ selectedRowKeys }) => (
                    <Space size={16}>
                        <NButton
                            danger={true}
                            loading={batchDeleteMutation.isPending}
                            onClick={() => batchDeleteMutation.mutate(selectedRowKeys.join(','))}
                        >
                            {t('actions.delete')}
                        </NButton>
                    </Space>
                )}
                toolBarRender={() => [
                    <Button key="clear" type="primary" danger onClick={() => {
                        modal.confirm({
                            title: t('general.clear_confirm'),
                            onOk: () => clearMutation.mutate(),
                        });
                    }}>
                        {t('actions.clear')}
                    </Button>,
                ]}
                polling={5000}
            />
        </div>
    );
};

export default OfflineSessionPage;
