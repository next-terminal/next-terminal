import commandFilterApi,{ CommandFilter } from '@/api/command-filter-api';
import Disabled from "@/components/Disabled";
import NButton from "@/components/NButton";
import NLink from "@/components/NLink";
import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { useLicense } from "@/hook/LicenseContext";
import CommandFilterModal from "@/pages/authorised/CommandFilterModal";
import { getSort } from "@/utils/sort";
import { useMutation } from "@tanstack/react-query";
import {
Button,
Dropdown,
Popconfirm,
Space
} from "antd";
import { useRef,useState } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const api = commandFilterApi;

const CommandFilterPage = () => {

    const {t} = useTranslation();
    const {license} = useLicense();
    const hasPremiumFeatures = license.hasPremiumFeatures();
    const actionRef = useRef<NTableActionType>(null);

    let [open, setOpen] = useState<boolean>(false);
    let [selectedRowKey, setSelectedRowKey] = useState<string>();

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
            setSelectedRowKey(undefined);
            setOpen(false);
            actionRef.current?.reload();
        }
    });

    let navigate = useNavigate();

    const columns: NColumn<CommandFilter>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: t('general.name'),
            dataIndex: 'name',
            render: (text, record) => {
                return <NLink to={`/command-filter/${record['id']}?activeKey=info`}>{text}</NLink>;
            },
        },
        {
            title: t('general.created_at'),
            key: 'createdAt',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            hideInSearch: true,
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            render: (_text, record) => (
                <Space>
                    <NButton
                        key="edit"
                        onClick={() => {
                            setOpen(true);
                            setSelectedRowKey(record['id']);
                        }}
                    >
                        {t('actions.edit')}
                    </NButton>
                    <Popconfirm
                        key={'delete-confirm'}
                        title={t('general.confirm_delete')}
                        onConfirm={async () => {
                            await api.deleteById(record.id);
                            actionRef.current?.reload();
                        }}
                    >
                        <NButton key='delete' danger={true}>{t('actions.delete')}</NButton>
                    </Popconfirm>
                    <Dropdown
                        key="actionGroup"
                        menu={{
                            items: [
                                {key: 'command-filter-detail', label: t('actions.detail')},
                                {key: 'command-filter-rule', label: t('authorised.command_filter.options.rule')},
                            ],
                            onClick: ({key}) => {
                                switch (key) {
                                    case 'command-filter-detail':
                                        navigate(`/command-filter/${record['id']}?activeKey=info`);
                                        break;
                                    case 'command-filter-rule':
                                        navigate(`/command-filter/${record['id']}?activeKey=rules`);
                                        break;
                                }
                            }
                        }}
                    >
                        <Button type="link" size="small" style={{padding: 0}}>
                            {t('actions.more')}
                        </Button>
                    </Dropdown>
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
                            name: params.name,
                        }
                        let result = await api.getPaging(queryParams);
                        return {
                            data: result['items'],
                            success: true,
                            total: result['total']
                        };
                    }}
                    rowKey="id"
                    search={{
                        labelWidth: 'auto',
                    }}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true
                    }}
                    dateFormatter="string"
                    headerTitle={t('menus.authorised.submenus.command_filter')}
                    toolBarRender={() => [
                        <Button key="button" type="primary" onClick={() => {
                            setOpen(true)
                        }}>
                            {t('actions.new')}
                        </Button>
                        ,
                    ]}
                />

                <CommandFilterModal
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
}

export default CommandFilterPage;
