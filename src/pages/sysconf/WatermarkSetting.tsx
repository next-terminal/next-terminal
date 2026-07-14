import {useState} from "react";
import {Button, Checkbox, ColorPicker, ColorPickerProps, Form, Input, Slider, Switch, theme} from "antd";
import {useTranslation} from "react-i18next";
import {generate, green, presetPalettes, red} from "@ant-design/colors";
import {Color} from "antd/es/color-picker";
import {useLicense} from "@/hook/LicenseContext";
import Disabled from "@/components/Disabled";
import {useMobile} from "@/hook/use-mobile";
import {cn} from "@/lib/utils";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";

type Presets = Required<ColorPickerProps>['presets'][number];

const genPresets = (presets = presetPalettes) => Object.entries(presets).map<Presets>(([label, colors]) => ({
    label,
    colors
}));

const isTruthy = (value: any) => value === true || `${value}`.toLowerCase() === 'true';

const WatermarkSetting = ({
                              get,
                              set
                          }: SettingProps) => {
    const {isMobile} = useMobile();
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const {license} = useLicense();
    const {token} = theme.useToken();
    const [watermarkEnabled, setWatermarkEnabled] = useState(false);
    const [watermarkFontColor, setWatermarkFontColor] = useState('');
    const presets = genPresets({
        primary: generate(token.colorPrimary),
        red,
        green
    });

    const wrapGet = async () => {
        const values = await get();
        setWatermarkFontColor(values['watermark-font-color']);
        setWatermarkEnabled(isTruthy(values['watermark-enabled']));
        return values;
    };

    const wrapSet = (values: any) => {
        values['watermark-font-color'] = watermarkFontColor;
        return set(values);
    };

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/WatermarkSetting.tsx"], wrapGet, true);

    return <Form form={form} onFinish={wrapSet} layout="vertical">
        <Disabled disabled={!license.hasPremiumFeatures()} className={'mb-4'}>
            <Form.Item
                name="watermark-enabled"
                label={t("identity.user.watermark")}
                required={true}
                valuePropName="checked"
                extra={t('settings.system.watermark.enabled_tip')}
            >
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')} onChange={setWatermarkEnabled}/>
            </Form.Item>
            <div className={cn('flex gap-4', isMobile ? 'flex-col' : 'items-center flex-wrap')}>
                <Form.Item name="watermark-content" label={t('settings.system.watermark.content')} required={true}>
                    <Input disabled={!watermarkEnabled} style={{
                        width: isMobile ? 'xl' : undefined
                    }}/>
                </Form.Item>
                <div className={cn('flex gap-4', isMobile ? 'flex-col' : 'items-center')}>
                    <Form.Item
                        name="watermark-content-user-account"
                        label={t('settings.system.watermark.append_user')}
                        valuePropName="checked"
                    >
                        <Checkbox disabled={!watermarkEnabled}/>
                    </Form.Item>
                    <Form.Item
                        name="watermark-content-asset-username"
                        label={t('settings.system.watermark.append_asset')}
                        valuePropName="checked"
                    >
                        <Checkbox disabled={!watermarkEnabled}/>
                    </Form.Item>
                </div>
                <Form.Item name="watermark-font-color" label={t('settings.system.watermark.font_color')} required={true}>
                    <ColorPicker disabled={!watermarkEnabled} presets={presets} onChange={(color: Color) => {
                        const rgba = color.toRgb();
                        setWatermarkFontColor(`rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`);
                    }}/>
                </Form.Item>
            </div>

            <div className={cn(isMobile ? 'w-full' : 'w-1/2')}>
                <Form.Item name="watermark-font-size" label={t('settings.system.watermark.font_size')} required={true}>
                    <Slider disabled={!watermarkEnabled} min={1} max={100}/>
                </Form.Item>
            </div>

            <Form.Item>
                <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
            </Form.Item>
        </Disabled>
    </Form>;
};

export default WatermarkSetting;
