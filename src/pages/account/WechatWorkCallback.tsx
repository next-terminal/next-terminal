import wechatWorkApi from '@/api/wechat-work-api';
import type {ExternalLoginResult} from '@/api/account-api';
import { useMutation } from '@tanstack/react-query';
import { Result,Spin } from 'antd';
import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate,useSearchParams } from 'react-router-dom';
import ExternalAccountBinding from './ExternalAccountBinding';

const WechatWorkCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [bindingResult, setBindingResult] = useState<ExternalLoginResult>();

    const mutation = useMutation({
        mutationFn: ({code, state}: {code: string; state: string}) => wechatWorkApi.login({code, state}),
        onSuccess: (data) => {
            if (data.bindRequired) {
                setBindingResult(data);
                return;
            }
            // 清除会话存储
            sessionStorage.removeItem('current');
            sessionStorage.removeItem('openKeys');

            // 登录成功，跳转到首页
            navigate('/');
        },
        onError: (error) => {
            console.error('WeChat Work login failed:', error);
            // 登录失败，跳转回登录页面
            navigate(`/login?error=${error.message}`);
        },
        retry: false,
    });

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const savedState = sessionStorage.getItem('wechat_work_state');

        if (code && state && savedState === state) {
            sessionStorage.removeItem('wechat_work_state');
            // 使用授权码进行登录
            mutation.mutate({code, state});
        } else {
            // 没有授权码，可能是用户拒绝授权或其他错误
            navigate('/login?error=wechat_work_cancelled');
        }
    }, []);

    if (bindingResult) {
        return <ExternalAccountBinding result={bindingResult} onSuccess={() => navigate('/')}/>;
    }

    if (mutation.isPending) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="text-center">
                    <Spin size="large"/>
                    <div className="mt-4 text-lg">
                        {t('account.login.processing')}
                    </div>
                </div>
            </div>
        );
    }

    if (mutation.isError) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Result
                    status="error"
                    title={t('account.login.failed')}
                    subTitle={t('account.login.wechat_work_error')}
                    extra={[
                        <button
                            key="retry"
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                            onClick={() => navigate('/login')}
                        >
                            {t('account.login.back_to_login')}
                        </button>
                    ]}
                />
            </div>
        );
    }

    // 正常情况下，成功后会自动跳转，不会显示这个内容
    return null;
};

export default WechatWorkCallback;
