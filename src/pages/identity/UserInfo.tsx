import userApi from "../../api/user-api";
import {useTranslation} from "react-i18next";
import {Descriptions, Space, Spin, Tag} from "antd";
import NLink from "@/components/NLink";
import {useQuery} from "@tanstack/react-query";
import times from "@/components/time/times";

interface UserInfoProps {
    active: boolean
    id: string
}

const UserInfo = ({active, id}: UserInfoProps) => {

    let {t} = useTranslation();
    const userQuery = useQuery({
        queryKey: ['user', id],
        queryFn: () => userApi.getById(id),
        enabled: active && !!id,
    });

    const user = userQuery.data;

    return (
        <div className={'page-detail-info'}>
            <Spin spinning={userQuery.isLoading}>
                <Descriptions column={1}>
                    <Descriptions.Item label={t('gateways.username')}>{user?.username}</Descriptions.Item>
                    <Descriptions.Item label={t('identity.user.nickname')}>{user?.nickname}</Descriptions.Item>
                    <Descriptions.Item label={t('identity.user.mail')}>{user?.mail}</Descriptions.Item>
                    <Descriptions.Item label={t('general.remark')}>{user?.remark}</Descriptions.Item>
                    <Descriptions.Item label={t('identity.user.status')}>
                        {user?.status === 'disabled' ? (
                            <Tag color="error">{t('general.disabled')}</Tag>
                        ) : (
                            <Tag color="success">{t('general.enabled')}</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('identity.user.otp')}>
                        {user?.enabledTotp ? (
                            <Tag color="success">{t('general.enabled')}</Tag>
                        ) : (
                            <Tag color="error">{t('general.disabled')}</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('actions.authorized')}>
                        <Space size={12} wrap>
                            <NLink to={`/authorised-asset?userId=${id}`}>
                                {`${t('menus.resource.submenus.asset')}${t('actions.authorized')}`}
                            </NLink>
                            <NLink to={`/authorised-website?userId=${id}`}>
                                {`${t('menus.resource.submenus.website')}${t('actions.authorized')}`}
                            </NLink>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('general.created_at')}>
                        {user?.createdAt ? times.format(user.createdAt) : '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </div>
    );
};

export default UserInfo;
