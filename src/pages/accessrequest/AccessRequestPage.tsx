import {useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {
    App,
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    type TableProps,
    Tag,
    Tooltip,
    Typography
} from "antd";
import dayjs from "dayjs";
import React from "react";
import {useTranslation} from "react-i18next";
import {
    AccessRequest,
    AccessRequestResourceType,
    accessRequestAdminApi,
    ApproveAccessRequestRequest
} from "@/api/access-request-api";
import {UserSelect} from "@/components/shared/QuerySelects";
import {getSort} from "@/utils/sort";

const {Text} = Typography;

const AccessRequestPage = () => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [approveForm] = Form.useForm<ApproveAccessRequestRequest>();
    const [rejectForm] = Form.useForm<{reason: string}>();
    const [pagination, setPagination] = useState({current: 1, pageSize: 10});
    const [sort, setSort] = useState<Record<string, string | null>>({});
    const [status, setStatus] = useState<string>();
    const [resourceType, setResourceType] = useState<AccessRequestResourceType>();
    const [requesterId, setRequesterId] = useState<string>();
    const [approveOpen, setApproveOpen] = useState(false);
    const [approveId, setApproveId] = useState<string>();
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectId, setRejectId] = useState<string>();

    const requestPagingQuery = useQuery({
        queryKey: ['admin-access-requests', pagination.current, pagination.pageSize, sort, status, resourceType, requesterId],
        queryFn: async () => {
            const [sortOrder, sortField] = getSort(sort);
            return accessRequestAdminApi.paging({
                pageIndex: pagination.current,
                pageSize: pagination.pageSize,
                sortOrder,
                sortField,
                status: status || undefined,
                resourceType: resourceType || undefined,
                requesterId: requesterId || undefined,
            });
        },
        refetchOnWindowFocus: false,
    });

    const reloadTable = () => {
        requestPagingQuery.refetch();
    };

    const approveMutation = useMutation({
        mutationFn: (payload: {id: string, values: ApproveAccessRequestRequest}) => accessRequestAdminApi.approve(payload.id, payload.values),
        onSuccess: () => {
            reloadTable();
            setApproveOpen(false);
            setApproveId(undefined);
            approveForm.resetFields();
            message.success(t('general.success'));
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (payload: {id: string, reason: string}) => accessRequestAdminApi.reject(payload.id, payload.reason),
        onSuccess: () => {
            reloadTable();
            setRejectOpen(false);
            setRejectId(undefined);
            rejectForm.resetFields();
            message.success(t('general.success'));
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => accessRequestAdminApi.cancel(id),
        onSuccess: () => {
            reloadTable();
            message.success(t('general.success'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => accessRequestAdminApi.deleteById(id),
        onSuccess: () => {
            reloadTable();
            message.success(t('general.success'));
        }
    });

    const statusTag = (status: string, reason?: string) => {
        const map: Record<string, { color: string; label: string }> = {
            pending: {color: 'processing', label: t('access_request.status.pending')},
            approved: {color: 'green', label: t('access_request.status.approved')},
            rejected: {color: 'red', label: t('access_request.status.rejected')},
            cancelled: {color: 'default', label: t('access_request.status.cancelled')},
            closed: {color: 'blue', label: t('access_request.status.closed')},
        };
        const item = map[status] || {color: 'default', label: status};
        if ((status === 'rejected' || status === 'closed') && reason) {
            return (
                <Tooltip title={reason}>
                    <Tag color={item.color}>{item.label}</Tag>
                </Tooltip>
            );
        }
        return <Tag color={item.color}>{item.label}</Tag>;
    };

    const resourceTypeLabel = (value: string) => {
        const map: Record<string, string> = {
            asset: t('access_request.resource_type_asset'),
            database: t('access_request.resource_type_database'),
            website: t('access_request.resource_type_website'),
        };
        return map[value] || value;
    };

    const handleTableChange: TableProps<AccessRequest>['onChange'] = (nextPagination, _filters, sorter) => {
        const activeSorter = Array.isArray(sorter) ? sorter.find((item) => item.order) : sorter;
        const field = activeSorter?.field;
        const fieldName = Array.isArray(field) ? field.join('.') : field ? String(field) : '';
        setSort(activeSorter?.order && fieldName ? {[fieldName]: activeSorter.order} : {});
        setPagination((prev) => ({
            ...prev,
            current: nextPagination.current || 1,
            pageSize: nextPagination.pageSize || prev.pageSize,
        }));
    };

    const statusOptions = [
        {value: 'pending', label: t('access_request.status.pending')},
        {value: 'approved', label: t('access_request.status.approved')},
        {value: 'rejected', label: t('access_request.status.rejected')},
        {value: 'cancelled', label: t('access_request.status.cancelled')},
        {value: 'closed', label: t('access_request.status.closed')},
    ];

    const resourceTypeOptions = [
        {value: 'asset', label: t('access_request.resource_type_asset')},
        {value: 'database', label: t('access_request.resource_type_database')},
        {value: 'website', label: t('access_request.resource_type_website')},
    ];

    const columns: TableProps<AccessRequest>['columns'] = [
        {
            title: t('access_request.resource'),
            dataIndex: 'resourceName',
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => text || record.resourceId,
        },
        {
            title: t('access_request.resource_type'),
            dataIndex: 'resourceType',
            width: 140,
            render: (value) => resourceTypeLabel(value),
        },
        {
            title: t('access_request.requester'),
            dataIndex: 'requesterName',
            width: 120,
        },
        {
            title: t('access_request.request_reason'),
            dataIndex: 'requestReason',
            ellipsis: true,
            render: (text) => text ? (
                <Tooltip title={text} placement="topLeft">
                    <Text ellipsis style={{maxWidth: 260}}>{text}</Text>
                </Tooltip>
            ) : '-',
        },
        {
            title: t('access_request.duration_minutes'),
            dataIndex: 'durationMinutes',
            width: 150,
        },
        {
            title: t('general.status'),
            dataIndex: 'status',
            width: 120,
            render: (_, record) => statusTag(record.status, record.reason),
        },
        {
            title: t('access_request.approver'),
            dataIndex: 'approverName',
            width: 120,
            render: (value) => value || '-',
        },
        {
            title: t('general.created_at'),
            dataIndex: 'createdAt',
            sorter: true,
            width: 180,
            render: (value: number) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            title: t('general.expired_at'),
            dataIndex: 'expiredAt',
            width: 180,
            render: (value: number) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            title: t('actions.label'),
            key: 'option',
            width: 210,
            fixed: 'right',
            render: (_text, record) => {
                const actions = [] as React.ReactNode[];
                if (record.status === 'pending') {
                    actions.push(
                        <Button key="approve" type="link" size="small" onClick={() => {
                            setApproveId(record.id);
                            approveForm.setFieldsValue({durationMinutes: record.durationMinutes});
                            setApproveOpen(true);
                        }}>
                            {t('access_request.approve')}
                        </Button>
                    );
                    actions.push(
                        <Button key="reject" type="link" danger size="small" onClick={() => {
                            setRejectId(record.id);
                            setRejectOpen(true);
                        }}>
                            {t('identity.policy.action.reject')}
                        </Button>
                    );
                }
                if (record.status === 'pending' || record.status === 'approved') {
                    actions.push(
                        <Popconfirm
                            key="cancel"
                            title={t('access_request.cancel_confirm')}
                            onConfirm={() => cancelMutation.mutate(record.id)}
                        >
                            <Button type="link" danger size="small">{t('actions.cancel')}</Button>
                        </Popconfirm>
                    );
                }
                if (record.status !== 'approved') {
                    actions.push(
                        <Popconfirm
                            key="delete"
                            title={`${t('actions.delete')}?`}
                            onConfirm={() => deleteMutation.mutate(record.id)}
                        >
                            <Button type="link" danger size="small">{t('actions.delete')}</Button>
                        </Popconfirm>
                    );
                }
                return actions.length ? <Space size={4}>{actions}</Space> : '-';
            },
        },
    ];

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="font-medium">{t('menus.work_order.submenus.access_request')}</div>
                <Space wrap>
                    <Select
                        allowClear
                        placeholder={t('general.status')}
                        value={status}
                        options={statusOptions}
                        style={{width: 140}}
                        onChange={(value) => {
                            setStatus(value);
                            setPagination((prev) => ({...prev, current: 1}));
                        }}
                    />
                    <Select
                        allowClear
                        placeholder={t('access_request.resource_type')}
                        value={resourceType}
                        options={resourceTypeOptions}
                        style={{width: 160}}
                        onChange={(value) => {
                            setResourceType(value);
                            setPagination((prev) => ({...prev, current: 1}));
                        }}
                    />
                    <UserSelect
                        allowClear
                        value={requesterId}
                        style={{width: 180}}
                        onChange={(value) => {
                            setRequesterId(value);
                            setPagination((prev) => ({...prev, current: 1}));
                        }}
                    />
                </Space>
            </div>

            <Table<AccessRequest>
                rowKey="id"
                columns={columns}
                dataSource={requestPagingQuery.data?.items || []}
                loading={requestPagingQuery.isFetching}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: requestPagingQuery.data?.total || 0,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
                scroll={{x: 'max-content'}}
            />

            <Modal
                title={t('access_request.approve')}
                open={approveOpen}
                confirmLoading={approveMutation.isPending}
                onCancel={() => setApproveOpen(false)}
                onOk={() => approveForm.submit()}
            >
                <Form<ApproveAccessRequestRequest>
                    form={approveForm}
                    layout="vertical"
                    onFinish={(values) => {
                        if (approveId) {
                            approveMutation.mutate({id: approveId, values});
                        }
                    }}
                >
                    <Form.Item label={t('access_request.approved_duration_minutes')} name="durationMinutes">
                        <InputNumber min={1} max={1440} style={{width: '100%'}} />
                    </Form.Item>
                    <Form.Item label={t('general.remark')} name="reason">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={t('identity.policy.action.reject')}
                open={rejectOpen}
                confirmLoading={rejectMutation.isPending}
                onCancel={() => setRejectOpen(false)}
                onOk={() => rejectForm.submit()}
            >
                <Form<{reason: string}>
                    form={rejectForm}
                    layout="vertical"
                    onFinish={(values) => {
                        if (rejectId) {
                            rejectMutation.mutate({id: rejectId, reason: values.reason});
                        }
                    }}
                >
                    <Form.Item label={t('access_request.reject_reason')} name="reason" rules={[{required: true}]}>
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AccessRequestPage;
