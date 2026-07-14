import {Descriptions, Spin, Tree} from "antd";
import roleApi, {TreeNode} from "../../api/role-api";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";
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
    let [roleMenus, setRoleMenus] = useState<string[]>([]);
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
        queryFn: async () => {
            let data = await api.getById(id);
            let strings = data.menus?.filter(item => item.checked === true).map(item => item.key) ?? [];
            setRoleMenus(strings);
            return data;
        },
        enabled: !!id,
    });

    const role = roleQuery.data;

    return (
        <div className={'page-detail-info'}>
            <Spin spinning={roleQuery.isLoading}>
                <Descriptions column={1}>
                    <Descriptions.Item label={t('general.name')}>{role?.name}</Descriptions.Item>
                    <Descriptions.Item label={t('identity.role.permission')}>
                        {(() => {
                            if (menusQuery.isLoading) {
                                return <div>Loading</div>
                            }
                            return <Tree
                                checkable
                                disabled={true}
                                checkedKeys={roleMenus}
                                treeData={menusQuery.data ?? []}
                                style={{
                                    backgroundColor: theme.backgroundColor,
                                }}
                            />
                        })()}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('general.created_at')}>
                        {role?.createdAt ? times.format(role.createdAt) : '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </div>
    );
}

export default RoleInfo;
