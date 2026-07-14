import {useEffect, useRef, useState} from "react";
import {App, Button, Checkbox, Divider, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Tag, Typography} from "antd";
import {Plus} from "lucide-react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {notificationChannelApi, notificationRuleApi, NotificationRule} from "@/api/notification-api";
import NTable, {NColumn, NTableActionType} from "@/components/NTable";
import {getSort} from "@/utils/sort";
import {channelTypeLabel, eventGroupLabel, eventGroups, eventTypeLabel, severities, severityLabel} from "./constants";
import {useTranslation} from "react-i18next";

const NotificationRules = () => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const actionRef = useRef<NTableActionType>(null);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>();

    const saveMutation = useMutation({
        mutationFn: async (values: NotificationRule) => {
            if (values.id) {
                await notificationRuleApi.updateById(values.id, values);
                return;
            }
            await notificationRuleApi.create(values);
        },
        onSuccess: () => {
            message.success(t('general.success'));
            setOpen(false);
            setSelectedId(undefined);
            actionRef.current?.reload();
        }
    });

    const columns: NColumn<NotificationRule>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: t('general.name'),
            dataIndex: 'name',
        },
        {
            title: t('settings.notification.event_types_label'),
            dataIndex: 'eventTypes',
            hideInSearch: true,
            render: (_text, record) => <Space wrap>
                {(record.eventTypes || []).map(item => <Tag key={item}>{eventTypeLabel(item, t)}</Tag>)}
            </Space>,
        },
        {
            title: t('settings.notification.severities_label'),
            dataIndex: 'severities',
            hideInSearch: true,
            render: (_text, record) => <Space wrap>
                {(record.severities || []).map(item => <Tag key={item}>{severityLabel(item, t)}</Tag>)}
            </Space>,
        },
        {
            title: t('general.status'),
            dataIndex: 'enabled',
            hideInSearch: true,
            render: (_text, record) => record.enabled ?
                <Tag color="success">{t('general.enabled')}</Tag> :
                <Tag>{t('general.disabled')}</Tag>,
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            width: 160,
            render: (_text, record) => <Space>
                <Button size="small" onClick={() => {
                    setSelectedId(record.id);
                    setOpen(true);
                }}>
                    {t('actions.edit')}
                </Button>
                <Popconfirm title={t('general.confirm_delete')} onConfirm={async () => {
                    await notificationRuleApi.deleteById(record.id);
                    actionRef.current?.reload();
                }}>
                    <Button size="small" danger>{t('actions.delete')}</Button>
                </Popconfirm>
            </Space>,
        },
    ];

    return <div>
        <NTable
            columns={columns}
            actionRef={actionRef}
            request={async (params = {}, sort) => {
                const [sortOrder, sortField] = getSort(sort);
                const result = await notificationRuleApi.getPaging({
                    pageIndex: params.current,
                    pageSize: params.pageSize,
                    sortOrder,
                    sortField,
                    name: params.name,
                });
                return {data: result.items, success: true, total: result.total};
            }}
            rowKey="id"
            search={{labelWidth: 'auto'}}
            pagination={{defaultPageSize: 10, showSizeChanger: true}}
            dateFormatter="string"
            headerTitle={t('settings.notification.rules')}
            toolBarRender={() => [
                <Button key="new" type="primary" icon={<Plus size={16}/>} onClick={() => setOpen(true)}>
                    {t('actions.new')}
                </Button>
            ]}
        />
        <NotificationRuleModal
            id={selectedId}
            open={open}
            confirmLoading={saveMutation.isPending}
            onCancel={() => {
                setOpen(false);
                setSelectedId(undefined);
            }}
            onOk={saveMutation.mutate}
        />
    </div>;
};

const NotificationRuleModal = ({
                                   id,
                                   open,
                                   confirmLoading,
                                   onCancel,
                                   onOk,
                               }: {
    id?: string;
    open: boolean;
    confirmLoading: boolean;
    onCancel: () => void;
    onOk: (values: NotificationRule) => void;
}) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const channelsQuery = useQuery({
        queryKey: ['notification-channels'],
        queryFn: notificationChannelApi.getAll,
        enabled: open,
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        form.resetFields();
        if (!id) {
            form.setFieldsValue({
                enabled: true,
                eventTypes: [],
                severities: [],
                channelIds: [],
                quietMinutes: 0,
                conditions: {},
            });
            return;
        }
        notificationRuleApi.getById(id).then(data => {
            form.setFieldsValue(data);
        });
    }, [form, id, open]);

    const handleOk = async () => {
        const values = await form.validateFields();
        onOk({...values, id} as NotificationRule);
    };

    return <Modal
        title={id ? t('settings.notification.edit_rule') : t('settings.notification.new_rule')}
        open={open}
        confirmLoading={confirmLoading}
        onCancel={onCancel}
        onOk={handleOk}
        destroyOnHidden
        width={960}
    >
        <Form form={form} layout="vertical">
            <Form.Item name="name" label={t('general.name')} rules={[{required: true}]}>
                <Input/>
            </Form.Item>
            <Form.Item name="enabled" label={t('general.status')} valuePropName="checked">
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
            </Form.Item>
            <Form.Item name="eventTypes" label={t('settings.notification.event_types_label')} rules={[{required: true}]}>
                <Checkbox.Group style={{width: '100%'}}>
                    <div className="space-y-3">
                        {eventGroups.map((group, index) => <div key={group.key}>
                            {index > 0 && <Divider style={{margin: '8px 0'}}/>}
                            <Typography.Text strong>{eventGroupLabel(group.key, t)}</Typography.Text>
                            <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
                                {group.events.map(item => <Checkbox key={item} value={item}>
                                    {eventTypeLabel(item, t)}
                                </Checkbox>)}
                            </div>
                        </div>)}
                    </div>
                </Checkbox.Group>
            </Form.Item>
            <Form.Item name="severities" label={t('settings.notification.severities_label')}>
                <Select mode="multiple" options={severities.map(item => ({
                    label: severityLabel(item, t),
                    value: item,
                }))}/>
            </Form.Item>
            <Form.Item name="channelIds" label={t('settings.notification.channels')} rules={[{required: true}]}>
                <Select mode="multiple" loading={channelsQuery.isLoading}
                        options={(channelsQuery.data || []).map(item => ({
                            label: channelTypeLabel(item.type, t),
                            value: item.type,
                        }))}/>
            </Form.Item>
            <Form.Item name="quietMinutes" label={t('settings.notification.quiet_minutes')}>
                <InputNumber min={0} precision={0} style={{width: '100%'}}/>
            </Form.Item>
        </Form>
    </Modal>;
};

export default NotificationRules;
