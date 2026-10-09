import React from 'react';
import {Badge, Popover, Spin, Tooltip} from 'antd';
import {useQuery} from '@tanstack/react-query';
import clsx from 'clsx';
import brandingApi from '@/api/branding-api';
import accountApi from '@/api/account-api';
import propertyApi from '@/api/property-api';
import {useLicense} from '@/hook/LicenseContext';
import {useTranslation} from 'react-i18next';
import About from '@/pages/sysconf/About';

interface LayoutSidebarLogoProps {
    collapsed?: boolean;
}

/**
 * 侧边栏 Logo 组件
 * 渲染品牌 Logo 和名称
 */
const LayoutSidebarLogo: React.FC<LayoutSidebarLogoProps> = ({collapsed = false}) => {
    const {t} = useTranslation();
    const {license, isLoading: licenseLoading} = useLicense();
    const brandingQuery = useQuery({
        queryKey: ['branding'],
        queryFn: brandingApi.getBranding,
    });
    const infoQuery = useQuery({
        queryKey: ['infoQuery'],
        queryFn: accountApi.getUserInfo,
    });
    const canViewSettings = infoQuery.data?.menus?.some(menu => menu.checked && menu.key === 'setting') ?? false;

    const versionQuery = useQuery({
        queryKey: ['version'],
        queryFn: propertyApi.getLatestVersion,
        enabled: canViewSettings && !licenseLoading && !license.isOEM() && !license.isOffline(),
        staleTime: 30 * 60 * 1000,
        retry: false,
    });

    const updateVersion = versionQuery.data?.upgrade ? versionQuery.data.latestVersion : undefined;

    const logo = brandingQuery.data ? (
        <img
            src={brandingApi.getLogo()}
            alt='logo'
            className={'h-8 w-8 rounded'}
        />
    ) : null;

    return (
        <Spin spinning={brandingQuery.isLoading}>
            <div className={clsx('flex items-center gap-2 justify-center h-[60px]')}>
                {logo && (
                    updateVersion ? (
                        <Popover
                            content={<About compact/>}
                            trigger="click"
                            placement="rightTop"
                        >
                            <button
                                type="button"
                                aria-label={t('settings.about.update_available', {version: updateVersion})}
                                className="flex shrink-0 cursor-pointer items-center"
                            >
                                <Badge dot>{logo}</Badge>
                            </button>
                        </Popover>
                    ) : logo
                )}
                {!collapsed && (
                    <Tooltip title={brandingQuery.data?.name} placement="right">
                        <div className={clsx('font-bold text-lg transition duration-100 ease-in-out truncate max-w-[160px]')}>
                            {brandingQuery.data?.name}
                        </div>
                    </Tooltip>
                )}
            </div>
        </Spin>
    );
};

export default LayoutSidebarLogo;
