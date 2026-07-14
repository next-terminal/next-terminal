import { useQuery } from "@tanstack/react-query";
import { Transfer } from "antd";
import { TransferDirection } from "antd/es/transfer";
import { type Key,useEffect,useState } from "react";
import { useTranslation } from "react-i18next";
import loginPolicyApi from "../../api/login-policy-api";

interface UserInfoProps {
    active: boolean
    userId: string
}

const UserLoginPolicy = ({active: _active, userId}: UserInfoProps) => {
    let {t} = useTranslation();
    const [targetKeys, setTargetKeys] = useState<string[]>([]);

    let loginPolicyQuery = useQuery({
        queryKey: ['loginPolicy'],
        queryFn: loginPolicyApi.getAll,
    });

    let selectedKeysQuery = useQuery({
        queryKey: ['login-policy-id'],
        queryFn: () => loginPolicyApi.getLoginPolicyIdByUserId(userId)
    });

    useEffect(() => {
        if (selectedKeysQuery.data) {
            setTargetKeys(selectedKeysQuery.data)
        }
    }, [selectedKeysQuery.data]);

    if (loginPolicyQuery.isLoading) {
        return <div>Loading...</div>
    }

    let items = loginPolicyQuery.data?.map(item => {
        return {
            key: item.id,
            title: item.name,
            priority: item.priority,
        }
    });

    const onChange = async (nextTargetKeys: Key[], direction: TransferDirection, moveKeys: Key[]) => {
        const nextKeys = nextTargetKeys.map(String);
        const movedKeys = moveKeys.map(String);
        switch (direction) {
            case 'left':
                await loginPolicyApi.unbindLoginPolicy(userId, movedKeys);
                break;
            case 'right':
                await loginPolicyApi.bindLoginPolicy(userId, movedKeys);
                break;
        }
        setTargetKeys(nextKeys);
    };

    return (
        <Transfer
            dataSource={items}
            titles={[t('general.unbound'), t('general.bound')]}
            operations={[t('actions.binding'), t('actions.unbind')]}
            showSearch
            listStyle={{
                width: 250,
                height: 400,
            }}
            targetKeys={targetKeys}
            onChange={onChange}
            render={(item) => item.title + `(${item.priority})`}
        />
    );
};

export default UserLoginPolicy;
