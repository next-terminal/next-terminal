import {useState} from 'react';
import {Button, Form, Image, Input, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {useLicense} from "@/hook/LicenseContext";
import Disabled from "@/components/Disabled";
import {Upload as UploadIcon} from 'lucide-react';
import {useMobile} from "@/hook/use-mobile";
import {cn} from "@/lib/utils";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";

const {Text} = Typography;

const SystemBasicSetting = ({
                                get,
                                set
                            }: SettingProps) => {
    const {isMobile} = useMobile();
    const {t} = useTranslation();
    const [logo, setLogo] = useState<string>();
    const [form] = Form.useForm();
    const {license} = useLicense();

    const wrapGet = async () => {
        const values = await get();
        setLogo(values['system-logo']);
        return values;
    };

    const wrapSet = (values: any) => {
        values['system-logo'] = logo;
        return set(values);
    };

    const handleUploadRequest = ({
                                     file,
                                     onSuccess
                                 }: any) => {
        const reader = new FileReader();
        if (file) {
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                const imgBase64 = reader.result as string;
                onSuccess(imgBase64);
            };
        }
    };

    const fileInputChange = (event: any) => {
        const file = event.target.files[0];
        handleUploadRequest({
            file,
            onSuccess: (imgBase64: string) => {
                setLogo(imgBase64);
                form.setFieldValue('system-logo', imgBase64);
            }
        });
    };

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/SystemBasicSetting.tsx"], wrapGet, true);

    return <Form form={form} onFinish={wrapSet} layout="vertical">
        <Disabled disabled={!license.hasPremiumFeatures()}>
            <div className={cn('flex gap-6', isMobile ? 'flex-col' : 'items-start')}>
                <div className={cn(isMobile ? 'w-full flex justify-center' : 'w-24 shrink-0')}>
                    <Form.Item name="system-logo" label={t('settings.system.logo')} rules={[{
                        required: true
                    }]}>
                        <div className={cn('logo-upload-container', isMobile && 'flex justify-center')}>
                            <input id={'file'} type={'file'} accept={'.png,.jpg,.jpeg'} style={{
                                display: "none"
                            }} onChange={fileInputChange}/>
                            <div onClick={() => {
                                const fileDom = document.getElementById('file');
                                fileDom?.click();
                            }}
                                 className={cn("logo-preview border border-dashed border-gray-300 rounded-md p-3 cursor-pointer hover:border-blue-400 transition-colors flex flex-col items-center justify-center", isMobile ? "w-24 h-24" : "w-20 h-20")}>
                                {logo ? <Image className="w-full h-full object-contain" src={logo} alt="logo"
                                               preview={false}/> :
                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                        <UploadIcon size={16}/>
                                        <Text type="secondary" className="text-xs">{t('general.upload')}</Text>
                                    </div>}
                            </div>
                        </div>
                    </Form.Item>
                </div>
                <div className="w-full max-w-3xl">
                    <div className={cn('grid gap-x-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                        <div>
                            <Form.Item name="system-name" label={t('settings.system.name')} rules={[{
                                required: true
                            }]}>
                                <Input/>
                            </Form.Item>
                        </div>
                        <div>
                            <Form.Item name="system-icp" label={t('settings.system.icp')}>
                                <Input/>
                            </Form.Item>
                        </div>
                        <div className={cn(!isMobile && 'col-span-2')}>
                            <Form.Item name="system-copyright" label={t('settings.system.copyright')} rules={[{
                                required: true
                            }]}>
                                <Input/>
                            </Form.Item>
                        </div>
                    </div>
                </div>
            </div>

            <Form.Item>
                <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
            </Form.Item>
        </Disabled>
    </Form>;
};

export default SystemBasicSetting;
