import {Snippet} from "@/api/snippet-api";
import snippetUserApi from "@/api/snippet-user-api";
import NButton from "@/components/NButton";
import NTable, {type NColumn} from "@/components/NTable";
import {useMobile} from "@/hook/use-mobile";
import {cn} from "@/lib/utils";
import FacadeCompactSearch from "@/pages/facade/components/FacadeCompactSearch";
import SnippetUserModal from "@/pages/facade/SnippetUserModal";
import {getCurrentUser} from "@/utils/permission";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Plus} from "lucide-react";
import {App, Button, Popconfirm, Space, Tag} from "antd";
import {useState} from 'react';
import {useTranslation} from "react-i18next";

const api = snippetUserApi;

const SnippetUserPage = () => {

    const {t} = useTranslation();
    const {isMobile} = useMobile();
    let [open, setOpen] = useState<boolean>(false);
    let [selectedRowKey, setSelectedRowKey] = useState<string>();
    const [keyword, setKeyword] = useState<string>('');
    const currentUser = getCurrentUser();

    const {message} = App.useApp();

    const snippetsQuery = useQuery({
        queryKey: ['user-snippets'],
        queryFn: () => api.getAll(),
    });

    const list = snippetsQuery.data || [];
    const value = keyword.trim().toLowerCase();
    const filteredSnippets = value ? list.filter((item) => {
        return item.name?.toLowerCase().includes(value)
            || item.content?.toLowerCase().includes(value);
    }) : list;

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
            setOpen(false);
            setSelectedRowKey(undefined);
            snippetsQuery.refetch();
            showSuccess();
        }
    });

    function showSuccess() {
        message.open({
            type: 'success',
            content: t('general.success'),
        });
    }

    const columns: NColumn<Snippet>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            hideInTable: isMobile, // 移动端隐藏序号列
        },
        {
            title: t('general.name'),
            dataIndex: 'name',
            width: isMobile ? 100 : undefined, // 移动端固定宽度
        },
        {
            title: t('assets.content'),
            dataIndex: 'content',
            key: 'content',
            copyable: true,
            ellipsis: true,
            width: isMobile ? 150 : undefined, // 移动端固定宽度
        },
        {
            title: t('assets.snippet.visibility'),
            dataIndex: 'visibility',
            key: 'visibility',
            width: isMobile ? 70 : 100,
            hideInSearch: true,
            render: (_, record) => {
                return record.visibility === 'public'
                    ? <Tag color="green">{t('assets.snippet.visibility_public')}</Tag>
                    : <Tag color="default">{t('assets.snippet.visibility_private')}</Tag>;
            }
        },
        {
            title: t('general.created_at'),
            key: 'createdAt',
            dataIndex: 'createdAt',
            hideInSearch: true,
            valueType: 'dateTime',
            hideInTable: isMobile, // 移动端隐藏创建时间
        },
        {
            title: t('actions.label'),
            valueType: 'option',
            key: 'option',
            width: isMobile ? 80 : 120, // 移动端固定宽度
            render: (_text, record) => {
                // 只有创建者才能编辑和删除
                const isOwner = record.createdBy === currentUser?.id;

                if (!isOwner) {
                    return null;
                }

                return <Space>
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
                            snippetsQuery.refetch();
                        }}
                    >
                        <NButton
                            key='delete'
                            danger={true}
                        >
                            {t('actions.delete')}
                        </NButton>
                    </Popconfirm>
                </Space>
            },
        },
    ];

    return (<div className={cn('min-h-full px-4 py-5 lg:px-20 lg:py-6', isMobile && 'px-3 py-3')}>
        <div className={'mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'}>
            <div className={'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center'}>
                <div className={'truncate text-lg font-semibold leading-7 text-slate-900 dark:text-slate-100'}>
                    {t('menus.resource.submenus.snippet')}
                </div>
                <div className={'w-full sm:w-72 lg:w-80'}>
                    <FacadeCompactSearch
                        value={keyword}
                        onChange={setKeyword}
                        placeholder={t('general.search_placeholder')}
                    />
                </div>
            </div>
            <Button
                type="primary"
                icon={<Plus className={'h-4 w-4'}/>}
                size="middle"
                onClick={() => {
                    setOpen(true)
                }}
            >
                {t('actions.new')}
            </Button>
        </div>

        <NTable
            columns={columns}
            dataSource={filteredSnippets}
            loading={snippetsQuery.isFetching}
            rowKey="id"
            search={false}
            pagination={false}
            dateFormatter="string"
            headerTitle={false}
            options={{
                density: !isMobile, // 移动端隐藏密度设置
                fullScreen: !isMobile, // 移动端隐藏全屏按钮
                reload: false,
                setting: !isMobile, // 移动端隐藏列设置
            }}
        />

        <SnippetUserModal
            id={selectedRowKey}
            open={open}
            confirmLoading={mutation.isPending}
            handleCancel={() => {
                setOpen(false);
                setSelectedRowKey(undefined);
            }}
            handleOk={mutation.mutate}
        />
    </div>);
};

export default SnippetUserPage;
