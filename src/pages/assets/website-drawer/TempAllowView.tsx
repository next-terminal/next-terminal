import React from 'react';
import {Button, Form, InputNumber, message, Popconfirm, Space, Switch, Table} from "antd";
import type {TableProps} from "antd";
import {useTranslation} from "react-i18next";
import {useMutation, useQuery} from "@tanstack/react-query";
import dayjs from "dayjs";
import websiteTempAllowApi, {WebsiteTempAllowEntry} from "@/api/website-temp-allow-api";

const TempAllowView: React.FC = () => {
    const {t} = useTranslation();
    const form = Form.useFormInstance();
    const websiteId = Form.useWatch('id', form);
    const tempAllowEnabled = Form.useWatch(['tempAllow', 'enabled'], form);

    const tempAllowQuery = useQuery({
        queryKey: ['website-temp-allow', websiteId],
        queryFn: () => websiteTempAllowApi.list(websiteId),
        enabled: !!websiteId,
    });

    const removeTempAllowMutation = useMutation({
        mutationFn: (record: WebsiteTempAllowEntry) => websiteTempAllowApi.remove(websiteId, record.ip),
        onSuccess: () => {
            message.success(t('general.success'));
            tempAllowQuery.refetch();
        }
    });

    const formatRemaining = (seconds?: number) => {
        if (!seconds || seconds <= 0) {
            return '-';
        }
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes < 60) {
            return `${minutes}m ${secs}s`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const tempAllowColumns: TableProps<WebsiteTempAllowEntry>['columns'] = [
        {
            title: 'IP',
            dataIndex: 'ip',
            key: 'ip',
            width: 180,
        },
        {
            title: t('assets.temp_allow_expires'),
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            width: 220,
            render: (value: number) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            title: t('assets.temp_allow_remaining'),
            dataIndex: 'remainingSeconds',
            key: 'remainingSeconds',
            width: 140,
            render: (value: number) => formatRemaining(value),
        },
        {
            title: t('actions.label'),
            key: 'option',
            width: 100,
            render: (_: any, record) => (
                <Popconfirm
                    title={t('general.confirm_delete')}
                    okText={t('actions.delete')}
                    okButtonProps={{danger: true}}
                    onConfirm={() => removeTempAllowMutation.mutate(record)}
                >
                    <Button
                        type="link"
                        danger
                        size="small"
                        loading={removeTempAllowMutation.isPending && removeTempAllowMutation.variables?.ip === record.ip}
                    >
                        {t('actions.delete')}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return <div className="flex flex-col gap-3">
        <Form.Item label={t('assets.temp_allow')} name={['tempAllow', 'enabled']} valuePropName="checked" style={{marginBottom: 0}}>
            <Switch
                checkedChildren={t('general.yes')}
                unCheckedChildren={t('general.no')}/>
        </Form.Item>
        {tempAllowEnabled && (
            <div className="grid grid-cols-1 gap-3 border-t border-gray-200 pt-3 dark:border-gray-700 md:grid-cols-2">
                <Form.Item label={t('assets.temp_allow_duration')} extra={t('assets.temp_allow_duration_tip')} style={{marginBottom: 0}}>
                    <Space.Compact block>
                        <Form.Item name={['tempAllow', 'durationMinutes']} initialValue={5} noStyle>
                            <InputNumber min={1} className="w-full"/>
                        </Form.Item>
                        <Space.Addon>{t('general.minute')}</Space.Addon>
                    </Space.Compact>
                </Form.Item>
                <Form.Item
                    label={t('assets.temp_allow_auto_renew')}
                    name={['tempAllow', 'autoRenew']}
                    extra={t('assets.temp_allow_auto_renew_tip')}
                    valuePropName="checked"
                    style={{marginBottom: 0}}
                >
                    <Switch
                        checkedChildren={t('general.yes')}
                        unCheckedChildren={t('general.no')}/>
                </Form.Item>
            </div>
        )}
        {websiteId && (
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <Table
                    rowKey={(record) => `${record.websiteId}-${record.ip}`}
                    loading={tempAllowQuery.isFetching}
                    dataSource={tempAllowQuery.data || []}
                    columns={tempAllowColumns}
                    pagination={false}
                    size="small"
                />
            </div>
        )}
    </div>;
};
export default TempAllowView;
