import {useEffect} from 'react';
import {App, Button, Form, Input, InputNumber, Modal, Select, Space, Typography} from 'antd';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {PlusIcon, RefreshCwIcon, Trash2Icon} from 'lucide-react';
import aiSettingsApi, {
    AI_BUILTIN_PROVIDER_PRESETS,
    AI_CONTEXT_WINDOW_MAX,
    AI_REASONING_EFFORTS,
    AI_THINKING_BUDGET_MAX,
    DEFAULT_AI_PROFILE,
    getBuiltinPreset,
    type AIBuiltinPresetId,
    type AIReasoningProtocol,
    type BuiltinAPIProfile,
} from '@/api/ai-settings-api';

type AIProfileModalProps = {
    mode: 'add' | 'edit';
    open: boolean;
    profile?: BuiltinAPIProfile;
    confirmLoading?: boolean;
    onCancel: () => void;
    onSave: (profile: BuiltinAPIProfile) => Promise<void> | void;
};

const uniqueModels = (models?: string[], activeModel?: string) => {
    return Array.from(new Set([
        activeModel,
        ...((models || []).map(item => `${item}`.trim())),
    ].filter((item): item is string => typeof item === 'string' && item.trim() !== '')));
};

const AIProfileModal = ({mode, open, profile, confirmLoading, onCancel, onSave}: AIProfileModalProps) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm<BuiltinAPIProfile>();
    const modalPresetId = Form.useWatch('presetId', form) || profile?.presetId;
    const modalModel = Form.useWatch('model', form) || profile?.model;
    const modalModelList = Form.useWatch('models', form) || profile?.models;
    const modalReasoningProtocol = Form.useWatch('reasoningProtocol', form) || profile?.reasoningProtocol;
    const modalThinkingMode = Form.useWatch('thinkingMode', form) || profile?.thinkingMode;
    const modalProfile = {
        ...DEFAULT_AI_PROFILE,
        ...(profile || {}),
        presetId: modalPresetId,
        model: modalModel,
        models: modalModelList,
        reasoningProtocol: modalReasoningProtocol,
        thinkingMode: modalThinkingMode,
    } as BuiltinAPIProfile;
    const modalPreset = getBuiltinPreset(modalProfile.presetId);
    const modalModels = uniqueModels(modalProfile.models, modalProfile.model);
    const modalShowThinkingMode = modalProfile.reasoningProtocol === 'thinking_object' || modalProfile.reasoningProtocol === 'qwen';
    const modalShowReasoningEffort = modalProfile.reasoningProtocol === 'openai' ||
        (modalProfile.reasoningProtocol === 'thinking_object' && modalProfile.thinkingMode !== 'disabled');
    const modalShowThinkingBudget = modalProfile.reasoningProtocol === 'qwen' && modalProfile.thinkingMode !== 'disabled';
    const modalReasoningEfforts = modalProfile.reasoningProtocol === 'thinking_object'
        ? AI_REASONING_EFFORTS.filter(item => item === '' || item === 'high' || item === 'xhigh')
        : AI_REASONING_EFFORTS;

    useEffect(() => {
        if (open && profile) {
            form.setFieldsValue(profile);
        } else {
            form.resetFields();
        }
    }, [form, open, profile]);

    const cleanProfile = (values: BuiltinAPIProfile) => {
        const models = uniqueModels(values.models, values.model);
        const model = values.model?.trim() || models[0] || '';
        return {
            ...DEFAULT_AI_PROFILE,
            ...values,
            id: values.id?.trim() || profile?.id || DEFAULT_AI_PROFILE.id,
            name: values.name?.trim() || getBuiltinPreset(values.presetId).name,
            baseUrl: values.baseUrl?.trim().replace(/\/+$/, '') || getBuiltinPreset(values.presetId).baseUrl,
            apiKey: values.apiKey?.trim() || '',
            model,
            models: models.includes(model) ? models : [model, ...models].filter(Boolean),
            userAgent: values.userAgent?.trim() || '',
            httpProxy: values.httpProxy?.trim() || '',
        };
    };

    const loadModelsMutation = useMutation({
        mutationFn: async (item: BuiltinAPIProfile) => {
            return await aiSettingsApi.models(item);
        },
        onSuccess: (models) => {
            if (models.length === 0) {
                message.warning(t('settings.ai.models_empty'));
                return;
            }
            const currentModel = form.getFieldValue('model');
            form.setFieldsValue({
                model: currentModel || models[0] || '',
                models,
            });
            message.success(t('settings.ai.models_loaded'));
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : t('settings.ai.models_load_failed'));
        },
    });

    const handlePresetChange = (presetId: AIBuiltinPresetId) => {
        const previousPreset = getBuiltinPreset(form.getFieldValue('presetId'));
        const nextPreset = getBuiltinPreset(presetId);
        const currentName = form.getFieldValue('name') || '';
        form.setFieldsValue({
            name: currentName.trim() === '' || currentName === previousPreset.name ? nextPreset.name : currentName,
            presetId: nextPreset.id,
            baseUrl: nextPreset.baseUrl,
            apiKey: '',
            model: nextPreset.model,
            models: nextPreset.models.length > 0 ? nextPreset.models : [],
            reasoningProtocol: nextPreset.reasoningProtocol,
            thinkingMode: '',
            reasoningEffort: '',
            thinkingBudget: 0,
        });
    };

    const handleModelsChange = () => {
        const nextModels = uniqueModels(form.getFieldValue('models'));
        const currentModel = form.getFieldValue('model') || '';
        form.setFieldsValue({
            models: nextModels,
            model: nextModels.includes(currentModel) ? currentModel : nextModels[0] || '',
        });
    };

    const handleReasoningProtocolChange = (reasoningProtocol: AIReasoningProtocol) => {
        form.setFieldsValue({
            reasoningProtocol,
            thinkingMode: '',
            reasoningEffort: '',
            thinkingBudget: 0,
        });
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        await onSave(cleanProfile(values));
    };

    const loadModalModels = () => {
        const values = form.getFieldsValue(true) as BuiltinAPIProfile;
        const preset = getBuiltinPreset(values.presetId);
        if (!values.baseUrl?.trim() || (mode === 'add' && preset.apiKeyRequired && !values.apiKey?.trim())) {
            message.warning(t('settings.ai.models_load_config_required'));
            return;
        }
        loadModelsMutation.mutate(cleanProfile(values));
    };

    return (
        <Modal
            title={mode === 'add' ? t('settings.ai.new_profile') : t('settings.ai.edit_profile')}
            open={open}
            onOk={handleSave}
            onCancel={onCancel}
            okText={t('actions.save')}
            confirmLoading={confirmLoading}
            cancelText={t('actions.cancel')}
            width={820}
            destroyOnHidden
        >
            <Form form={form} layout="vertical">
                <Form.Item name="id" hidden>
                    <Input/>
                </Form.Item>
                <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
                    <Form.Item
                        name="name"
                        label={t('settings.ai.profile_name')}
                        rules={[{required: true, message: t('general.required')}]}
                    >
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        name="presetId"
                        label={t('settings.ai.api_preset')}
                        rules={[{required: true, message: t('general.required')}]}
                    >
                        <Select
                            options={AI_BUILTIN_PROVIDER_PRESETS.map(item => ({
                                label: item.name,
                                value: item.id,
                            }))}
                            onChange={(value) => handlePresetChange(value)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="apiType"
                        label={t('settings.ai.api_type')}
                        rules={[{required: true, message: t('general.required')}]}
                        extra={t('settings.ai.api_type_tip')}
                    >
                        <Select
                            options={[
                                {label: t('settings.ai.api_type_openai'), value: 'openai'},
                                {label: t('settings.ai.api_type_openai_responses'), value: 'openai_responses'},
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        name="baseUrl"
                        label={t('settings.ai.base_url')}
                        rules={[{required: true, message: t('general.required')}]}
                        extra={t('settings.ai.base_url_tip')}
                    >
                        <Input placeholder={modalPreset.baseUrl || 'https://api.openai.com/v1'}/>
                    </Form.Item>
                    <Form.Item
                        name="apiKey"
                        label="API Key"
                        required={mode === 'add' && modalPreset.apiKeyRequired}
                        extra={mode === 'edit' ? t('settings.ai.api_key_edit_tip') : undefined}
                    >
                        <Input.Password autoComplete="new-password"/>
                    </Form.Item>
                    <Form.Item label={t('settings.ai.model')} required>
                        <Space.Compact block>
                            <Form.Item name="model" noStyle rules={[{required: true, message: t('general.required')}]}>
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="gpt-4o-mini"
                                    options={modalModels.map(item => ({label: item, value: item}))}
                                />
                            </Form.Item>
                            <Space.Addon className="!p-0">
                                <Button
                                    type="text"
                                    icon={<RefreshCwIcon size={16}/>}
                                    loading={loadModelsMutation.isPending}
                                    onClick={loadModalModels}
                                >
                                    {t('settings.ai.load_models')}
                                </Button>
                            </Space.Addon>
                        </Space.Compact>
                    </Form.Item>
                </div>
                <Form.Item label={t('settings.ai.models')} extra={t('settings.ai.models_tip')}>
                    <Form.List name="models">
                        {(fields, {add, remove}) => (
                            <Space direction="vertical" className="w-full" size="small">
                                {fields.map((field) => (
                                    <Space.Compact key={field.key} className="w-full">
                                        <Form.Item name={field.name} className="mb-0 flex-1">
                                            <Input placeholder="gpt-4o-mini" onBlur={handleModelsChange}/>
                                        </Form.Item>
                                        <Button
                                            danger
                                            icon={<Trash2Icon size={16}/>}
                                            disabled={fields.length <= 1}
                                            onClick={() => {
                                                remove(field.name);
                                                setTimeout(handleModelsChange);
                                            }}
                                        />
                                    </Space.Compact>
                                ))}
                                <Button
                                    size="small"
                                    icon={<PlusIcon size={16}/>}
                                    onClick={() => add('')}
                                >
                                    {t('settings.ai.add_model')}
                                </Button>
                            </Space>
                        )}
                    </Form.List>
                </Form.Item>

                <Typography.Title level={5}>{t('settings.ai.advanced_profile')}</Typography.Title>
                <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
                    <Form.Item
                        name="reasoningProtocol"
                        label={t('settings.ai.reasoning_protocol')}
                        extra={t('settings.ai.reasoning_protocol_tip')}
                    >
                        <Select
                            options={[
                                {label: t('settings.ai.reasoning_protocol_default'), value: ''},
                                {label: t('settings.ai.reasoning_protocol_openai'), value: 'openai'},
                                {label: t('settings.ai.reasoning_protocol_thinking_object'), value: 'thinking_object'},
                                {label: t('settings.ai.reasoning_protocol_qwen'), value: 'qwen'},
                            ]}
                            onChange={handleReasoningProtocolChange}
                        />
                    </Form.Item>
                    {modalShowThinkingMode ? (
                        <Form.Item
                            name="thinkingMode"
                            label={t('settings.ai.thinking_mode')}
                            extra={modalProfile.reasoningProtocol === 'qwen'
                                ? t('settings.ai.thinking_mode_qwen_tip')
                                : t('settings.ai.thinking_mode_tip')}
                        >
                            <Select
                                options={[
                                    {label: modalProfile.reasoningProtocol === 'thinking_object' ? t('settings.ai.thinking_mode_default_enabled') : t('settings.ai.thinking_mode_default'), value: ''},
                                    {label: t('general.enabled'), value: 'enabled'},
                                    {label: t('general.disabled'), value: 'disabled'},
                                ]}
                            />
                        </Form.Item>
                    ) : null}
                    {modalShowReasoningEffort ? (
                        <Form.Item
                            name="reasoningEffort"
                            label={t('settings.ai.reasoning_effort')}
                            extra={modalProfile.reasoningProtocol === 'thinking_object'
                                ? t('settings.ai.reasoning_effort_thinking_object_tip')
                                : t('settings.ai.reasoning_effort_tip')}
                        >
                            <Select
                                options={modalReasoningEfforts.map(item => ({
                                    label: item === ''
                                        ? t('settings.ai.reasoning_effort_default')
                                        : modalProfile.reasoningProtocol === 'thinking_object' && item === 'xhigh'
                                            ? 'max'
                                            : item,
                                    value: item,
                                }))}
                            />
                        </Form.Item>
                    ) : null}
                    {modalShowThinkingBudget ? (
                        <Form.Item
                            name="thinkingBudget"
                            label={t('settings.ai.thinking_budget')}
                            extra={t('settings.ai.thinking_budget_tip')}
                        >
                            <InputNumber min={0} max={AI_THINKING_BUDGET_MAX} step={1024} precision={0} className="w-full"/>
                        </Form.Item>
                    ) : null}
                    <Form.Item
                        name="contextWindow"
                        label={t('settings.ai.context_window')}
                        extra={t('settings.ai.context_window_tip')}
                    >
                        <InputNumber min={1} max={AI_CONTEXT_WINDOW_MAX} step={1024} precision={0} className="w-full"/>
                    </Form.Item>
                    <Form.Item
                        name="maxRetries"
                        label={t('settings.ai.max_retries')}
                        extra={t('settings.ai.max_retries_tip')}
                    >
                        <InputNumber min={0} max={10} precision={0} className="w-full"/>
                    </Form.Item>
                    <Form.Item
                        name="userAgent"
                        label="User-Agent"
                        extra={t('settings.ai.user_agent_tip')}
                    >
                        <Input placeholder="Mozilla/5.0 ..."/>
                    </Form.Item>
                    <Form.Item
                        name="httpProxy"
                        label={t('settings.ai.http_proxy')}
                        extra={t('settings.ai.http_proxy_tip')}
                    >
                        <Input placeholder="http://127.0.0.1:7890"/>
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default AIProfileModal;
