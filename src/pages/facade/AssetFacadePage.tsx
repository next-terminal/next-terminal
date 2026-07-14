import {useEffect, useState, type Key} from 'react';
import {useMutation, useQuery} from "@tanstack/react-query";
import portalApi, {AssetAccessMode, AssetUser} from "@/api/portal-api";
import strings from "@/utils/strings";
import {useTranslation} from "react-i18next";
import {safeEncode} from "@/utils/codec";
import {checkItemInGroups, findNode, getAllKeys, getGroupAndChildIds} from './utils/facade-utils';
import FacadeCompactSearch from './components/FacadeCompactSearch';
import FacadeGroupTree from './components/FacadeGroupTree';
import FacadeCardSkeleton from './components/FacadeCardSkeleton';
import {App, Empty, Segmented, Tooltip} from "antd";
import {getProtocolColor} from "@/helper/asset-helper";
import FacadeLogo from "@/pages/facade/components/FacadeLogo";
import {ExternalLink, FileDown, LayoutGrid, List} from "lucide-react";
import {browserDownload} from "@/utils/utils";

type AssetViewMode = 'list' | 'card';

const ASSET_VIEW_MODE_STORAGE_KEY = 'facade.asset.viewMode';

const getInitialAssetViewMode = (): AssetViewMode => {
    try {
        const value = localStorage.getItem(ASSET_VIEW_MODE_STORAGE_KEY);
        if (value === 'list' || value === 'card') {
            return value;
        }
    } catch {
    }
    return 'list';
};

const AssetFacadePage = () => {

    let {t} = useTranslation();
    const {message} = App.useApp();
    let [assets, setAssets] = useState<AssetUser[]>();
    let [search, setSearch] = useState<string>('');
    let [selectedGroupKey, setSelectedGroupKey] = useState<string>('');
    let [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    let [viewMode, setViewMode] = useState<AssetViewMode>(getInitialAssetViewMode);

    let queryAssets = useQuery({
        queryKey: ['my-assets'],
        queryFn: () => portalApi.assets(),
        staleTime: 5 * 60 * 1000,     // 5 分钟
        gcTime: 10 * 60 * 1000,       // 缓存 10 分钟
    });

    let queryAssetGroupTree = useQuery({
        queryKey: ['my-assets-group-tree'],
        queryFn: () => portalApi.getAssetsGroupTree(),
        staleTime: 10 * 60 * 1000,    // 10 分钟(分组变化较少)
    });

    let queryAccessPreferences = useQuery({
        queryKey: ['access-preferences'],
        queryFn: () => portalApi.getAccessPreferences(),
        staleTime: 5 * 60 * 1000,
    });

    const createRdpProxyTicketMutation = useMutation({
        mutationFn: (assetId: string) => portalApi.createRdpProxyTicket(assetId),
        onSuccess: (ticket) => {
            browserDownload(ticket.rdpFileUrl);
        },
        onError: (error: any) => {
            message.error(error?.message || t('general.failed'));
        }
    });

    useEffect(() => {
        if (queryAssets.data) {
            setAssets(queryAssets.data);
        }
    }, [queryAssets.data]);

    useEffect(() => {
        if (queryAssetGroupTree.data) {
            const allExpandedKeys = getAllKeys(queryAssetGroupTree.data);
            if (allExpandedKeys.length > 0) {
                setExpandedKeys(allExpandedKeys);
            }
        }
    }, [queryAssetGroupTree.data]);

    let filteredAssets = assets || [];
    const searchValue = search.trim().toLowerCase();

    // 按分组过滤
    if (selectedGroupKey && selectedGroupKey !== '' && queryAssetGroupTree.data) {
        const groupIds = getGroupAndChildIds(queryAssetGroupTree.data, selectedGroupKey);
        filteredAssets = filteredAssets.filter(item => checkItemInGroups(item.groupId, groupIds));
    }

    // 按搜索关键词过滤
    if (strings.hasText(searchValue)) {
        filteredAssets = filteredAssets.filter(item => {
            if (item.name.toLowerCase().includes(searchValue)) {
                return true;
            }
            if (item.alias && item.alias.toLowerCase().includes(searchValue)) {
                return true;
            }
            if (item.address.toLowerCase().includes(searchValue)) {
                return true;
            }
            if (item.protocol.toLowerCase().includes(searchValue)) {
                return true;
            }
            return item.tags?.some(tag => tag.toLowerCase().includes(searchValue));
        });
    }

    const selectedGroup = selectedGroupKey && queryAssetGroupTree.data
        ? findNode(queryAssetGroupTree.data, selectedGroupKey)
        : null;

    const buildAccessHref = (item: AssetUser) => {
        const id = item.id;
        const protocol = item.protocol?.toLowerCase();
        const accessMode: AssetAccessMode = queryAccessPreferences.data?.assetAccessMode || 'access-page';

        if (protocol === 'http') {
            return `/browser?websiteId=${id}&t=${new Date().getTime()}`;
        }
        if (accessMode === 'standalone-page') {
            return `/standalone-access?assetId=${id}&protocol=${protocol}&t=${new Date().getTime()}`;
        }
        const msg = {
            id: id,
            name: item.name,
            protocol: protocol,
            status: item.status,
            wolEnabled: item.attrs?.['wol-enabled'] || false,
        };
        return `/access?asset=${safeEncode(msg)}`;
    };

    const handleViewModeChange = (value: string | number) => {
        const nextViewMode = value as AssetViewMode;
        setViewMode(nextViewMode);
        try {
            localStorage.setItem(ASSET_VIEW_MODE_STORAGE_KEY, nextViewMode);
        } catch {
        }
    };

    const renderAssetRow = (item: AssetUser) => {
        const isInactive = item.status === 'inactive';
        const hasUsers = item.users && item.users.length > 0;
        const isRdpAsset = item.protocol?.toLowerCase() === 'rdp';
        const isCreatingRdpProxyTicket = createRdpProxyTicketMutation.isPending && createRdpProxyTicketMutation.variables === item.id;

        return (
            <div
                key={item.id}
                className={`group flex min-h-16 items-center gap-3 border-b border-slate-100 px-3 py-3 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40 ${isInactive ? 'grayscale' : ''}`}
            >
                <div>
                    <FacadeLogo
                        name={item.name}
                        logo={item.logo}
                        protocol={item.protocol}
                        borderless
                    />
                </div>
                <div className={'min-w-0 flex-1'}>
                    <div className={'flex min-w-0 items-center gap-2'}>
                        <Tooltip title={item.name}>
                            <div className={'truncate text-sm font-semibold text-slate-900 dark:text-slate-100'}>
                                {item.name}
                            </div>
                        </Tooltip>
                        <span className={`flex-none rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${getProtocolColor(item.protocol) || 'bg-slate-400'}`}>
                            {item.protocol}
                        </span>
                        {hasUsers && (
                            <Tooltip title={item.users.join("\n")}>
                                <span className={'hidden flex-none items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800 sm:inline-flex'}>
                                    <span className={'h-1 w-1 rounded-full bg-green-500'} />
                                    {t('facade.in_use')}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                    <div className={'mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400'}>
                        {item.alias && (
                            <Tooltip title={item.alias}>
                                <span className={'max-w-48 truncate text-slate-600 dark:text-slate-300'}>{item.alias}</span>
                            </Tooltip>
                        )}
                        <Tooltip title={item.address}>
                            <span className={'max-w-64 truncate font-mono'}>{item.address}</span>
                        </Tooltip>
                        {item.description && (
                            <Tooltip title={item.description}>
                                <span className={'hidden max-w-80 truncate lg:inline'}>{item.description}</span>
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
                    {isRdpAsset && (
                        <button
                            type="button"
                            disabled={isCreatingRdpProxyTicket}
                            onClick={() => {
                                createRdpProxyTicketMutation.mutate(item.id);
                            }}
                            className={'hidden cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-[#1A73E8] disabled:cursor-not-allowed disabled:opacity-50 sm:flex'}
                        >
                            <FileDown className={'h-3.5 w-3.5'} />
                            {t('assets.rdp_proxy_access')}
                        </button>
                    )}
                    <a
                        href={buildAccessHref(item)}
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

    const renderAssetCard = (item: AssetUser) => {
        const isInactive = item.status === 'inactive';
        const hasUsers = item.users && item.users.length > 0;
        const isRdpAsset = item.protocol?.toLowerCase() === 'rdp';
        const isCreatingRdpProxyTicket = createRdpProxyTicketMutation.isPending && createRdpProxyTicketMutation.variables === item.id;

        return (
            <div
                key={item.id}
                className={`group relative flex min-h-44 flex-col overflow-hidden rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300/80 dark:bg-[#141414] dark:ring-slate-700/70 dark:hover:ring-slate-600/80 ${isInactive ? 'grayscale' : ''}`}
            >
                <span className={`absolute right-3 top-3 z-30 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${getProtocolColor(item.protocol) || 'bg-slate-400'}`}>
                    {item.protocol}
                </span>
                <div className={'flex items-start gap-2.5'}>
                    <FacadeLogo
                        name={item.name}
                        logo={item.logo}
                        protocol={item.protocol}
                    />
                    <div className={'min-w-0 flex-1 pr-14'}>
                        <div className={'flex min-w-0 items-center gap-2'}>
                            <Tooltip title={item.name}>
                                <div className={'truncate text-sm font-semibold text-slate-900 dark:text-slate-100'}>
                                    {item.name}
                                </div>
                            </Tooltip>
                        </div>
                        {item.alias && (
                            <Tooltip title={item.alias}>
                                <div className={'mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300'}>{item.alias}</div>
                            </Tooltip>
                        )}
                        <Tooltip title={item.address}>
                            <div className={'mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400'}>
                                {item.address}
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
                    {hasUsers && (
                        <Tooltip title={item.users.join("\n")}>
                            <span className={'mt-1.5 inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800'}>
                                <span className={'h-1 w-1 rounded-full bg-green-500'} />
                                {t('facade.in_use')}
                            </span>
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
                    {isRdpAsset && (
                        <button
                            type="button"
                            disabled={isCreatingRdpProxyTicket}
                            onClick={() => {
                                createRdpProxyTicketMutation.mutate(item.id);
                            }}
                            className={'flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-[#1A73E8] disabled:cursor-not-allowed disabled:opacity-50'}
                        >
                            <FileDown className={'h-3.5 w-3.5'} />
                            <span className={'hidden sm:inline'}>{t('assets.rdp_proxy_access')}</span>
                        </button>
                    )}
                    <a
                        href={buildAccessHref(item)}
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
                        {t('menus.resource.submenus.asset')}
                    </div>
                    <div className={'w-full sm:w-72 lg:w-80'}>
                        <FacadeCompactSearch
                            value={search}
                            onChange={setSearch}
                            placeholder={t('facade.asset_placeholder')}
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
                    treeData={queryAssetGroupTree.data}
                    selectedKey={selectedGroupKey}
                    onSelect={setSelectedGroupKey}
                    expandedKeys={expandedKeys}
                    onExpand={setExpandedKeys}
                    loading={queryAssetGroupTree.isLoading}
                    variant={'plain'}
                />

                {/* 资产列表 */}
                <div>
                    {queryAssets.isLoading ? (
                        <div className={'grid 2xl:grid-cols-5 lg:grid-cols-4 lg:gap-6 grid-cols-1 gap-2'}>
                            <FacadeCardSkeleton count={8}/>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <Empty/>
                    ) : viewMode === 'card' ? (
                        <div className={'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}>
                            {filteredAssets.map(item => renderAssetCard(item))}
                        </div>
                    ) : (
                        <div className={'overflow-hidden bg-white dark:bg-[#141414]'}>
                            {filteredAssets.map(item => renderAssetRow(item))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetFacadePage;
