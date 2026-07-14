import React, {useState, useEffect} from 'react';
import {useTranslation} from "react-i18next";
import {Select, TreeSelect} from "antd";
import userApi, {User} from "@/api/user-api";
import departmentApi, {Department} from "@/api/department-api";
import assetApi, {Asset} from "@/api/asset-api";
import websiteApi, {Website} from "@/api/website-api";
import databaseAssetApi, {DatabaseAsset} from "@/api/database-asset-api";
import {useQuery} from "@tanstack/react-query";

interface SelectProps {
    value?: any;
    onChange?: (value: any) => void;
    style?: React.CSSProperties;
    mode?: 'multiple' | 'tags';
    [key: string]: any;
}

const selectStyle = (style?: React.CSSProperties) => ({
    minWidth: 200,
    ...style,
});

const setTreeValue = (nodes: any[] = []): any[] => nodes.map(node => ({
    ...node,
    value: node.value ?? node.key,
    children: node.children ? setTreeValue(node.children) : undefined,
}));

const buildGroupTree = (nodes: any[] = []): any[] => nodes.flatMap(node => {
    const children = node.children ? buildGroupTree(node.children) : undefined;
    if (node.key === 'default') {
        return children || [];
    }
    return [{
        ...node,
        value: node.value ?? node.key,
        children,
    }];
});

const buildAssetTree = (nodes: any[] = []): any[] => nodes.map(node => {
    const isLeaf = node.isLeaf;
    return {
        ...node,
        value: node.value ?? node.key,
        disabled: !isLeaf,
        children: node.children ? buildAssetTree(node.children) : undefined,
    };
});

const buildWebsiteTree = (nodes: Website[] = []): any[] => nodes.map(node => ({
    title: node.name,
    key: node.id,
    value: node.id,
    isLeaf: true,
}));

// 用户查询组件
export const UserSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const result = await userApi.getAll();
                const userOptions = result.map((user: User) => ({
                    label: user.nickname || user.username,
                    value: user.id,
                }));
                setOptions(userOptions);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('menus.identity.submenus.user')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 部门查询组件
export const DepartmentSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            try {
                const result = await departmentApi.getAll();
                const deptOptions = result.map((dept: Department) => ({
                    label: dept.name,
                    value: dept.id,
                }));
                setOptions(deptOptions);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('menus.identity.submenus.department')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 部门树查询组件
export const DepartmentTreeSelect = ({value, onChange, style, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const query = useQuery({
        queryKey: ['shared-query-selects', 'department-tree'],
        queryFn: async () => setTreeValue(await departmentApi.getTree()),
        refetchOnWindowFocus: false,
    });

    return (
        <TreeSelect
            value={value}
            onChange={onChange}
            placeholder={t('menus.identity.submenus.department')}
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            loading={query.isPending}
            treeData={query.data || []}
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 资产组查询组件
export const AssetGroupSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssetGroups = async () => {
            setLoading(true);
            try {
                const groups = await assetApi.getGroups();
                const flattenGroups = (nodes: any[]): any[] => {
                    let result: any[] = [];
                    nodes.forEach(node => {
                        if (node.key !== 'default') {
                            result.push({
                                label: node.title,
                                value: node.key,
                            });
                        }
                        if (node.children) {
                            result = result.concat(flattenGroups(node.children));
                        }
                    });
                    return result;
                };
                setOptions(flattenGroups(groups));
            } catch (error) {
                console.error('Failed to fetch asset groups:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssetGroups();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('authorised.label.asset_group')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 资产组树查询组件
export const AssetGroupTreeSelect = ({value, onChange, style, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const query = useQuery({
        queryKey: ['shared-query-selects', 'asset-group-tree'],
        queryFn: async () => buildGroupTree(await assetApi.getGroups()),
        refetchOnWindowFocus: false,
    });

    return (
        <TreeSelect
            value={value}
            onChange={onChange}
            placeholder={t('authorised.label.asset_group')}
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            loading={query.isPending}
            treeData={query.data || []}
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 资产查询组件
export const AssetSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                const result = await assetApi.getAll();
                const assetOptions = result.map((asset: Asset) => ({
                    label: asset.name,
                    value: asset.id,
                }));
                setOptions(assetOptions);
            } catch (error) {
                console.error('Failed to fetch assets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('menus.resource.submenus.asset')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 资产树查询组件
export const AssetTreeSelect = ({value, onChange, style, ...rest}: SelectProps & {protocol?: string}) => {
    const {t} = useTranslation();
    const protocol = rest.protocol;
    const query = useQuery({
        queryKey: ['shared-query-selects', 'asset-tree', protocol],
        queryFn: async () => buildAssetTree(await assetApi.tree(protocol)),
        refetchOnWindowFocus: false,
    });
    const {protocol: _, ...treeSelectProps} = rest;

    return (
        <TreeSelect
            value={value}
            onChange={onChange}
            placeholder={t('menus.resource.submenus.asset')}
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            loading={query.isPending}
            treeData={query.data || []}
            style={selectStyle(style)}
            {...treeSelectProps}
        />
    );
};

// 网站组查询组件
export const WebsiteGroupSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWebsiteGroups = async () => {
            setLoading(true);
            try {
                const groups = await websiteApi.getGroups();
                const flattenGroups = (nodes: any[]): any[] => {
                    let result: any[] = [];
                    nodes.forEach(node => {
                        if (node.key !== 'default') {
                            result.push({
                                label: node.title,
                                value: node.key,
                            });
                        }
                        if (node.children) {
                            result = result.concat(flattenGroups(node.children));
                        }
                    });
                    return result;
                };
                setOptions(flattenGroups(groups));
            } catch (error) {
                console.error('Failed to fetch website groups:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWebsiteGroups();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('authorised.label.website_group')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 网站组树查询组件
export const WebsiteGroupTreeSelect = ({value, onChange, style, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const query = useQuery({
        queryKey: ['shared-query-selects', 'website-group-tree'],
        queryFn: async () => buildGroupTree(await websiteApi.getGroups()),
        refetchOnWindowFocus: false,
    });

    return (
        <TreeSelect
            value={value}
            onChange={onChange}
            placeholder={t('authorised.label.website_group')}
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            loading={query.isPending}
            treeData={query.data || []}
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 数据库资产查询组件
export const DatabaseAssetSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                const result = await databaseAssetApi.getAll();
                const assetOptions = result.map((asset: DatabaseAsset) => ({
                    label: asset.name,
                    value: asset.id,
                }));
                setOptions(assetOptions);
            } catch (error) {
                console.error('Failed to fetch database assets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('menus.resource.submenus.database_asset')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 网站查询组件
export const WebsiteSelect = ({value, onChange, style, mode, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWebsites = async () => {
            setLoading(true);
            try {
                const result = await websiteApi.getAll();
                const websiteOptions = result.map((website: Website) => ({
                    label: website.name,
                    value: website.id,
                }));
                setOptions(websiteOptions);
            } catch (error) {
                console.error('Failed to fetch websites:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWebsites();
    }, []);

    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={t('menus.resource.submenus.website')}
            mode={mode}
            allowClear
            showSearch
            loading={loading}
            options={options}
            filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            style={selectStyle(style)}
            {...rest}
        />
    );
};

// 网站树查询组件
export const WebsiteTreeSelect = ({value, onChange, style, ...rest}: SelectProps) => {
    const {t} = useTranslation();
    const query = useQuery({
        queryKey: ['shared-query-selects', 'website-tree'],
        queryFn: async () => buildWebsiteTree(await websiteApi.getAll()),
        refetchOnWindowFocus: false,
    });

    return (
        <TreeSelect
            value={value}
            onChange={onChange}
            placeholder={t('menus.resource.submenus.website')}
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            loading={query.isPending}
            treeData={query.data || []}
            style={selectStyle(style)}
            {...rest}
        />
    );
};
