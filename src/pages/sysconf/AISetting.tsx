import {useEffect, useState} from 'react';
import {
    App,
    Button,
    Checkbox,
    Divider,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Spin,
    Switch,
    Tag,
    Typography
} from 'antd';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {CheckCircleIcon, PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import type {SettingProps} from './SettingPage';
import AIProfileModal from './AIProfileModal';
import aiSettingsApi, {
    AI_SETTINGS_PROPERTY_KEY,
    DEFAULT_AI_PROFILE,
    getBuiltinPreset,
    type AISettings,
    type BuiltinAPIProfile,
    normalizeAISettings,
    parseAISettingsProperty,
    stringifyAISettingsProperty,
} from '@/api/ai-settings-api';

type ProfileModalState = {
    mode: 'add' | 'edit';
    profile: BuiltinAPIProfile;
};

const AISetting = ({get, set}: SettingProps) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm<AISettings>();
    const queryClient = useQueryClient();
    const [disclaimerModalOpen, setDisclaimerModalOpen] = useState(false);
    const [disclaimerChecked, setDisclaimerChecked] = useState(false);
    const [profileModal, setProfileModal] = useState<ProfileModalState | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const activeProfileId = Form.useWatch(['builtin', 'activeProfileId'], form) || '';

    const query = useQuery({
        queryKey: ['settings', 'ai'],
        queryFn: async () => {
            const values = await get();
            return parseAISettingsProperty(values?.[AI_SETTINGS_PROPERTY_KEY]);
        },
    });

    const profilesQuery = useQuery({
        queryKey: ['ai', 'profiles'],
        queryFn: aiSettingsApi.profiles,
    });

    const profiles = profilesQuery.data || [];

    useEffect(() => {
        if (query.data) {
            form.setFieldsValue(query.data);
        }
    }, [form, query.data]);

    const mutation = useMutation({
        mutationFn: async (values: AISettings) => {
            const next = normalizeAISettings(values);
            const ok = await set({
                [AI_SETTINGS_PROPERTY_KEY]: stringifyAISettingsProperty(next),
            });
            if (ok === false) {
                return null;
            }
            return next;
        },
        onSuccess: (data) => {
            if (!data) {
                return;
            }
            queryClient.setQueryData(['settings', 'ai'], data);
            message.success(t('general.success'));
        },
    });

    const handleFinish = () => {
        mutation.mutate(form.getFieldsValue(true) as AISettings);
    };

    const handleEnabledChange = (checked: boolean) => {
        if (!checked) {
            form.setFieldsValue({
                enabled: false,
                disclaimerAccepted: false,
            });
            return;
        }
        if (form.getFieldValue('disclaimerAccepted') === true) {
            form.setFieldValue('enabled', true);
            return;
        }
        form.setFieldValue('enabled', false);
        setDisclaimerChecked(false);
        setDisclaimerModalOpen(true);
    };

    const handleDisclaimerOk = () => {
        if (!disclaimerChecked) {
            message.warning(t('settings.ai.disclaimer_required'));
            return;
        }
        form.setFieldsValue({
            enabled: true,
            disclaimerAccepted: true,
        });
        setDisclaimerModalOpen(false);
    };

    const buildProfile = () => {
        const usedIds = new Set(profiles.map(item => item?.id).filter(Boolean));
        let index = profiles.length + 1;
        let id = `profile-${index}`;
        while (usedIds.has(id)) {
            index += 1;
            id = `profile-${index}`;
        }
        return {
            ...DEFAULT_AI_PROFILE,
            id,
            name: `${t('settings.ai.profile')} ${index}`,
            model: '',
            models: [],
        };
    };

    const openAddProfile = () => {
        setProfileModal({mode: 'add', profile: buildProfile()});
    };

    const openEditProfile = (profile: BuiltinAPIProfile) => {
        setProfileModal({mode: 'edit', profile});
    };

    const saveActiveProfileId = async (profileId: string, showMessage = true) => {
        const currentSettings = form.getFieldsValue(true) as AISettings;
        const nextSettings = {
            ...currentSettings,
            builtin: {
                ...currentSettings.builtin,
                activeProfileId: profileId,
                profiles: [],
            },
        };
        const next = normalizeAISettings(nextSettings);
        const ok = await set({
            [AI_SETTINGS_PROPERTY_KEY]: stringifyAISettingsProperty(next),
        });
        if (ok === false) {
            return null;
        }
        queryClient.setQueryData(['settings', 'ai'], next);
        form.setFieldsValue(next);
        if (showMessage) {
            message.success(t('general.success'));
        }
        return next;
    };

    const handleSaveProfile = async (profile: BuiltinAPIProfile) => {
        try {
            setProfileSaving(true);
            if (profileModal?.mode === 'edit') {
                await aiSettingsApi.updateProfile(profile.id, profile);
            } else {
                const savedProfile = await aiSettingsApi.createProfile(profile);
                await saveActiveProfileId(savedProfile.id, false);
            }
            await queryClient.invalidateQueries({queryKey: ['ai', 'profiles']});
            message.success(t('general.success'));
            setProfileModal(null);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleRemoveProfile = async (index: number) => {
        const removedProfile = profiles[index];
        if (!removedProfile) {
            return;
        }
        await aiSettingsApi.deleteProfile(removedProfile.id);
        if (removedProfile.id === activeProfileId) {
            const nextProfile = profiles.find((_, itemIndex) => itemIndex !== index);
            await saveActiveProfileId(nextProfile?.id || '', false);
        }
        await queryClient.invalidateQueries({queryKey: ['ai', 'profiles']});
        message.success(t('general.success'));
    };

    const setActiveProfile = async (profile: BuiltinAPIProfile) => {
        if (profile.id === activeProfileId) {
            return;
        }
        await saveActiveProfileId(profile.id);
    };


    const renderProfileCards = () => {
        if (profiles.length === 0) {
            return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('settings.ai.profile_empty')}/>;
        }
        return (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {profiles.map((profile, index) => {
                    const active = profile.id === activeProfileId;
                    const preset = getBuiltinPreset(profile.presetId);
                    return (
                        <div
                            key={profile.id || index}
                            role="button"
                            tabIndex={0}
                            className={[
                                'min-w-0 cursor-pointer rounded border p-3 transition-colors',
                                active ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300',
                            ].join(' ')}
                            onClick={() => setActiveProfile(profile)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setActiveProfile(profile);
                                }
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Typography.Text strong ellipsis>{profile.name}</Typography.Text>
                                        {active ? (
                                            <Tag color="blue">
                                                <span className="inline-flex items-center gap-1 leading-none">
                                                    <CheckCircleIcon size={12}/>
                                                    <span>{t('settings.ai.profile_active')}</span>
                                                </span>
                                            </Tag>
                                        ) : null}
                                    </div>
                                    <div className="mt-1 truncate text-xs text-gray-500">{profile.baseUrl}</div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                        size="small"
                                        icon={<PencilIcon size={14}/>}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openEditProfile(profile);
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        danger
                                        icon={<Trash2Icon size={14}/>}
                                        disabled={profiles.length <= 1}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleRemoveProfile(index);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <Tag>{preset.name}</Tag>
                                <Tag>{profile.apiType === 'openai_responses' ? 'Responses' : 'Chat'}</Tag>
                                <span className="truncate">{profile.model || '-'}</span>
                                <span>{t('settings.ai.model_count', {count: profile.models?.length || 0})}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Spin spinning={query.isLoading || profilesQuery.isLoading}>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name={['builtin', 'activeProfileId']} hidden>
                    <Input/>
                </Form.Item>
                <Form.Item name="disclaimerAccepted" valuePropName="checked" hidden>
                    <Checkbox/>
                </Form.Item>
                <Form.Item name="enabled" label={t('settings.ai.enabled')} valuePropName="checked">
                    <Switch
                        checkedChildren={t('general.enabled')}
                        unCheckedChildren={t('general.disabled')}
                        onChange={handleEnabledChange}
                    />
                </Form.Item>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <Typography.Title level={5} className="!mb-0">{t('settings.ai.profile')}</Typography.Title>
                    <Button icon={<PlusIcon size={16}/>} onClick={openAddProfile}>
                        {t('settings.ai.add_profile')}
                    </Button>
                </div>
                {renderProfileCards()}

                <Divider titlePlacement="start">{t('settings.ai.behavior')}</Divider>
                <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
                    <Form.Item name="confirmMode" label={t('settings.ai.command_policy')}>
                        <Select
                            options={[
                                {label: t('settings.ai.command_policy_auto'), value: 'auto'},
                                {label: t('settings.ai.command_policy_balanced'), value: 'balanced'},
                                {label: t('settings.ai.command_policy_always'), value: 'always'},
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label={t('settings.ai.command_timeout')}>
                        <Space.Compact>
                            <Form.Item name="commandTimeoutSecs" noStyle>
                                <InputNumber min={5} max={300} precision={0} style={{width: 140}}/>
                            </Form.Item>
                            <Space.Addon>{t('general.second')}</Space.Addon>
                        </Space.Compact>
                    </Form.Item>
                    <Form.Item name="recentOutputLines" label={t('settings.ai.recent_output_lines')}>
                        <InputNumber min={0} max={500} precision={0} style={{width: 140}}/>
                    </Form.Item>
                </div>

                <Form.Item
                    name="includeCommandSnippets"
                    label={t('settings.ai.include_command_snippets')}
                    valuePropName="checked"
                    extra={t('settings.ai.include_command_snippets_tip')}
                >
                    <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
                </Form.Item>
                <Form.Item
                    name="customSystemPrompt"
                    label={t('settings.ai.custom_system_prompt')}
                    extra={t('settings.ai.custom_system_prompt_tip')}
                >
                    <Input.TextArea rows={5} maxLength={8000} showCount/>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                        {t('actions.save')}
                    </Button>
                </Form.Item>
            </Form>

            {profileModal ? (
                <AIProfileModal
                    mode={profileModal.mode}
                    open={!!profileModal}
                    profile={profileModal.profile}
                    confirmLoading={profileSaving}
                    onCancel={() => setProfileModal(null)}
                    onSave={handleSaveProfile}
                />
            ) : null}

            <Modal
                title={t('settings.ai.disclaimer_title')}
                open={disclaimerModalOpen}
                onOk={handleDisclaimerOk}
                onCancel={() => setDisclaimerModalOpen(false)}
                okText={t('actions.confirm')}
                cancelText={t('actions.cancel')}
            >
                <Typography.Paragraph>{t('settings.ai.disclaimer_description')}</Typography.Paragraph>
                <Checkbox checked={disclaimerChecked} onChange={event => setDisclaimerChecked(event.target.checked)}>
                    {t('settings.ai.disclaimer_accepted')}
                </Checkbox>
            </Modal>
        </Spin>
    );
};

export default AISetting;
