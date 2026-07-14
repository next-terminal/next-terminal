import {useEffect, useState} from 'react';
import {useQuery} from "@tanstack/react-query";
import portalApi, {DatabaseAssetUser} from "@/api/portal-api";
import {Button, Empty, Tag, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {useMobile} from "@/hook/use-mobile";
import clsx from "clsx";
import strings from "@/utils/strings";
import {getCurrentUser} from "@/utils/permission";
import FacadeCompactSearch from "@/pages/facade/components/FacadeCompactSearch";

const {Paragraph} = Typography;

const DatabaseAssetFacadePage = () => {
    const {t} = useTranslation();
    const {isMobile} = useMobile();
    const [assets, setAssets] = useState<DatabaseAssetUser[]>([]);
    const [search, setSearch] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    const queryAssets = useQuery({
        queryKey: ['my-database-assets'],
        queryFn: () => portalApi.databaseAssets(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
    const queryProperties = useQuery({
        queryKey: ['db-proxy-info'],
        queryFn: () => portalApi.getDbProxyInfo(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    useEffect(() => {
        if (queryAssets.data) {
            setAssets(queryAssets.data);
        }
    }, [queryAssets.data]);

    const searchValue = search.trim().toLowerCase();
    let filteredAssets = assets || [];
    if (strings.hasText(searchValue)) {
        filteredAssets = filteredAssets.filter(item => {
            if (item.name.toLowerCase().includes(searchValue)) {
                return true;
            }
            if (item.type?.toLowerCase().includes(searchValue)) {
                return true;
            }
            return item.tags?.some(tag => tag.toLowerCase().includes(searchValue));
        });
    }
    if (typeFilter) {
        filteredAssets = filteredAssets.filter(item => item.type === typeFilter);
    }

    const renderTypeTag = (type: string) => {
        if (type === 'mysql') {
            return <Tag color="blue">{t('db.asset.type_mysql')}</Tag>;
        }
        if (type === 'pg') {
            return <Tag color="purple">{t('db.asset.type_pg')}</Tag>;
        }
        return <Tag>{type}</Tag>;
    };

    const proxyInfo = queryProperties.data;
    const proxyAccess = {
        host: proxyInfo?.host || '<proxy_host>',
        port: proxyInfo?.port || '<proxy_port>',
    };
    const currentUsername = getCurrentUser()?.username || '<username>';

    const buildCommand = (asset: DatabaseAssetUser) => {
        return `mysql -h ${proxyAccess.host} -P ${proxyAccess.port} -u ${currentUsername}@${asset.name} -p`;
    };

    return (
        <div className={clsx('min-h-full px-4 py-5 lg:px-20 lg:py-6', isMobile && 'px-3 py-3')}>
            <div className={'mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'}>
                <div className={'flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center'}>
                    <div className={'min-w-0'}>
                        <div className={'truncate text-lg font-semibold leading-7 text-slate-900 dark:text-slate-100'}>
                            {t('menus.resource.submenus.database_asset')}
                        </div>
                    </div>
                    <div className={'w-full sm:w-72 lg:w-80'}>
                        <FacadeCompactSearch
                            value={search}
                            placeholder={t('facade.database_asset_placeholder')}
                            onChange={setSearch}
                        />
                    </div>
                    <div className={'flex flex-wrap items-center gap-2 text-xs'}>
                        <button
                            onClick={() => setTypeFilter('')}
                            className={clsx(
                                'cursor-pointer rounded-md border px-3 py-1.5 transition-colors',
                                typeFilter === ''
                                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                            )}
                        >
                            {t('general.all')}
                        </button>
                        <button
                            onClick={() => setTypeFilter('mysql')}
                            className={clsx(
                                'cursor-pointer rounded-md border px-3 py-1.5 transition-colors',
                                typeFilter === 'mysql'
                                    ? 'border-[#1A73E8] bg-[#1A73E8] text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                            )}
                        >
                            {t('db.asset.type_mysql')}
                        </button>
                        <button
                            onClick={() => setTypeFilter('pg')}
                            className={clsx(
                                'cursor-pointer rounded-md border px-3 py-1.5 transition-colors',
                                typeFilter === 'pg'
                                    ? 'border-[#1A73E8] bg-[#1A73E8] text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                            )}
                        >
                            {t('db.asset.type_pg')}
                        </button>
                    </div>
                </div>
                <Link to={'/x-db-work-order'}>
                    <Button type="primary">{t('facade.database_access_work_order')}</Button>
                </Link>
            </div>

            {queryAssets.isLoading ? (
                <div className={'text-sm text-slate-500 dark:text-slate-400'}>{t('general.loading')}</div>
            ) : filteredAssets.length === 0 ? (
                <Empty />
            ) : (
                <div className={'grid 2xl:grid-cols-4 lg:grid-cols-3 gap-4'}>
                    {filteredAssets.map(item => (
                        <div
                            key={item.id}
                            className={'rounded-xl bg-white dark:bg-[#141414] ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-4 shadow-sm'}
                        >
                            <div className={'flex items-center justify-between gap-2'}>
                                <div className={'text-sm font-semibold text-slate-900 dark:text-slate-100 truncate'}>
                                    {item.name}
                                </div>
                                {renderTypeTag(item.type)}
                            </div>
                            {item.description && (
                                <div className={'mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2'}>
                                    {item.description}
                                </div>
                            )}
                            {item.tags && item.tags.length > 0 && (
                                <div className={'mt-2 flex flex-wrap gap-1.5'}>
                                    {item.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className={'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200/50 dark:ring-slate-700/50'}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className={'mt-3 pt-2 border-t border-slate-100 dark:border-slate-800'}>
                                <div className={'text-xs text-slate-500 dark:text-slate-400'}>
                                    {t('db.proxy.usage_client')}
                                </div>
                                <Paragraph copyable className={'font-mono text-xs'} style={{marginBottom: 0}}>
                                    {buildCommand(item)}
                                </Paragraph>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DatabaseAssetFacadePage;
