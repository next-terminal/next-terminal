import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getMenus} from '@/layout/menus.tsx';
import {getCurrentUser, hasMenu} from '@/utils/permission.ts';
import type {MenuProps} from 'antd';

type AppMenuItem = {
    key: string;
    label: string;
    children?: AppMenuItem[];
    [key: string]: any;
};

/**
 * 过滤菜单 Hook
 * 根据权限过滤菜单，生成面包屑名称映射
 */
export function useFilteredMenus() {
    const {t} = useTranslation();
    const menuKeys = getCurrentUser()?.menus?.map(item => item.key).join('|') ?? '';
    const [filteredMenus, setFilteredMenus] = useState<MenuProps['items']>([]);
    const [breadcrumbNameMap, setBreadcrumbNameMap] = useState<Map<string, string>>(
        () => new Map()
    );

    useEffect(() => {
        // 获取所有菜单
        const menus = getMenus(t) as AppMenuItem[];

        // 生成面包屑名称映射
        const nextBreadcrumbNameMap = new Map<string, string>();
        const collectBreadcrumbs = (items: AppMenuItem[]) => {
            for (const item of items) {
                if (item.children && item.children.length > 0) {
                    collectBreadcrumbs(item.children);
                } else {
                    nextBreadcrumbNameMap.set('/' + item.key, item.label);
                }
            }
        };
        collectBreadcrumbs(menus);

        // 根据权限过滤菜单（创建新对象避免修改原始数据）
        const filterMenus = (items: AppMenuItem[]): AppMenuItem[] => {
            return items.reduce<AppMenuItem[]>((result, item) => {
                const children = item.children ? filterMenus(item.children) : undefined;
                if (hasMenu(item.key) || (children && children.length > 0)) {
                    result.push({
                        ...item,
                        children,
                    });
                }
                return result;
            }, []);
        };
        const nextFilteredMenus = filterMenus(menus);

        setFilteredMenus(nextFilteredMenus as MenuProps['items']);
        setBreadcrumbNameMap(nextBreadcrumbNameMap);
    }, [menuKeys, t]);

    return {filteredMenus, breadcrumbNameMap};
}
