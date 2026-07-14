import NTable,{ type NColumn,type NTableActionType } from "@/components/NTable";
import { getSort } from "@/utils/sort";
import { Popconfirm,Space,Tag } from "antd";
import { useRef } from 'react';
import { useTranslation } from "react-i18next";
import loginLockedApi,{ LoginLocked } from "../../api/login-locked-api";
import NButton from "../../components/NButton";

const LoginLockedPage = () => {

    const {t} = useTranslation();
    const actionRef = useRef<NTableActionType>(null);

    const columns: NColumn<LoginLocked>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: 'IP',
            dataIndex: 'ip',
            key: 'ip',
            sorter: true,
        }, {
            title: t('gateways.username'),
            dataIndex: 'username',
            key: 'username',
            sorter: true,
        },
        {
            title: t('identity.user.locked_type'),
            dataIndex: 'type',
            key: 'type',
            hideInSearch: true,
            render: (_text, record) => {
                switch (record.type) {
                    case 'username':
                        return <Tag variant="filled" color={'purple'}>{t('identity.user.locked_type_username')}</Tag>;
                    case 'ip':
                        return <Tag variant="filled" color={'red'}>{t('identity.user.locked_type_ip')}</Tag>;
                }
            }
        },
        {
            title: t('identity.user.locked_at'),
            dataIndex: 'lockedAt',
            key: 'lockedAt',
            valueType: 'dateTime',
            hideInSearch: true,
            sorter: true,
        },
        {
            title: t('assets.limit_time'),
            dataIndex: 'expirationAt',
            key: 'expirationAt',
            valueType: 'dateTime',
            hideInSearch: true,
            sorter: true,
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            render: (_text, record) => (
                <Space>
                    <Popconfirm
                        key={'delete-confirm'}
                        title={t('general.confirm_delete')}
                        onConfirm={async () => {
                            await loginLockedApi.deleteById(record.id);
                            actionRef.current?.reload();
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
            <NTable
                columns={columns}
                actionRef={actionRef}
                request={async (params = {}, sort, _filter) => {
                    let [sortOrder, sortField] = getSort(sort);
                    
                    let queryParams = {
                        pageIndex: params.current,
                        pageSize: params.pageSize,
                        sortOrder: sortOrder,
                        sortField: sortField,
                        ip: params.ip,
                        username: params.username,
                    }
                    let result = await loginLockedApi.getPaging(queryParams);
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
                headerTitle={t('menus.identity.submenus.login_locked')}
                toolBarRender={() => []}
            />
        </div>
    );
};

export default LoginLockedPage;
