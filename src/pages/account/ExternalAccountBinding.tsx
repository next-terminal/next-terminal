import accountApi, {type CompleteExternalLogin, type ExternalLoginResult} from '@/api/account-api';
import {startAuthentication} from '@simplewebauthn/browser';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Button, Divider, Form, Input, Segmented, Space, Typography} from 'antd';
import {Fingerprint, Link, LockKeyhole, ShieldCheck, User, UserPlus} from 'lucide-react';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

const {Title, Text} = Typography;

type BindingAction = 'create' | 'bind';

interface ExternalAccountBindingProps {
    result: ExternalLoginResult;
    onSuccess: () => void;
}

const ExternalAccountBinding = ({result, onSuccess}: ExternalAccountBindingProps) => {
    const {t} = useTranslation();
    const [action, setAction] = useState<BindingAction>('create');

    const loginStatusQuery = useQuery({
        queryKey: ['login-status'],
        queryFn: accountApi.getLoginStatus,
    });

    const mutation = useMutation({
        mutationFn: accountApi.completeExternalLogin,
        onSuccess: () => {
            sessionStorage.removeItem('current');
            sessionStorage.removeItem('openKeys');
            onSuccess();
        },
    });

    const passkeyMutation = useMutation({
        mutationFn: async () => {
            const loginStart = await accountApi.webauthnLoginStartV2();
            const authentication = await startAuthentication({
                optionsJSON: loginStart.publicKey,
                verifyBrowserAutofillInput: false,
            });
            await accountApi.webauthnLoginFinishV2(loginStart.token, authentication);
            await accountApi.bindCurrentExternalLogin({
                bindToken: result.bindToken ?? '',
            });
        },
        onSuccess: () => {
            sessionStorage.removeItem('current');
            sessionStorage.removeItem('openKeys');
            onSuccess();
        },
    });

    const submit = (values: Omit<CompleteExternalLogin, 'bindToken' | 'action'>) => {
        mutation.mutate({
            ...values,
            bindToken: result.bindToken ?? '',
            action,
        });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
                <Space direction="vertical" size={4} className="mb-6">
                    <Title level={3} className="!mb-0">{t('account.external_binding.title')}</Title>
                    <Text type="secondary">
                        {result.provider === 'wechat'
                            ? t('account.external_binding.provider_wechat')
                            : t('account.external_binding.provider_oidc')}
                    </Text>
                    <Text strong className="break-all">{result.suggestedUsername || result.mail}</Text>
                </Space>

                <Segmented
                    block
                    size="large"
                    value={action}
                    onChange={(value) => {
                        setAction(value as BindingAction);
                        mutation.reset();
                    }}
                    options={[
                        {
                            value: 'create',
                            label: (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    <UserPlus size={16}/>
                                    <span>{t('account.external_binding.create')}</span>
                                </span>
                            ),
                        },
                        {
                            value: 'bind',
                            label: (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    <Link size={16}/>
                                    <span>{t('account.external_binding.bind')}</span>
                                </span>
                            ),
                        },
                    ]}
                    className="mb-6"
                />

                {action === 'create' ? (
                    <Form
                        layout="vertical"
                        initialValues={{
                            username: result.suggestedUsername,
                            nickname: result.suggestedNickname || result.suggestedUsername,
                        }}
                        onFinish={submit}
                    >
                        <Form.Item
                            name="username"
                            label={t('account.external_binding.username')}
                            rules={[{required: true}]}
                        >
                            <Input size="large" prefix={<User size={16}/>} autoComplete="username"/>
                        </Form.Item>
                        <Form.Item
                            name="nickname"
                            label={t('account.external_binding.nickname')}
                            rules={[{required: true}]}
                        >
                            <Input size="large" prefix={<User size={16}/>}/>
                        </Form.Item>
                        <Form.Item name="password" label={t('account.external_binding.password_optional')}>
                            <Input.Password size="large" prefix={<LockKeyhole size={16}/>} autoComplete="new-password"/>
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label={t('account.confirm_password')}
                            dependencies={['password']}
                            rules={[({getFieldValue}) => ({
                                validator(_, value) {
                                    if (!getFieldValue('password') || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error(t('account.external_binding.password_mismatch')));
                                },
                            })]}
                        >
                            <Input.Password size="large" prefix={<LockKeyhole size={16}/>} autoComplete="new-password"/>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={mutation.isPending}>
                            {t('account.external_binding.create_and_login')}
                        </Button>
                    </Form>
                ) : (
                    <Form layout="vertical" onFinish={submit}>
                        <Form.Item
                            name="username"
                            label={t('account.external_binding.username')}
                            rules={[{required: true}]}
                        >
                            <Input size="large" prefix={<User size={16}/>} autoComplete="username"/>
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label={t('assets.password')}
                            rules={[{required: true}]}
                        >
                            <Input.Password size="large" prefix={<LockKeyhole size={16}/>} autoComplete="current-password"/>
                        </Form.Item>
                        <Form.Item name="totp" label={t('account.external_binding.totp_optional')}>
                            <Input
                                size="large"
                                prefix={<ShieldCheck size={16}/>}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                            />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={mutation.isPending}>
                            {t('account.external_binding.bind_and_login')}
                        </Button>
                        {loginStatusQuery.data?.webauthnEnabled && (
                            <>
                                <Divider plain>{t('account.external_binding.or')}</Divider>
                                <Button
                                    size="large"
                                    block
                                    icon={<Fingerprint size={16}/>}
                                    loading={passkeyMutation.isPending}
                                    onClick={() => passkeyMutation.mutate()}
                                >
                                    {t('account.external_binding.bind_with_passkey')}
                                </Button>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </div>
    );
};

export default ExternalAccountBinding;
