import authorisedWebsiteApi,{ AuthorisedWebsite } from "@/api/authorised-website-api";
import NButton from "@/components/NButton";
import NLink from "@/components/NLink";
import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { DepartmentTreeSelect,UserSelect,WebsiteGroupTreeSelect,WebsiteTreeSelect } from "@/components/shared/QuerySelects";
import AuthorisedWebsitePost from "@/pages/authorised/AuthorisedWebsitePost";
import { Button,Popconfirm,Space,Table } from 'antd';
import dayjs from "dayjs";
import { useRef,useState } from 'react';
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const isExpired = (record: AuthorisedWebsite) => record.expiredAt > 0 && dayjs(record.expiredAt).isBefore(dayjs());

const AuthorisedWebsitePage = () => {

    const {t} = useTranslation();
    const actionRef = useRef<NTableActionType>(null);
    const [postOpen, setPostOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const urlState = {
        departmentId: searchParams.get('departmentId') || undefined,
        userId: searchParams.get('userId') || undefined,
        websiteGroupId: searchParams.get('websiteGroupId') || undefined,
        websiteId: searchParams.get('websiteId') || undefined,
    };

    const tableParams = Object.fromEntries(
        Object.entries(urlState).filter(([, value]) => value)
    );

    const syncUrl = (values: Record<string, any>) => {
        const next: Record<string, string> = {};
        Object.entries(values).forEach(([key, value]) => {
            if (value) {
                next[key] = String(value);
            }
        });
        const sameSize = Object.keys(next).length === Object.keys(urlState).length;
        const isSame = sameSize && Object.entries(next).every(([key, value]) => urlState[key as keyof typeof urlState] === value);
        if (isSame) {
            return;
        }
        setSearchParams(next);
    };

    const columns: NColumn<AuthorisedWebsite>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: t('menus.identity.submenus.department'),
            dataIndex: 'departmentName',
            formItemProps: {
                name: 'departmentId',
            },
            renderFormItem: (_, {type, defaultRender, ...rest}, _form) => {
                if (type === 'form') {
                    return null;
                }
                return <DepartmentTreeSelect {...rest} />;
            },
            render: ((text: any, record: any) => {
                if (text === '-') {
                    return '-';
                }
                return <NLink to={`/department/${record.departmentId}`}>{text}</NLink>
            })
        },
        {
            title: t('menus.identity.submenus.user'),
            dataIndex: 'userName',
            formItemProps: {
                name: 'userId',
            },
            renderFormItem: (_, {type, defaultRender, ...rest}, _form) => {
                if (type === 'form') {
                    return null;
                }
                return <UserSelect {...rest} />;
            },
            render: ((text: any, record: any) => {
                if (text === '-') {
                    return '-';
                }
                return <NLink to={`/user/${record.userId}`}>{text}</NLink>
            })
        },
        {
            title: t('authorised.label.website_group'),
            dataIndex: 'websiteGroupName',
            formItemProps: {
                name: 'websiteGroupId',
            },
            renderFormItem: (_, {type, defaultRender, ...rest}, _form) => {
                if (type === 'form') {
                    return null;
                }
                return <WebsiteGroupTreeSelect {...rest} />;
            },
            render: ((text: any, record: any) => {
                if (text === '-') {
                    return '-';
                }
                return <NLink to={`/website?groupId=${record.websiteGroupId}`}>{text}</NLink>
            })
        },
        {
            title: t('menus.resource.submenus.website'),
            dataIndex: 'websiteName',
            formItemProps: {
                name: 'websiteId',
            },
            renderFormItem: (_, {type, defaultRender, ...rest}, _form) => {
                if (type === 'form') {
                    return null;
                }
                return <WebsiteTreeSelect {...rest} />;
            },
            render: ((text, record) => {
                if (text === '-') {
                    return '-';
                }
                return <NLink to={`/website?websiteId=${record['websiteId']}`}>{text}</NLink>
            })
        },
        {
            title: t('assets.limit_time'),
            key: 'expiredAt',
            dataIndex: 'expiredAt',
            hideInSearch: true,
            render: (_text, record) => {
                if (record.expiredAt === 0) {
                    return '-';
                }
                let expiredAt = dayjs(record.expiredAt);
                const now = dayjs();
                const daysDifference = expiredAt.diff(now, 'day'); // 计算相差天数

                // 根据天数差异设置不同的类名
                let statusClass = '';
                if (daysDifference > 7) {
                    statusClass = 'text-green-500';  // 超过 7 天 - 绿色
                } else if (daysDifference > 0) {
                    statusClass = 'text-yellow-500';  // 小于 7 天但大于 0 天 - 黄色
                } else {
                    statusClass = 'text-red-500';  // 小于当前时间 - 红色
                }
                return <div className={statusClass}>
                    {expiredAt.format('YYYY-MM-DD HH:mm:ss')}
                </div>;
            },
            width: 180,
        },
        {
            title: t('authorised.label.authorised_at'),
            key: 'createdAt',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            hideInSearch: true,
            width: 180,
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            width: 50,
            render: (_text, record) => (
                <Space>
                    <Popconfirm
                        key="unbind-confirm"
                        title={t('general.confirm_delete')}
                        onConfirm={async () => {
                            await authorisedWebsiteApi.deleteById(record['id']);
                            actionRef.current?.reload();
                        }}
                    >
                        <NButton key="unbind" danger>
                            {t('actions.delete')}
                        </NButton>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <NTable
                columns={columns}
                actionRef={actionRef}
                params={tableParams}
                form={{
                    initialValues: urlState,
                }}
                onSubmit={(values) => syncUrl(values)}
                onReset={() => syncUrl({})}
                request={async (params = {}, _sort, _filter) => {

                    let queryParams = {
                        pageIndex: params.current,
                        pageSize: params.pageSize,
                        userId: params.userId,
                        departmentId: params.departmentId,
                        websiteGroupId: params.websiteGroupId,
                        websiteId: params.websiteId,
                    }
                    let result = await authorisedWebsiteApi.paging(queryParams);
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
                rowSelection={{
                    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
                }}
                rowClassName={(record) => isExpired(record) ? 'authorised-row-expired' : ''}
                tableAlertOptionRender={({selectedRowKeys}) => (
                    <Popconfirm
                        title={t('general.confirm_delete')}
                        onConfirm={async () => {
                            await Promise.all(selectedRowKeys.map((id) => authorisedWebsiteApi.deleteById(String(id))));
                            actionRef.current?.reload();
                        }}
                    >
                        <NButton danger>
                            {t('actions.delete')}
                        </NButton>
                    </Popconfirm>
                )}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true
                }}
                dateFormatter="string"
                headerTitle={t('actions.authorized')}
                toolBarRender={() => [
                    <Button key="button" type="primary" onClick={() => setPostOpen(true)}>
                        {t('actions.authorized')}
                    </Button>
                ]}
            />
            <AuthorisedWebsitePost
                open={postOpen}
                onCancel={() => setPostOpen(false)}
                onSuccess={() => {
                    setPostOpen(false);
                    actionRef.current?.reload();
                }}
            />
        </div>
    );
};

export default AuthorisedWebsitePage;
