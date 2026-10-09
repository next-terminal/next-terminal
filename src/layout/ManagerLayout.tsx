import React, {Suspense} from 'react';
import {App as AntdApp, ConfigProvider, Layout} from "antd";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import {StyleProvider} from '@ant-design/cssinjs';
import {useQuery} from "@tanstack/react-query";
import clsx from 'clsx';
import i18n from "i18next";

// Hooks
import {useMobile} from "@/hook/use-mobile";
import {useNTTheme} from "@/hook/use-theme";
import {useThemeToggle} from "@/layout/hooks/use-theme-toggle.ts";
import {useBreadcrumb} from "@/layout/hooks/use-breadcrumb.tsx";
import {useManagerEventListeners} from "@/layout/hooks/use-manager-event-listeners.ts";
import {useGlobalMonitorStatus} from "@/layout/hooks/use-global-monitor-status.tsx";
import {useSidebarState} from "@/layout/hooks/use-sidebar-state.ts";
import {useFilteredMenus} from "@/layout/hooks/use-filtered-menus.ts";
import {useUserDropdownMenu} from "@/layout/hooks/use-user-dropdown-menu.tsx";

// Components
import DesktopSidebar from "./components/DesktopSidebar";
import MobileSidebar from "./components/MobileSidebar";
import LayoutHeader from "./components/LayoutHeader";
import FooterComponent from "./FooterComponent";
import Landing from "../components/Landing";

// APIs
import accountApi from "@/api/account-api";
import {translateI18nToAntdLocale} from "@/helper/lang";

// Styles
import './ManagerLayout.css';

const ManagerLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isFixedWorkspace = location.pathname === '/ai' || location.pathname === '/tools';

    // 主题和响应式
    const [ntTheme] = useNTTheme();
    const {isMobile} = useMobile();

    // 主题切换
    const {isDarkMode, toggleDarkMode} = useThemeToggle();

    const {filteredMenus, breadcrumbNameMap} = useFilteredMenus();

    // 侧边栏状态
    const {
        collapsed,
        setCollapsed,
        mobileMenuVisible,
        setMobileMenuVisible,
        stateOpenKeys,
        subMenuChange,
    } = useSidebarState(filteredMenus, location.pathname);

    // 面包屑
    const {breakItems} = useBreadcrumb(breadcrumbNameMap);
    const {dropMenus} = useUserDropdownMenu();

    // 用户信息
    const infoQuery = useQuery({
        queryKey: ['infoQuery'],
        queryFn: accountApi.getUserInfo,
    });
    const canViewMonitoring = infoQuery.data?.menus?.some(menu => menu.checked && menu.key === 'monitoring') ?? false;

    // 事件监听
    const {contextHolder} = useManagerEventListeners();
    const {contextHolder: globalMonitorContextHolder} = useGlobalMonitorStatus(canViewMonitoring);

    const current = location.pathname.split('/')[1] ?? '';

    // 菜单点击处理
    const handleMenuClick = (e: any) => {
        navigate(e.key);
        if (isMobile) {
            setMobileMenuVisible(false);
        }
    };

    return (
        <StyleProvider hashPriority="high">
            <ConfigProvider
                theme={{
                    algorithm: ntTheme.algorithm,
                    components: {
                        Layout: {
                            triggerBg: '#131313',
                        }
                    }
                }}
                locale={translateI18nToAntdLocale(i18n.language)}
            >
                <AntdApp>
                    <Layout
                        hasSider={!isMobile}
                        className={clsx(isFixedWorkspace && 'h-dvh overflow-hidden')}
                        style={{
                            backgroundColor: ntTheme.backgroundColor,
                        }}
                    >
                        {/* 桌面端侧边栏 */}
                        {!isMobile && (
                            <DesktopSidebar
                                collapsed={collapsed}
                                onCollapse={setCollapsed}
                                isDarkMode={isDarkMode}
                                filteredMenus={filteredMenus}
                                current={current}
                                stateOpenKeys={stateOpenKeys}
                                onSubMenuChange={subMenuChange}
                                onMenuClick={handleMenuClick}
                                backgroundColor={ntTheme.backgroundColor ?? '#fff'}
                            />
                        )}

                        {/* 移动端抽屉菜单 */}
                        <MobileSidebar
                            open={isMobile && mobileMenuVisible}
                            onClose={() => setMobileMenuVisible(false)}
                            filteredMenus={filteredMenus}
                            current={current}
                            stateOpenKeys={stateOpenKeys}
                            onSubMenuChange={subMenuChange}
                            onMenuClick={handleMenuClick}
                        />

                        <div
                            className={clsx('flex min-w-0 flex-grow flex-col', {
                                'h-dvh overflow-hidden': isFixedWorkspace,
                                'min-h-screen': !isFixedWorkspace,
                            })}
                            style={{
                                marginLeft: isMobile ? 0 : (collapsed ? 80 : 200),
                            }}
                        >
                            {/* 头部导航栏 */}
                            <LayoutHeader
                                isMobile={isMobile}
                                breakItems={breakItems}
                                onMobileMenuOpen={() => setMobileMenuVisible(true)}
                                isDarkMode={isDarkMode}
                                onThemeToggle={toggleDarkMode}
                                userInfo={infoQuery.data}
                                dropMenus={dropMenus}
                            />

                            {/* 主内容区域 */}
                            <Suspense fallback={<Landing/>}>
                                <div className={clsx({
                                    'flex min-h-0 flex-1 flex-col overflow-hidden': isFixedWorkspace,
                                    'grow': !isFixedWorkspace,
                                    'mx-4': isMobile,
                                    'mx-8': !isMobile
                                })}>
                                    <Outlet/>
                                </div>
                            </Suspense>

                            {/* 页脚 */}
                            <FooterComponent/>
                        </div>
                        {contextHolder}
                        {globalMonitorContextHolder}
                    </Layout>
                </AntdApp>
            </ConfigProvider>
        </StyleProvider>
    );
};

export default ManagerLayout;
