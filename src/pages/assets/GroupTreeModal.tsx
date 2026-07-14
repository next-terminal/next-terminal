import {useEffect, useRef} from 'react';
import {Form, Input, InputRef, Modal, TreeSelect} from 'antd';
import {useTranslation} from 'react-i18next';
import {useLicense} from '@/hook/LicenseContext';
import GatewayChainEditor from '@/pages/assets/components/GatewayChainEditor';
import type {GroupTreeNode, GroupTreeOperation} from '@/pages/assets/GroupTree';

export interface GroupTreeFormValues extends GroupTreeNode {
    parentKey?: string;
}

interface Props {
    open: boolean;
    confirmLoading: boolean;
    op?: GroupTreeOperation;
    node?: GroupTreeNode;
    parentKey?: string;
    treeData: GroupTreeNode[];
    handleOk: (values: GroupTreeFormValues) => void;
    handleCancel: () => void;
}

const buildParentOptions = (nodes: GroupTreeNode[], excludedKey?: React.Key): GroupTreeNode[] => {
    return nodes
        .filter(node => node.key !== 'default' && node.key !== excludedKey)
        .map(node => ({
            key: node.key,
            value: node.key,
            title: node.title,
            children: node.children ? buildParentOptions(node.children, excludedKey) : undefined,
        }));
};

const GroupTreeModal = ({
    open,
    confirmLoading,
    op,
    node,
    parentKey,
    treeData,
    handleOk,
    handleCancel,
}: Props) => {
    const [form] = Form.useForm<GroupTreeFormValues>();
    const {t} = useTranslation();
    const inputRef = useRef<InputRef>(null);
    const {license, isLoading: licenseLoading} = useLicense();
    const hasPremiumFeatures = !licenseLoading && license.hasPremiumFeatures();

    useEffect(() => {
        if (!open || licenseLoading) {
            return;
        }

        form.setFieldsValue({
            key: node?.key,
            title: node?.title,
            gatewayChain: hasPremiumFeatures ? node?.gatewayChain || [] : [],
            parentKey,
        });

        const timer = window.setTimeout(() => inputRef.current?.focus(), 300);
        return () => window.clearTimeout(timer);
    }, [form, hasPremiumFeatures, licenseLoading, node, open, parentKey]);

    const onOk = () => {
        form.validateFields().then(values => {
            if (!hasPremiumFeatures) {
                values.gatewayChain = [];
            }
            handleOk(values);
        });
    };

    return (
        <Modal
            title={op === 'edit' ? t('group_tree.edit_title') : t('group_tree.add_title')}
            open={open}
            mask={{closable: false}}
            destroyOnHidden
            onOk={onOk}
            onCancel={handleCancel}
            confirmLoading={confirmLoading}
        >
            <Form form={form} clearOnDestroy layout="vertical">
                <Form.Item hidden name="key">
                    <Input/>
                </Form.Item>
                <Form.Item
                    name="title"
                    label={t('group_tree.name')}
                    rules={[{required: true, message: t('group_tree.name_required')}]}
                >
                    <Input
                        ref={inputRef}
                        placeholder={t('group_tree.name_placeholder')}
                        onPressEnter={onOk}
                    />
                </Form.Item>
                <Form.Item name="parentKey" label={t('group_tree.parent')}>
                    <TreeSelect
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeNodeFilterProp="title"
                        placeholder={t('group_tree.parent_placeholder')}
                        treeData={buildParentOptions(treeData, op === 'edit' ? node?.key : undefined)}
                    />
                </Form.Item>
                <GatewayChainEditor disabled={!hasPremiumFeatures}/>
            </Form>
        </Modal>
    );
};

export default GroupTreeModal;
