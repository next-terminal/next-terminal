import portalApi,{ WebsiteUser } from "@/api/portal-api";
import strings from "@/utils/strings";
import { useQuery } from "@tanstack/react-query";
import { Empty,message,Segmented,Tooltip } from "antd";
import { useEffect,useState,type Key } from 'react';
import { useTranslation } from "react-i18next";
import FacadeCardSkeleton from './components/FacadeCardSkeleton';
import FacadeCompactSearch from './components/FacadeCompactSearch';
import FacadeGroupTree from './components/FacadeGroupTree';
import FacadeLogo from './components/FacadeLogo';
import { checkItemInGroups,findNode,getAllKeys,getGroupAndChildIds } from './utils/facade-utils';
import {ExternalLink,LayoutGrid,List,Shield} from "lucide-react";

type WebsiteViewMode = 'list' | 'card';

const WEBSITE_VIEW_MODE_STORAGE_KEY = 'facade.website.viewMode';

const getInitialWebsiteViewMode = (): WebsiteViewMode => {
    try {
        const value = localStorage.getItem(WEBSITE_VIEW_MODE_STORAGE_KEY);
        if (value === 'list' || value === 'card') {
            return value;
        }
    } catch {
    }
    return 'list';
};

const WebsiteFacadePage = () => {

    let {t} = useTranslation();
    let [websites, setWebsites] = useState<WebsiteUser[]>();
    let [search, setSearch] = useState<string>('');
    let [selectedGroupKey, setSelectedGroupKey] = useState<string>('');
    let [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    let [allowLoading, setAllowLoading] = useState<string>('');
    let [viewMode, setViewMode] = useState<WebsiteViewMode>(getInitialWebsiteViewMode);

    let queryWebsites = useQuery({
        queryKey: ['my-websites'],
        queryFn: () => portalApi.websites(),
        staleTime: 5 * 60 * 1000,     // 5 分钟
        gcTime: 10 * 60 * 1000,       // 缓存 10 分钟
    });

    let queryWebsiteGroupTree = useQuery({
        queryKey: ['my-websites-group-tree'],
        queryFn: () => portalApi.getWebsitesGroupTree(),
        staleTime: 10 * 60 * 1000,    // 10 分钟(分组变化较少)
    });

    useEffect(() => {
        if (queryWebsites.data) {
            setWebsites(queryWebsites.data);
        }
    }, [queryWebsites.data]);

    useEffect(() => {
        if (queryWebsiteGroupTree.data) {
            const allExpandedKeys = getAllKeys(queryWebsiteGroupTree.data);
            if (allExpandedKeys.length > 0) {
                setExpandedKeys(allExpandedKeys);
            }
        }
    }, [queryWebsiteGroupTree.data]);

    const allowTempIP = async (websiteId: string) => {
        try {
            setAllowLoading(websiteId);
            const data = await portalApi.allowWebsiteIP(websiteId) as any;
            const expiresIn = data?.expiresIn || 0;
            const minutes = Math.max(1, Math.ceil(expiresIn / 60));
            message.success(t('assets.temp_allow_success', { minutes }));
        } catch (error) {
            // error handled globally
        } finally {
            setAllowLoading('');
        }
    };

    let filteredWebsites = websites || [];
    const searchValue = search.trim().toLowerCase();

    // 按分组过滤
    if (selectedGroupKey && selectedGroupKey !== '' && queryWebsiteGroupTree.data) {
        const groupIds = getGroupAndChildIds(queryWebsiteGroupTree.data, selectedGroupKey);
        filteredWebsites = filteredWebsites.filter(item => checkItemInGroups(item.groupId, groupIds));
    }

    // 按搜索关键词过滤
    if (strings.hasText(searchValue)) {
        filteredWebsites = filteredWebsites.filter(item => {
            if (item.name.toLowerCase().includes(searchValue)) {
                return true;
            }
            if (item.protocol.toLowerCase().includes(searchValue)) {
                return true;
            }
            return item.tags?.some(tag => tag.toLowerCase().includes(searchValue));
        });
    }

    const selectedGroup = selectedGroupKey && queryWebsiteGroupTree.data
        ? findNode(queryWebsiteGroupTree.data, selectedGroupKey)
        : null;

    const buildWebsiteHref = (websiteId: string) => {
        return `/browser?websiteId=${websiteId}&t=${new Date().getTime()}`;
    };

    const handleViewModeChange = (value: string | number) => {
        const nextViewMode = value as WebsiteViewMode;
        setViewMode(nextViewMode);
        try {
            localStorage.setItem(WEBSITE_VIEW_MODE_STORAGE_KEY, nextViewMode);
        } catch {
        }
    };

    const renderWebsiteRow = (item: WebsiteUser) => {
        const tempAllowEnabled = Boolean(item.attrs?.tempAllowEnabled);
        const isAllowing = allowLoading === item.id;

        return (
            <div
                key={item.id}
                className={'group flex min-h-16 items-center gap-3 border-b border-slate-100 px-3 py-3 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40'}
            >
                <FacadeLogo
                    name={item.name}
                    logo={item.logo}
                    protocol={item.protocol}
                    borderless
                />
                <div className={'min-w-0 flex-1'}>
                    <div className={'flex min-w-0 items-center gap-2'}>
                        <Tooltip title={item.name}>
                            <div className={'truncate text-sm font-semibold text-slate-900 dark:text-slate-100'}>
                                {item.name}
                            </div>
                        </Tooltip>
                        <span className={'flex-none rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300'}>
                            {item.protocol}
                        </span>
                    </div>
                    <div className={'mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400'}>
                        {item.description && (
                            <Tooltip title={item.description}>
                                <span className={'max-w-96 truncate'}>{item.description}</span>
                            </Tooltip>
                        )}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                        <div className={'mt-2 flex flex-wrap gap-1.5'}>
                            {item.tags.slice(0, 4).map(tag => (
                                <span
                                    key={tag}
                                    className={'rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/60'}
                                >
                                    {tag}
                                </span>
                            ))}
                            {item.tags.length > 4 && (
                                <span className={'text-[11px] text-slate-400'}>+{item.tags.length - 4}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className={'flex flex-none items-center gap-2 text-xs text-slate-400'}>
                    {tempAllowEnabled && (
                        <button
                            type="button"
                            disabled={isAllowing}
                            onClick={() => allowTempIP(item.id)}
                            className={'hidden cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-[#1A73E8] disabled:cursor-not-allowed disabled:opacity-50 sm:flex'}
                        >
                            {isAllowing ? (
                                <span className={'h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin'} />
                            ) : (
                                <Shield className={'h-3.5 w-3.5'} />
                            )}
                            {t('assets.temp_allow_action')}
                        </button>
                    )}
                    <a
                        href={buildWebsiteHref(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={'flex flex-none cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-[#1A73E8]'}
                    >
                        <span>{t('assets.access')}</span>
                        <ExternalLink className={'h-3.5 w-3.5'} />
                    </a>
                </div>
            </div>
        );
    };

    const renderWebsiteCard = (item: WebsiteUser) => {
        const tempAllowEnabled = Boolean(item.attrs?.tempAllowEnabled);
        const isAllowing = allowLoading === item.id;

        return (
            <div
                key={item.id}
                className={'group relative flex min-h-40 flex-col overflow-hidden rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300/80 dark:bg-[#141414] dark:ring-slate-700/70 dark:hover:ring-slate-600/80'}
            >
                <span className={'absolute right-3 top-3 z-30 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300'}>
                    {item.protocol}
                </span>
                <div className={'flex items-start gap-2.5'}>
                    <FacadeLogo
                        name={item.name}
                        logo={item.logo}
                        protocol={item.protocol}
                    />
                    <div className={'min-w-0 flex-1 pr-14'}>
                        <Tooltip title={item.name}>
                            <div className={'truncate text-sm font-semibold text-slate-900 dark:text-slate-100'}>
                                {item.name}
                            </div>
                        </Tooltip>
                    </div>
                </div>

                <div className={'mt-2 min-h-8 flex-1'}>
                    {item.description && (
                        <Tooltip title={item.description}>
                            <div className={'line-clamp-1 text-xs leading-5 text-slate-600 dark:text-slate-300'}>
                                {item.description}
                            </div>
                        </Tooltip>
                    )}
                    {item.tags && item.tags.length > 0 && (
                        <div className={'mt-2 flex flex-wrap gap-1.5'}>
                            {item.tags.slice(0, 4).map(tag => (
                                <span
                                    key={tag}
                                    className={'rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/60'}
                                >
                                    {tag}
                                </span>
                            ))}
                            {item.tags.length > 4 && (
                                <span className={'text-[11px] text-slate-400'}>+{item.tags.length - 4}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className={'mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2 text-xs text-slate-400 dark:border-slate-800'}>
                    {tempAllowEnabled && (
                        <button
                            type="button"
                            disabled={isAllowing}
                            onClick={() => allowTempIP(item.id)}
                            className={'flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-[#1A73E8] disabled:cursor-not-allowed disabled:opacity-50'}
                        >
                            {isAllowing ? (
                                <span className={'h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin'} />
                            ) : (
                                <Shield className={'h-3.5 w-3.5'} />
                            )}
                            <span className={'hidden sm:inline'}>{t('assets.temp_allow_action')}</span>
                        </button>
                    )}
                    <a
                        href={buildWebsiteHref(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={'flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-[#1A73E8]'}
                    >
                        <span>{t('assets.access')}</span>
                        <ExternalLink className={'h-3.5 w-3.5'} />
                    </a>
                </div>
            </div>
        );
    };

    return (
        <div className={'min-h-full px-4 py-5 lg:px-20 lg:py-6'}>
            <div className={'mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'}>
                <div className={'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center'}>
                    <div className={'truncate text-lg font-semibold leading-7 text-slate-900 dark:text-slate-100'}>
                        {t('menus.resource.submenus.website')}
                    </div>
                    <div className={'w-full sm:w-72 lg:w-80'}>
                        <FacadeCompactSearch
                            value={search}
                            onChange={setSearch}
                            placeholder={t('facade.website_placeholder')}
                        />
                    </div>
                    {selectedGroup && (
                        <span className={'inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-medium text-slate-600 dark:bg-slate-800/70 dark:text-slate-200'}>
                            {t('assets.group')} · {selectedGroup.title}
                        </span>
                    )}
                </div>
                <Segmented
                    value={viewMode}
                    onChange={handleViewModeChange}
                    options={[
                        {
                            value: 'list',
                            label: (
                                <span className={'inline-flex items-center gap-1.5'}>
                                    <List className={'h-3.5 w-3.5'} />
                                    <span>{t('facade.list_view')}</span>
                                </span>
                            ),
                        },
                        {
                            value: 'card',
                            label: (
                                <span className={'inline-flex items-center gap-1.5'}>
                                    <LayoutGrid className={'h-3.5 w-3.5'} />
                                    <span>{t('facade.card_view')}</span>
                                </span>
                            ),
                        },
                    ]}
                />
            </div>

            <div className={'grid lg:grid-cols-[240px_1fr] gap-4'}>
                {/* 分组树 */}
                <FacadeGroupTree
                    title={t('assets.group')}
                    treeData={queryWebsiteGroupTree.data}
                    selectedKey={selectedGroupKey}
                    onSelect={setSelectedGroupKey}
                    expandedKeys={expandedKeys}
                    onExpand={setExpandedKeys}
                    loading={queryWebsiteGroupTree.isLoading}
                    variant={'plain'}
                />

                {/* 网站列表 */}
                <div>
                    {queryWebsites.isLoading ? (
                        <div className={'grid 2xl:grid-cols-5 lg:grid-cols-4 lg:gap-6 grid-cols-1 gap-2'}>
                            <FacadeCardSkeleton count={8} />
                        </div>
                    ) : filteredWebsites.length === 0 ? (
                        <Empty />
                    ) : viewMode === 'card' ? (
                        <div className={'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}>
                            {filteredWebsites.map(item => renderWebsiteCard(item))}
                        </div>
                    ) : (
                        <div className={'overflow-hidden bg-white dark:bg-[#141414]'}>
                            {filteredWebsites.map(item => renderWebsiteRow(item))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebsiteFacadePage;
