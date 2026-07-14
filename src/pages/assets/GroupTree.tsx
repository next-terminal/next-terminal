import React, {useEffect, useState} from 'react';
import {Dropdown, MenuProps, Tag, Tooltip, Tree, TreeDataNode, TreeProps} from 'antd';
import {CogIcon, PlusIcon, TrashIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {GatewayHop} from '@/api/gateway-chain';
import {firstGatewayHop} from '@/api/gateway-chain';
import {useNTTheme} from '@/hook/use-theme.ts';
import {generateRandomId} from '@/utils/utils';
import AddGroupButton from '@/pages/assets/AddGroupButton';
import GroupTreeModal, {GroupTreeFormValues} from '@/pages/assets/GroupTreeModal';

export type GroupTreeOperation = 'add' | 'edit';

export interface GroupTreeNode extends TreeDataNode {
    gatewayChain?: GatewayHop[];
    children?: GroupTreeNode[];
}

interface Props {
    data?: GroupTreeNode[];
    selected: string;
    keyPrefix: string;
    saving?: boolean;
    onSelect: (key: string) => void;
    onSave: (data: GroupTreeNode[]) => Promise<unknown>;
    onDelete: (key: string) => Promise<unknown>;
}

interface ContextMenu {
    pageX: number;
    pageY: number;
    node: GroupTreeNode;
}

const getAllKeys = (data: GroupTreeNode[]) => {
    let keys: React.Key[] = [];
    data.forEach(item => {
        keys.push(item.key);
        if (item.children) {
            keys = keys.concat(getAllKeys(item.children));
        }
    });
    return keys;
};

const cloneTree = (data: GroupTreeNode[]): GroupTreeNode[] => {
    return data.map(item => ({
        ...item,
        children: item.children ? cloneTree(item.children) : undefined,
    }));
};

const findParentKey = (data: GroupTreeNode[], key: React.Key, parentKey?: React.Key): React.Key | undefined => {
    for (const item of data) {
        if (item.key === key) {
            return parentKey;
        }
        if (item.children) {
            const result = findParentKey(item.children, key, item.key);
            if (result !== undefined) {
                return result;
            }
        }
    }
    return undefined;
};

const updateNode = (data: GroupTreeNode[], key: React.Key, values: GroupTreeFormValues): GroupTreeNode[] => {
    return data.map(item => {
        if (item.key === key) {
            return {
                ...item,
                title: values.title,
                gatewayChain: values.gatewayChain || [],
            };
        }
        return {
            ...item,
            children: item.children ? updateNode(item.children, key, values) : undefined,
        };
    });
};

const removeNode = (data: GroupTreeNode[], key: React.Key): [GroupTreeNode[], GroupTreeNode | undefined] => {
    let removedNode: GroupTreeNode | undefined;
    const result: GroupTreeNode[] = [];

    for (const item of data) {
        if (item.key === key) {
            removedNode = item;
            continue;
        }
        const [children, removedChild] = item.children ? removeNode(item.children, key) : [undefined, undefined];
        if (removedChild) {
            removedNode = removedChild;
        }
        result.push({...item, children});
    }

    return [result, removedNode];
};

const addNode = (data: GroupTreeNode[], parentKey: React.Key | undefined, newNode: GroupTreeNode): GroupTreeNode[] => {
    if (!parentKey) {
        return [...data, newNode];
    }
    return data.map(item => ({
        ...item,
        children: item.key === parentKey
            ? [...(item.children || []), newNode]
            : item.children ? addNode(item.children, parentKey, newNode) : undefined,
    }));
};

const GroupTree = ({data, selected, keyPrefix, saving, onSelect, onSave, onDelete}: Props) => {
    const {t} = useTranslation();
    const [theme] = useNTTheme();
    const [treeData, setTreeData] = useState<GroupTreeNode[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<GroupTreeNode>();
    const [parentKey, setParentKey] = useState<string>();
    const [op, setOp] = useState<GroupTreeOperation>();
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>(selected ? [selected] : []);
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

    useEffect(() => {
        if (data) {
            setTreeData(data);
            setExpandedKeys(getAllKeys(data));
        }
    }, [data]);

    useEffect(() => {
        setSelectedKeys(selected ? [selected] : []);
    }, [selected]);

    const saveTreeData = (newTreeData: GroupTreeNode[]) => {
        return onSave(newTreeData).then(() => setTreeData(newTreeData));
    };

    const onDrop: TreeProps<GroupTreeNode>['onDrop'] = info => {
        const dropKey = info.node.key;
        const dragKey = info.dragNode.key;
        if (dragKey === 'default') {
            return;
        }

        const dropPos = info.node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        const newTreeData = cloneTree(treeData);
        let dragNode: GroupTreeNode | undefined;

        const loop = (
            nodes: GroupTreeNode[],
            key: React.Key,
            callback: (node: GroupTreeNode, index: number, items: GroupTreeNode[]) => void,
        ) => {
            for (let index = 0; index < nodes.length; index++) {
                if (nodes[index].key === key) {
                    callback(nodes[index], index, nodes);
                    return true;
                }
                if (nodes[index].children && loop(nodes[index].children!, key, callback)) {
                    return true;
                }
            }
            return false;
        };

        loop(newTreeData, dragKey, (node, index, items) => {
            dragNode = node;
            items.splice(index, 1);
        });
        if (!dragNode) {
            return;
        }

        if (!info.dropToGap) {
            loop(newTreeData, dropKey, node => {
                node.children = [dragNode!, ...(node.children || [])];
            });
        } else {
            loop(newTreeData, dropKey, (_node, index, items) => {
                items.splice(dropPosition === -1 ? index : index + 1, 0, dragNode!);
            });
        }
        void saveTreeData(newTreeData);
    };

    const getGatewayTypeName = (gatewayType?: string) => {
        switch (gatewayType) {
            case 'ssh':
                return t('menus.gateway.submenus.ssh_gateway');
            case 'agent':
                return t('menus.gateway.submenus.agent_gateway');
            case 'group':
                return t('menus.gateway.submenus.gateway_group');
            default:
                return '';
        }
    };

    const items: MenuProps['items'] = [
        {
            label: t('actions.new'),
            key: 'add',
            icon: <PlusIcon className="h-4 w-4"/>,
            onClick: () => {
                if (!contextMenu) return;
                setParentKey(contextMenu.node.key as string);
                setSelectedNode(undefined);
                setOpen(true);
                setOp('add');
            },
        },
        {
            label: t('actions.edit'),
            key: 'edit',
            icon: <CogIcon className="h-4 w-4"/>,
            onClick: () => {
                if (!contextMenu) return;
                setParentKey(findParentKey(treeData, contextMenu.node.key) as string | undefined);
                setSelectedNode(contextMenu.node);
                setOpen(true);
                setOp('edit');
            },
        },
        {
            label: t('actions.delete'),
            key: 'delete',
            danger: true,
            icon: <TrashIcon className="h-4 w-4"/>,
            onClick: () => {
                if (!contextMenu) return;
                void onDelete(contextMenu.node.key as string);
            },
        },
    ];

    const handleRightClick: TreeProps<GroupTreeNode>['onRightClick'] = ({event, node}) => {
        if (node.key === 'default') {
            return;
        }
        event.preventDefault();
        setContextMenu({
            pageX: event.pageX,
            pageY: event.pageY,
            node,
        });
    };

    const closeModal = () => {
        setOpen(false);
        setSelectedNode(undefined);
        setParentKey(undefined);
    };

    const handleModalOk = (values: GroupTreeFormValues) => {
        const nextParentKey = values.parentKey;
        let newTreeData: GroupTreeNode[];

        if (values.key) {
            const currentParentKey = findParentKey(treeData, values.key) as string | undefined;
            if (currentParentKey === nextParentKey) {
                newTreeData = updateNode(treeData, values.key, values);
            } else {
                const [dataWithoutNode, node] = removeNode(treeData, values.key);
                if (!node) {
                    return;
                }
                newTreeData = addNode(dataWithoutNode, nextParentKey, {
                    ...node,
                    title: values.title,
                    gatewayChain: values.gatewayChain || [],
                });
            }
        } else {
            newTreeData = addNode(treeData, nextParentKey, {
                key: `${keyPrefix}${generateRandomId()}`,
                title: values.title,
                gatewayChain: values.gatewayChain || [],
                children: [],
            });
        }

        void saveTreeData(newTreeData).then(closeModal);
    };

    return (
        <div>
            <div className="px-4 pt-4 flex items-center justify-between">
                <div className="font-medium text-[15px]">
                    <Tooltip title={t('group_tree.tip')}>
                        <div className="cursor-pointer">{t('group_tree.title')}</div>
                    </Tooltip>
                </div>
                <AddGroupButton
                    onClick={() => {
                        setParentKey(undefined);
                        setSelectedNode(undefined);
                        setOpen(true);
                        setOp('add');
                    }}
                />
            </div>

            <Tree<GroupTreeNode>
                draggable
                blockNode
                onDrop={onDrop}
                treeData={treeData}
                titleRender={node => {
                    const gatewayHop = firstGatewayHop(node.gatewayChain);
                    return (
                        <div className="flex items-center gap-1">
                            <span>{node.title as React.ReactNode}</span>
                            {gatewayHop.gatewayType && gatewayHop.gatewayId && (
                                <Tooltip title={t('assets.group_default_gateway')}>
                                    <Tag color="blue" className="m-0 leading-4 text-[11px]">
                                        {getGatewayTypeName(gatewayHop.gatewayType)}
                                    </Tag>
                                </Tooltip>
                            )}
                        </div>
                    );
                }}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                style={{
                    backgroundColor: theme.isDark ? theme.backgroundColor : '#F9FAFB',
                    padding: 8,
                }}
                selectedKeys={selectedKeys}
                onSelect={keys => {
                    setSelectedKeys(keys);
                    onSelect(keys.length > 0 ? keys[0] as string : '');
                }}
                onRightClick={handleRightClick}
            />

            {contextMenu && (
                <Dropdown
                    menu={{items}}
                    open
                    trigger={['contextMenu']}
                    onOpenChange={visible => !visible && setContextMenu(null)}
                    styles={{
                        root: {
                            position: 'absolute',
                            left: contextMenu.pageX,
                            top: contextMenu.pageY,
                        },
                    }}
                >
                    <div style={{
                        position: 'fixed',
                        top: contextMenu.pageY,
                        left: contextMenu.pageX,
                        width: 0,
                        height: 0,
                    }}/>
                </Dropdown>
            )}

            <GroupTreeModal
                op={op}
                open={open}
                confirmLoading={saving || false}
                node={selectedNode}
                parentKey={parentKey}
                treeData={treeData}
                handleCancel={closeModal}
                handleOk={handleModalOk}
            />
        </div>
    );
};

export default GroupTree;
