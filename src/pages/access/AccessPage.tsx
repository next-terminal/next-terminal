import {useEffect, useRef, useState} from 'react';
import {App, ConfigProvider, theme} from 'antd';
import {useMutation} from '@tanstack/react-query';
import './AccessPage.css';
import {ResizableHandle, ResizablePanelGroup} from '@/components/ui/resizable';
import {ThemeProvider} from '@/components/theme-provider';
import AccessTheme from '@/pages/access/AccessTheme';
import AccessSetting from '@/pages/access/AccessSetting';
import {useAccessTab} from '@/pages/access/hooks/use-access-tab';
import {StyleProvider} from '@ant-design/cssinjs';
import {beforeUnload, generateRandomId, handleKeyDown} from '@/utils/utils';
import {useAccessContentSize} from '@/pages/access/hooks/use-access-size';
import {useSearchParams} from 'react-router-dom';
import {ImperativePanelHandle} from 'react-resizable-panels';
import AccessSshChooser from '@/pages/access/AccessSshChooser';
import AccessTerminalBulk from '@/pages/access/AccessTerminalBulk';
import MultiFactorAuthentication from '@/pages/account/MultiFactorAuthentication';
import AccessWolDialog from '@/pages/access/AccessWolDialog';
import {safeDecode} from '@/utils/codec';
import {setThemeColor} from '@/utils/theme';
import {translateI18nToAntdLocale} from '@/helper/lang';
import i18n from 'i18next';
import {useTabOperations} from '@/pages/access/hooks/use-tab-operations';
import AccessHeader from '@/pages/access/components/AccessHeader';
import AccessSidebar from '@/pages/access/components/AccessSidebar';
import AccessTabContainer from '@/pages/access/components/AccessTabContainer';
import portalApi from '@/api/portal-api';
import {useTranslation} from 'react-i18next';
import {LocalStorage, STORAGE_KEYS} from '@/utils/storage';
import AccessTerminal from '@/pages/access/AccessTerminal';
import AccessGuacamole from '@/pages/access/AccessGuacamole';
import {
    ACCESS_HEADER_HEIGHT,
    ACCESS_SIDEBAR_COLLAPSED_SIZE,
    ACCESS_SIDEBAR_DEFAULT_SIZE,
    ACCESS_SIDEBAR_MAX_SIZE,
} from '@/pages/access/constants';

export interface AccessTabSyncMessage {
    id: string;
    name: string;
    protocol: string;
    status?: string;
    wolEnabled?: boolean;
}

type AccessAddTab = ReturnType<typeof useTabOperations>['addTab'];

const openAccessAssetTab = (msg: AccessTabSyncMessage, addTab: AccessAddTab) => {
    const key = generateRandomId() + '_' + msg.id;
    const createSessionTab = (tabKey: string) => {
        switch (msg.protocol) {
            case "ssh":
            case "telnet":
                return <AccessTerminal assetId={msg.id} tabKey={tabKey}/>;
            case "rdp":
                return <AccessGuacamole assetId={msg.id} tabKey={tabKey}/>;
            default:
                return <AccessGuacamole assetId={msg.id} tabKey={tabKey}/>;
        }
    };

    addTab(
        key,
        msg.name,
        createSessionTab(key),
        {
            meta: {
                type: 'session',
                assetId: msg.id,
                recreate: createSessionTab,
            },
        }
    );
};

const AccessPage = () => {
    const {t} = useTranslation();
    const [activeKey, setActiveKey] = useAccessTab();
    const [, setContentSize] = useAccessContentSize();
    const [searchParams, setSearchParams] = useSearchParams();
    const leftRef = useRef<ImperativePanelHandle>(null);
    const initialCollapsed = LocalStorage.get(STORAGE_KEYS.COLLAPSED_STATE, false) ?? false;
    const savedPanelSizes = LocalStorage.get(STORAGE_KEYS.PANEL_SIZES, {
        left: ACCESS_SIDEBAR_DEFAULT_SIZE,
        right: 100 - ACCESS_SIDEBAR_DEFAULT_SIZE,
    });
    const initialExpandedLeftPanelSize = Math.min(
        ACCESS_SIDEBAR_MAX_SIZE,
        Math.max(ACCESS_SIDEBAR_DEFAULT_SIZE, savedPanelSizes?.left || ACCESS_SIDEBAR_DEFAULT_SIZE)
    );
    const lastExpandedPanelSizeRef = useRef(initialExpandedLeftPanelSize);

    // 标签页操作
    const {
        items,
        addTab,
        removeTab,
        handleCloseLeft,
        handleCloseRight,
        handleCloseAll,
        handleCloseOthers,
        handleReconnect,
        handleDuplicateSession,
        onDragEnd,
    } = useTabOperations(activeKey, setActiveKey);

    // 面板状态管理
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return initialCollapsed;
    });

    const [leftPanelSize, setLeftPanelSize] = useState(() => {
        return initialCollapsed ? ACCESS_SIDEBAR_COLLAPSED_SIZE : initialExpandedLeftPanelSize;
    });

    const handlePanelResize = (size: number) => {
        setLeftPanelSize(size);

        const collapsed = size === ACCESS_SIDEBAR_COLLAPSED_SIZE;
        if (!collapsed) {
            lastExpandedPanelSizeRef.current = size;
            const panelSizes = {left: size, right: 100 - size};
            LocalStorage.set(STORAGE_KEYS.PANEL_SIZES, panelSizes);
        }

        if (collapsed !== isCollapsed) {
            setIsCollapsed(collapsed);
            LocalStorage.set(STORAGE_KEYS.COLLAPSED_STATE, collapsed);
        }

        setContentSize(100 - size);
    };

    // 对话框状态管理
    const [sshChooserOpen, setSSHChooserOpen] = useState(false);
    const [mfaOpen, setMfaOpen] = useState(false);
    const [chooseAssetIds, setChooseAssetIds] = useState<string[]>([]);
    const [wolDialogOpen, setWolDialogOpen] = useState(false);
    const [wolAssetInfo, setWolAssetInfo] = useState<{
        id: string;
        name: string;
        protocol: string;
    } | null>(null);
    const accessRequireMFAMutation = useMutation({
        mutationFn: async (values: string[]) => {
            const required = await portalApi.getAccessRequireMFA();
            return {required, values};
        },
        onSuccess: ({required, values}) => {
            if (required) {
                setMfaOpen(true);
                setChooseAssetIds(values);
                return;
            }

            setSSHChooserOpen(false);
            const key = generateRandomId();
            addTab(key, t('access.batch.exec'), <AccessTerminalBulk assetIds={values}/>);
        },
    });

    // 初始化：设置样式和事件监听
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        window.addEventListener('beforeunload', beforeUnload, true);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        setThemeColor('#313131');
    }, []);

    // 处理 URL 参数自动打开资产
    useEffect(() => {
        const defaultAsset = searchParams.get('asset');
        if (defaultAsset) {
            try {
                const msg = safeDecode(defaultAsset) as AccessTabSyncMessage;
                if (msg) {
                    // 检查是否需要 WOL 唤醒
                    if (msg.status === 'inactive' && msg.wolEnabled) {
                        setWolAssetInfo({
                            id: msg.id,
                            name: msg.name,
                            protocol: msg.protocol,
                        });
                        setWolDialogOpen(true);
                    } else {
                        openAccessAssetTab(msg, addTab);
                    }
                }
            } catch (error) {
                console.warn('Invalid access asset param:', error);
            }

            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('asset');
            setSearchParams(nextParams, {replace: true});
        }
    }, [addTab, searchParams, setSearchParams]);

    // 处理树节点双击
    const handleNodeDoubleClick = (node: any) => {
        // 检查是否需要 WOL 唤醒
        if (node.extra?.status === 'inactive' && node.extra?.wolEnabled) {
            setWolAssetInfo({
                id: node.key as string,
                name: node.title as string,
                protocol: node.extra?.protocol,
            });
            setWolDialogOpen(true);
            return;
        }

        // 直接打开连接
        openAccessAssetTab({
            id: node.key,
            name: node.title,
            protocol: node.extra?.protocol,
        }, addTab);
    };

    // 处理顶部按钮点击
    const handleThemeClick = () => {
        addTab('theme', t('access.settings.theme'), <AccessTheme/>);
    };

    const handleSettingClick = () => {
        addTab('setting', t('menus.setting.label'), <AccessSetting/>);
    };

    const handleBatchSSHClick = () => {
        setSSHChooserOpen(true);
    };

    const handleSidebarToggle = () => {
        if (isCollapsed) {
            leftRef.current?.resize(lastExpandedPanelSizeRef.current);
            return;
        }
        leftRef.current?.collapse();
    };

    // 处理 SSH 选择器确认
    const handleSSHChooserOk = (values: string[]) => {
        accessRequireMFAMutation.mutate(values);
    };

    // 处理 MFA 确认
    const handleMFAOk = async (securityToken: string) => {
        setMfaOpen(false);
        setSSHChooserOpen(false);
        const key = generateRandomId();
        addTab(
            key,
            t('access.batch.exec'),
            <AccessTerminalBulk assetIds={chooseAssetIds} securityToken={securityToken}/>
        );
    };

    // 处理 WOL 成功
    const handleWOLSuccess = () => {
        setWolDialogOpen(false);
        // 唤醒成功后自动打开连接
        if (wolAssetInfo) {
            openAccessAssetTab({
                id: wolAssetInfo.id,
                name: wolAssetInfo.name,
                protocol: wolAssetInfo.protocol,
            }, addTab);
        }
        setWolAssetInfo(null);
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        titleFontSizeSM: 13,
                    },
                },
                algorithm: theme.darkAlgorithm,
            }}
            locale={translateI18nToAntdLocale(i18n.language)}
        >
            <App>
                <StyleProvider hashPriority="high">
                    <div className={'h-screen w-screen overflow-hidden'}>
                        <AccessHeader
                            isSidebarCollapsed={isCollapsed}
                            onToggleSidebar={handleSidebarToggle}
                            onThemeClick={handleThemeClick}
                            onSettingClick={handleSettingClick}
                            onBatchSSHClick={handleBatchSSHClick}
                        />

                        <ThemeProvider defaultTheme="dark" storageKey="nt-ui-theme">
                            <div style={{height: `calc(100vh - ${ACCESS_HEADER_HEIGHT}px)`}}>
                                <ResizablePanelGroup direction="horizontal">
                                    <AccessSidebar
                                        isCollapsed={isCollapsed}
                                        leftPanelSize={leftPanelSize}
                                        onResize={handlePanelResize}
                                        leftRef={leftRef}
                                        onNodeDoubleClick={handleNodeDoubleClick}
                                    />

                                    {!isCollapsed && <ResizableHandle withHandle/>}

                                    <AccessTabContainer
                                        items={items}
                                        activeKey={activeKey}
                                        leftPanelSize={leftPanelSize}
                                        onChange={setActiveKey}
                                        onRemove={removeTab}
                                        onDragEnd={onDragEnd}
                                        onContentResize={setContentSize}
                                        tabOperations={{
                                            handleCloseLeft,
                                            handleCloseRight,
                                            handleCloseAll,
                                            handleCloseOthers,
                                            handleReconnect,
                                            handleDuplicateSession,
                                        }}
                                    />
                                </ResizablePanelGroup>
                            </div>

                            {/* 对话框 */}
                            <AccessSshChooser
                                open={sshChooserOpen}
                                handleCancel={() => setSSHChooserOpen(false)}
                                handleOk={handleSSHChooserOk}
                            />

                            <MultiFactorAuthentication
                                open={mfaOpen}
                                handleOk={handleMFAOk}
                                handleCancel={() => setMfaOpen(false)}
                            />

                            <AccessWolDialog
                                open={wolDialogOpen}
                                assetId={wolAssetInfo?.id || ''}
                                assetName={wolAssetInfo?.name || ''}
                                onSuccess={handleWOLSuccess}
                                onCancel={() => {
                                    setWolDialogOpen(false);
                                    setWolAssetInfo(null);
                                }}
                            />
                        </ThemeProvider>
                    </div>
                </StyleProvider>
            </App>
        </ConfigProvider>
    );
};

export default AccessPage;
