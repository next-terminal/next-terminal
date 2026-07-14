import {useFormRequest} from "@/hook/use-antd-form-query";
import QuerySelect from "@/components/QuerySelect";
import React, {useState} from 'react';
import {App, Button, Drawer, Form, Input, InputNumber, Radio, Segmented, Space, Tabs, TreeDataNode} from 'antd';
import {useMutation} from "@tanstack/react-query";
import {RefreshCwIcon, ZapIcon} from "lucide-react";
import {useTranslation} from "react-i18next";
import assetsApi, {Asset} from "../../api/asset-api";
import strings from "@/utils/strings";
import {useLicense} from "@/hook/LicenseContext";
import MultiFactorAuthentication from "@/pages/account/MultiFactorAuthentication";
import LogoSelector from "@/pages/assets/components/LogoSelector";
import AccountTypeForm from "./components/AccountTypeForm";
import {DefaultTerminalConnectTimeout, getAssetAdvancedItems} from "./components/AssetAdvancedSettings";
import ProFormTreeSelect from "@/components/ProFormTreeSelect";
import GatewayChainEditor from "@/pages/assets/components/GatewayChainEditor";

const protocolOptions = [
    {
        label: 'SSH',
        value: 'ssh'
    }, {
        label: 'RDP',
        value: 'rdp'
    }, {
        label: 'VNC',
        value: 'vnc'
    }, {
        label: 'Telnet',
        value: 'telnet'
    }
];

interface TreeSelectDataNode {
    title: TreeDataNode['title'];
    value: string;
    children: TreeSelectDataNode[];
}

interface Props {
    open: boolean;
    assetId?: string;
    groupId?: string;
    copy?: boolean;
    onClose?: () => void;
    onSuccess?: (asset?: Asset) => void;
}

const AssetPostDrawer = ({
                             open,
                             assetId,
                             groupId,
                             copy,
                             onClose,
                             onSuccess
                         }: Props) => {
    let {t} = useTranslation();
    const [form] = Form.useForm();
    const protocol = Form.useWatch('protocol', form);
    const accountType = Form.useWatch('accountType', form);
    const wolEnabled = Form.useWatch(['attrs', 'wol-enabled'], form);
    let [logo, setLogo] = useState<string>();
    let [decrypted, setDecrypted] = useState(false);
    let [mfaOpen, setMfaOpen] = useState(false);
    let {message} = App.useApp();
    const {license, isLoading: licenseLoading} = useLicense();
    const hasPremiumFeatures = !licenseLoading && license.hasPremiumFeatures();

    const get = async () => {
        form.resetFields();
        setDecrypted(false);
        if (assetId) {
            let asset = await assetsApi.getById(assetId);
            asset.attrs = {
                connectTimeout: DefaultTerminalConnectTimeout,
                backspaceMode: 'del',
                ...(asset.attrs || {})
            };
            if (!asset.attrs.connectTimeout) {
                asset.attrs.connectTimeout = DefaultTerminalConnectTimeout;
            }
            if (!asset.attrs.backspaceMode) {
                asset.attrs.backspaceMode = 'del';
            }
            const formAsset = {...asset, gatewayChain: hasPremiumFeatures ? asset.gatewayChain || [] : []};
            setLogo(strings.hasText(asset.logo) ? asset.logo : undefined);
            if (copy === true) {
                formAsset.password = '';
                formAsset.privateKey = '';
                formAsset.passphrase = '';
                formAsset.alias = '';
            }
            return formAsset;
        }
        setLogo(undefined);
        return {
            protocol: 'ssh',
            port: 22,
            accountType: 'password',
            gatewayChain: [],
            attrs: {
                "disable-audio": true,
                "enable-drive": true,
                "security": "any",
                "ignore-cert": true,
                enableAliveCheck: true,
                enableDetectOS: true,
                connectTimeout: DefaultTerminalConnectTimeout,
                backspaceMode: 'del'
            },
            groupId: groupId
        } as any;
    };
    const saveAsset = async (values: any) => {
        values['logo'] = logo;
        if (!hasPremiumFeatures) {
            values.gatewayChain = [];
        }
        if (!copy && values['id']) {
            await assetsApi.updateById(values['id'], values);
            return undefined;
        } else {
            delete values['id'];
            return await assetsApi.create(values);
        }
    };
    let mutation = useMutation({
        mutationFn: saveAsset,
        onSuccess: (asset) => {
            message.success(t('general.success'));
            onSuccess?.(asset);
            if (onClose) {
                onClose();
            }
        }
    });

    const detectOSMutation = useMutation({
        mutationFn: async () => {
            if (!assetId) {
                return;
            }
            await assetsApi.detectOS(assetId);
            const asset = await assetsApi.getById(assetId);
            const nextLogo = strings.hasText(asset.logo) ? asset.logo : undefined;
            setLogo(nextLogo);
            form.setFieldValue('logo', nextLogo);
            onSuccess?.();
        },
        onSuccess: () => {
            message.success(t('assets.detect_os_success'));
        },
        onError: (e: any) => {
            message.error(e?.message || t('assets.detect_os_failed'));
        }
    });

    const wolMutation = useMutation({
        mutationFn: async () => {
            if (!assetId) {
                return undefined;
            }
            await form.validateFields();
            await saveAsset(form.getFieldsValue(true));
            onSuccess?.();
            return await assetsApi.wol(assetId) as { error?: string; delay?: number };
        },
        onSuccess: (res) => {
            if (res?.error) {
                message.error(res.error);
                return;
            }
            message.success(t('assets.wol_send_success'));
        },
        onError: (e: any) => {
            message.error(e?.message || t('assets.wol_send_failed'));
        }
    });

    const wrapSet = async (values: any) => {
        form.validateFields().then(() => {
            mutation.mutate(values);
        });
    };
    const renderProtocol = (protocol?: string) => {
        if (protocol === 'telnet') {
            return null;
        }

        const accountTypeOptions = [
            {
                label: t('assets.password'),
                value: 'password'
            },
            {
                label: t('assets.private_key'),
                value: 'private-key',
                disabled: protocol !== 'ssh'
            },
            {
                label: t('menus.resource.submenus.credential'),
                value: 'credential'
            }
        ];

        return (
            <>
                <Form.Item label={t('assets.account_type')} name='accountType' required={true}>
                    <Radio.Group options={accountTypeOptions}/>
                </Form.Item>
                <AccountTypeForm
                    accountType={accountType}
                    protocol={protocol || ''}
                    assetId={assetId}
                    copy={copy}
                    decrypted={decrypted}
                    setDecrypted={setDecrypted}
                    setMfaOpen={setMfaOpen}
                    form={form}
                />
            </>
        );
    };
    const transformData = (data: TreeDataNode[]): TreeSelectDataNode[] => {
        return data.map(item => {
            const newItem: TreeSelectDataNode = {
                title: item.title,
                value: item.key as string,
                children: []
            };
            if (item.children) {
                newItem.children = transformData(item.children);
            }
            return newItem;
        });
    };


    useFormRequest(form, ["form-request", "web/src/pages/assets/AssetPostDrawer.tsx", open, assetId, groupId, copy], get, {
        enabled: open && !licenseLoading
    });

    const renderPane = (children: React.ReactNode) => (
        <div className="min-h-130 pr-2">
            {children}
        </div>
    );

    const basicFields = (
        <>
            <Form.Item hidden={true} name={'id'}>
                <Input/>
            </Form.Item>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <LogoSelector
                    logo={logo}
                    onLogoChange={setLogo}
                    extra={assetId && !copy && protocol === 'ssh' && (
                        <Button
                            block
                            color="default"
                            variant="filled"
                            icon={<RefreshCwIcon className="h-4 w-4"/>}
                            loading={detectOSMutation.isPending}
                            onClick={() => detectOSMutation.mutate()}
                        >
                            {t('assets.auto_fetch_favicon')}
                        </Button>
                    )}
                />

                <Form.Item name={'name'} label={t('general.name')} required={true}>
                    <Input/>
                </Form.Item>

                <Form.Item name={'alias'} label={t('assets.alias')}
                           tooltip={t('assets.alias_tip')}
                           rules={[{
                               pattern: /^[A-Za-z][A-Za-z0-9_-]*$/,
                               message: t('assets.alias_invalid')
                           }]}>
                    <Input placeholder={t('assets.alias_placeholder')}/>
                </Form.Item>

                <ProFormTreeSelect name="groupId" label={t('assets.group')}
                                   allowClear
                                   request={async () => {
                                       let tree = await assetsApi.getGroups();
                                       return transformData(tree);
                                   }}
                                   fieldProps={{
                                       treeDefaultExpandAll: true,
                                       style: {
                                           width: '100%'
                                       }
                                   }}
                />
            </div>

            <div>
                <Space>
                    <Form.Item label={t('assets.protocol')} name='protocol' required={true}>
                        <Segmented
                            options={protocolOptions}
                            onChange={value => {
                                let port = 0;
                                switch (value) {
                                    case 'rdp':
                                        port = 3389;
                                        break;
                                    case 'vnc':
                                        port = 5900;
                                        break;
                                    case 'ssh':
                                        port = 22;
                                        break;
                                    case 'telnet':
                                        port = 23;
                                        break;
                                }
                                form.setFieldsValue({
                                    port: port
                                });
                            }}
                        />
                    </Form.Item>

                    <Form.Item label={t('assets.addr')} className={'nesting-form-item'}>
                        <Space.Compact block>
                            <Form.Item noStyle name='ip' required={true}>
                                <Input style={{
                                    width: 'calc(100% - 120px)'
                                }} placeholder="127.0.0.1" onKeyDown={e => {
                                    if (e.key === " ") {
                                        e.preventDefault(); // 阻止输入空格
                                    }
                                }}/>
                            </Form.Item>

                            <Form.Item noStyle name='port' required={true}>
                                <InputNumber style={{
                                    width: '120px'
                                }} min={1} max={65535} placeholder='0'/>
                            </Form.Item>
                        </Space.Compact>
                    </Form.Item>
                </Space>
            </div>


            {renderProtocol(protocol)}

            <GatewayChainEditor disabled={!hasPremiumFeatures}/>

            <Form.Item label={t('assets.tags')} name='tags'>
                <QuerySelect mode={'tags'} showSearch request={async () => {
                    let tags = await assetsApi.getTags();
                    return tags.map(tag => ({
                        label: tag,
                        value: tag
                    }));
                }}/>
            </Form.Item>


            <Form.Item label={t('general.remark')} name='description'>
                <Input.TextArea rows={4}/>
            </Form.Item>
        </>
    );

    const advancedTabs = (getAssetAdvancedItems(protocol || '', t) ?? []).map(item => {
        const children = item.key === 'wol-settings' ? (
            <>
                {item.children}
                {assetId && !copy && wolEnabled && (
                    <Form.Item className="mt-6 mb-0">
                        <Button
                            htmlType="button"
                            color="cyan"
                            variant="filled"
                            icon={<ZapIcon className="h-4 w-4"/>}
                            loading={wolMutation.isPending}
                            onClick={() => wolMutation.mutate()}
                        >
                            {t('assets.wol_send')}
                        </Button>
                    </Form.Item>
                )}
            </>
        ) : item.children;

        return {
            ...item,
            children: renderPane(children)
        };
    });

    const tabsItems = [
        {
            key: 'basic',
            label: t('assets.general'),
            children: renderPane(basicFields),
            forceRender: true
        },
        ...advancedTabs
    ];

    let title = assetId ? t('actions.edit') : t('actions.new');
    if (copy) {
        title = t('actions.copy');
    }

    const drawerExtra = (
        <Space size={8}>
            <Button onClick={onClose}>
                {t('actions.cancel')}
            </Button>
            <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
                {t('actions.save')}
            </Button>
        </Space>
    );

    return <Drawer
        title={title}
        open={open}
        size={960}
        destroyOnHidden={true}
        extra={drawerExtra}
        onClose={onClose}
    >
        <Form layout="vertical" onFinish={wrapSet} form={form}>
            <Tabs
                tabPlacement="start"
                items={tabsItems}
                defaultActiveKey="basic"
            />
        </Form>

        <MultiFactorAuthentication open={mfaOpen} handleOk={async securityToken => {
            if (!assetId) {
                return;
            }
            const res = await assetsApi.decrypt(assetId, securityToken);
            form.setFieldsValue({
                'password': res.password,
                'privateKey': res.privateKey,
                'passphrase': res.passphrase
            });
            setDecrypted(true);
            setMfaOpen(false);
        }} handleCancel={() => setMfaOpen(false)}/>
    </Drawer>;
};
export default AssetPostDrawer;
