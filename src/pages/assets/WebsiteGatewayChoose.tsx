import type {GatewayHop} from "@/api/gateway-chain";
import websiteApi from "@/api/website-api";
import {useLicense} from "@/hook/LicenseContext";
import GatewayChainEditor from "@/pages/assets/components/GatewayChainEditor";
import {App, Button, Drawer, Form, Space} from "antd";
import {useEffect} from 'react';
import {useTranslation} from "react-i18next";

interface Props {
    resourceIds: string[];
    open: boolean;
    onClose: () => void;
}

const WebsiteGatewayChoose = ({resourceIds, open, onClose}: Props) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm<{ gatewayChain: GatewayHop[] }>();
    const {license, isLoading: licenseLoading} = useLicense();
    const hasPremiumFeatures = !licenseLoading && license.hasPremiumFeatures();

    useEffect(() => {
        if (open) {
            form.setFieldsValue({gatewayChain: []});
        }
    }, [open, form]);

    const handleSubmit = async () => {
        if (!hasPremiumFeatures) {
            return;
        }
        const values = await form.validateFields();
        await websiteApi.changeGateway({
            websiteIds: resourceIds,
            gatewayChain: values.gatewayChain || [],
        });

        message.success(t('general.success'));
        onClose();
    };

    return (
        <Drawer
            title={t('assets.change_gateway')}
            onClose={onClose}
            open={open}
            size={480}
        >
            <Form form={form} layout="vertical" initialValues={{gatewayChain: []}}>
                <Space direction="vertical" className="w-full" size="large">
                    <GatewayChainEditor disabled={!hasPremiumFeatures}/>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        disabled={!hasPremiumFeatures}
                        className="w-full"
                    >
                        {t('actions.confirm')}
                    </Button>
                </Space>
            </Form>
        </Drawer>
    );
};

export default WebsiteGatewayChoose;
