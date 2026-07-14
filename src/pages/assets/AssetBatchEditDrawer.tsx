import type {AICommandPolicy, BatchUpdateAssetRequest, BatchUpdateAssetResult} from "@/api/asset-api";
import assetApi from "@/api/asset-api";
import type {GatewayHop} from "@/api/gateway-chain";
import {useLicense} from "@/hook/LicenseContext";
import GatewayChainEditor from "@/pages/assets/components/GatewayChainEditor";
import {useMutation} from "@tanstack/react-query";
import {Alert, App, Button, Checkbox, Divider, Drawer, Form, Radio, Select, Space, Switch} from "antd";
import {useEffect} from "react";
import {useTranslation} from "react-i18next";

interface Props {
    assetIds: string[];
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface BatchEditFormValues {
    updateAIEnabled: boolean;
    aiEnabled: boolean;
    updateAIRestrictedShell: boolean;
    aiRestrictedShell: boolean;
    updateAICommandPolicy: boolean;
    aiCommandPolicy: AICommandPolicy;
    updateGateway: boolean;
    gatewayMode: 'inherit' | 'custom';
    gatewayChain: GatewayHop[];
}

const initialValues: BatchEditFormValues = {
    updateAIEnabled: false,
    aiEnabled: true,
    updateAIRestrictedShell: false,
    aiRestrictedShell: false,
    updateAICommandPolicy: false,
    aiCommandPolicy: '',
    updateGateway: false,
    gatewayMode: 'inherit',
    gatewayChain: [],
};

const AssetBatchEditDrawer = ({assetIds, open, onClose, onSuccess}: Props) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm<BatchEditFormValues>();
    const {license, isLoading: licenseLoading} = useLicense();
    const hasPremiumFeatures = !licenseLoading && license.hasPremiumFeatures();

    const updateAIEnabled = Form.useWatch('updateAIEnabled', form);
    const updateAIRestrictedShell = Form.useWatch('updateAIRestrictedShell', form);
    const updateAICommandPolicy = Form.useWatch('updateAICommandPolicy', form);
    const updateGateway = Form.useWatch('updateGateway', form);
    const gatewayMode = Form.useWatch('gatewayMode', form);
    const hasChanges = updateAIEnabled || updateAIRestrictedShell || updateAICommandPolicy || updateGateway;

    useEffect(() => {
        if (open) {
            form.setFieldsValue(initialValues);
        }
    }, [form, open]);

    const mutation = useMutation({
        mutationFn: (request: BatchUpdateAssetRequest) => assetApi.batchUpdate(request),
        onSuccess: (result: BatchUpdateAssetResult, request: BatchUpdateAssetRequest) => {
            if (request.changes.ai && request.changes.gateway) {
                message.success(t('assets.batch_edit.success_ai_gateway', {
                    aiCount: result.aiUpdatedCount,
                    skippedCount: result.aiSkippedCount,
                    gatewayCount: result.gatewayUpdatedCount,
                }));
            } else if (result.gatewayUpdatedCount > 0) {
                message.success(t('assets.batch_edit.success_gateway', {count: result.gatewayUpdatedCount}));
            } else if (result.aiUpdatedCount > 0) {
                message.success(t('assets.batch_edit.success_ai', {
                    count: result.aiUpdatedCount,
                    skippedCount: result.aiSkippedCount,
                }));
            } else {
                message.warning(t('assets.batch_edit.no_ssh_asset'));
            }
            onSuccess();
        },
    });

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (values.updateGateway && values.gatewayMode === 'custom' && !values.gatewayChain?.length) {
            message.warning(t('assets.batch_edit.gateway_required'));
            return;
        }
        const changes: BatchUpdateAssetRequest['changes'] = {};
        const aiChanges: NonNullable<BatchUpdateAssetRequest['changes']['ai']> = {};
        if (values.updateAIEnabled) {
            aiChanges.enabled = values.aiEnabled;
        }
        if (values.updateAIRestrictedShell) {
            aiChanges.restrictedShell = values.aiRestrictedShell;
        }
        if (values.updateAICommandPolicy) {
            aiChanges.commandPolicy = values.aiCommandPolicy;
        }
        if (values.updateAIEnabled || values.updateAIRestrictedShell || values.updateAICommandPolicy) {
            changes.ai = aiChanges;
        }
        if (values.updateGateway) {
            changes.gateway = {
                gatewayChain: values.gatewayMode === 'custom' ? values.gatewayChain || [] : [],
            };
        }
        mutation.mutate({assetIds, changes});
    };

    return (
        <Drawer
            title={t('assets.batch_edit.title')}
            open={open}
            onClose={onClose}
            size={520}
            footer={(
                <div className="flex justify-end gap-2">
                    <Button onClick={onClose}>{t('actions.cancel')}</Button>
                    <Button
                        type="primary"
                        disabled={!hasChanges}
                        loading={mutation.isPending}
                        onClick={handleSubmit}
                    >
                        {t('actions.confirm')}
                    </Button>
                </div>
            )}
        >
            <div className={'mb-5'}>
                <Alert
                    type="info"
                    showIcon
                    className=""
                    title={t('assets.batch_edit.scope_tip')}
                />
            </div>

            <Form form={form} layout="vertical" initialValues={initialValues}>
                <div className="mb-3 font-medium">{t('assets.ai.settings')}</div>
                <Space orientation="vertical" size="middle" className="w-full">
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateAIEnabled" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.ai.enabled')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="aiEnabled" valuePropName="checked" noStyle>
                            <Switch
                                disabled={!updateAIEnabled}
                                checkedChildren={t('general.enabled')}
                                unCheckedChildren={t('general.disabled')}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateAIRestrictedShell" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.ai.restricted_shell')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="aiRestrictedShell" valuePropName="checked" noStyle>
                            <Switch
                                disabled={!updateAIRestrictedShell}
                                checkedChildren={t('general.enabled')}
                                unCheckedChildren={t('general.disabled')}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateAICommandPolicy" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.ai.command_policy')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="aiCommandPolicy" noStyle>
                            <Select
                                className="w-44"
                                disabled={!updateAICommandPolicy}
                                options={[
                                    {label: t('assets.ai.follow_global'), value: ''},
                                    {label: t('settings.ai.command_policy_auto'), value: 'auto'},
                                    {label: t('settings.ai.command_policy_balanced'), value: 'balanced'},
                                    {label: t('settings.ai.command_policy_always'), value: 'always'},
                                ]}
                            />
                        </Form.Item>
                    </div>
                </Space>

                {hasPremiumFeatures && (
                    <>
                        <Divider/>
                        <Form.Item name="updateGateway" valuePropName="checked">
                            <Checkbox>{t('assets.batch_edit.update_gateway')}</Checkbox>
                        </Form.Item>
                        {updateGateway && (
                            <>
                                <Form.Item name="gatewayMode" label={t('assets.batch_edit.gateway_mode')}>
                                    <Radio.Group
                                        options={[
                                            {label: t('assets.batch_edit.gateway_inherit'), value: 'inherit'},
                                            {label: t('assets.batch_edit.gateway_custom'), value: 'custom'},
                                        ]}
                                    />
                                </Form.Item>
                                {gatewayMode === 'custom' && <GatewayChainEditor/>}
                            </>
                        )}
                    </>
                )}
            </Form>
        </Drawer>
    );
};

export default AssetBatchEditDrawer;
