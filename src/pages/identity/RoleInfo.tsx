import {Descriptions, Spin, Tree} from "antd";
import roleApi, {TreeNode} from "../../api/role-api";
import {useQuery} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {useNTTheme} from "@/hook/use-theme";
import strings from "@/utils/strings";
import times from "@/components/time/times";

const api = roleApi;

interface RoleInfoProps {
    id: string
}

const RoleInfo = ({id}: RoleInfoProps) => {

    let {t} = useTranslation();
    let [theme] = useNTTheme();


    const wrapGetMenu = async () => {
        let menus = await roleApi.getMenus();
        deepT('', menus);
        return menus;
    }

    const deepT = (parent: string, menus: TreeNode[]) => {
        for (let i = 0; i < menus.length; i++) {
            const menu = menus[i];
            if (!menu) {
                continue;
            }
            if (menu.isLeaf) {
                menu.title = t('permissions.' + menu.key);
            } else {
                let parentKey = parent.replace(/-/g, '_');
                let key = menu.key.replace(/-/g, '_');
                if (strings.hasText(parent)) {
                    menu.title = t(`menus.${parentKey}.submenus.${key}`);
                } else {
                    menu.title = t(`menus.${key}.label`);
                }
            }
            if (menu.children) {
                deepT(menu.key, menu.children);
            }
        }
    }

    let menusQuery = useQuery({
        queryKey: ['menus'],
        queryFn: wrapGetMenu,
    });

    const roleQuery = useQuery({
        queryKey: ['role', id],
        queryFn: () => api.getById(id),
        enabled: !!id,
    });

    const role = roleQuery.data;
    const roleMenus = role?.menus?.filter(item => item.checked).map(item => item.key) ?? [];

    return (
        <div className={'page-detail-info'}>
            <Spin spinning={roleQuery.isLoading}>
                <Descriptions
                    column={1}
                    items={[
                        {
                            key: 'name',
                            label: t('general.name'),
                            children: role?.name,
                        },
                        {
                            key: 'permission',
                            label: t('identity.role.permission'),
                            children: (() => {
                            if (menusQuery.isLoading) {
                                return <div>Loading</div>
                            }
                            return (
                                <>
                                    {role?.permissionsEditable === false && <p>{t('identity.role.system_permission_notice')}</p>}
                                    <Tree
                                        checkable
                                        disabled={true}
                                        checkedKeys={roleMenus}
                                        treeData={menusQuery.data ?? []}
                                        style={{
                                            backgroundColor: theme.backgroundColor,
                                        }}
                                    />
                                </>
                            );
                            })(),
                        },
                        {
                            key: 'created-at',
                            label: t('general.created_at'),
                            children: role?.createdAt ? times.format(role.createdAt) : '-',
                        },
                    ]}
                />
            </Spin>
        </div>
    );
}

export default RoleInfo;
