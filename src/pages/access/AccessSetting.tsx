import {useFormRequest} from "@/hook/use-antd-form-query";
import QuerySelect from "@/components/QuerySelect";
import {useEffect, useState} from 'react';
import {useTranslation} from "react-i18next";
import {CleanTheme, DefaultTerminalTheme, useTerminalTheme} from "@/pages/access/hooks/use-terminal-theme";
import {getAvailableFonts} from "@/utils/utils";
import {App, Button, Checkbox, ConfigProvider, Form, InputNumber} from 'antd';
import accessSettingApi from "@/api/access-setting-api";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useWindowSize} from "react-use";
import {useMutation} from "@tanstack/react-query";

const AccessSetting = () => {
    let {t} = useTranslation();
    const [form] = Form.useForm();
    let {height} = useWindowSize();
    let [terminalTheme, setTerminalTheme] = useTerminalTheme();
    let {message} = App.useApp();
    const [availableFonts, setAvailableFonts] = useState<string[]>([]);
    const [previewFont, setPreviewFont] = useState<string>('');
    const [previewFontSize, setPreviewFontSize] = useState<number>(14);
    const [previewLineHeight, setPreviewLineHeight] = useState<number>(1.2);
    const formCardClassName = 'my-4 flex p-4 border gap-2 rounded';
    const saveMutation = useMutation({
        mutationFn: async (values: Record<string, any>) => {
            let nextValues: Record<string, any> = {
                ...values,
                fontFamily: values['fontFamily'] == 'default' ? DefaultTerminalTheme.fontFamily : values['fontFamily']
            };
            let record: Record<string, string> = {};
            Object.keys(nextValues).forEach(key => {
                record[key] = String(nextValues[key]);
            });
            await accessSettingApi.set(record);
            return nextValues;
        },
        onSuccess: nextValues => {
            setTerminalTheme({
                ...terminalTheme,
                ...nextValues
            });
            message.success(t('general.success'));
        }
    });
    useEffect(() => {
        const loadFonts = async () => {
            try {
                const fonts = await getAvailableFonts();
                setAvailableFonts(fonts);
            } catch (error) {
                console.error('Failed to load fonts:', error);
                setAvailableFonts([]);
            }
        };
        loadFonts();
    }, []);
    const get = async () => {
        let setting = await accessSettingApi.get();
        let cleanTheme = CleanTheme(terminalTheme);
        let fontFamily = cleanTheme.fontFamily;
        if (!setting.fontFamily) {
            setting.fontFamily = fontFamily;
        }
        if (!setting.fontSize) {
            setting.fontSize = cleanTheme.fontSize;
        }
        if (!setting.lineHeight) {
            setting.lineHeight = cleanTheme.lineHeight;
        }
        if (setting.fontFamily == DefaultTerminalTheme.fontFamily) {
            setting.fontFamily = 'default';
        }

        // 初始化预览状态
        setPreviewFont(setting.fontFamily === 'default' ? DefaultTerminalTheme.fontFamily : setting.fontFamily);
        setPreviewFontSize(setting.fontSize);
        setPreviewLineHeight(setting.lineHeight);
        return setting;
    };
    useFormRequest(form, ["form-request", "web/src/pages/access/AccessSetting.tsx"], get, true);
    return <ScrollArea style={{
        height: height - 80
    }}>
        <div className={'m-8'}>
            <div className={'text-lg font-bold'}>{t('menus.setting.label')}</div>

            <div className={'mt-4'}>
                <ConfigProvider theme={{
                    components: {
                        Form: {
                            itemMarginBottom: 0
                        }
                    }
                }}>
                    <Form onFinish={values => saveMutation.mutate(values)} form={form} layout="vertical">
                        <div>{t('access.settings.font')}</div>

                        <div className={formCardClassName}>
                            <Form.Item label={t('access.settings.terminal.font_family')} name="fontFamily" rules={[{
                                required: true
                            }]}>
                                <QuerySelect
                                    onChange={value => {
                                        setPreviewFont(value === 'default' ? DefaultTerminalTheme.fontFamily : value as string);
                                    }}
                                    showSearch={true}
                                    optionFilterProp="value"
                                    options={[{
                                        label: <span style={{fontFamily: DefaultTerminalTheme.fontFamily}}>Default</span>,
                                        value: 'default'
                                    }, ...availableFonts.map(font => {
                                        return {
                                            label: <span style={{fontFamily: font}}>{font}</span>,
                                            value: font
                                        };
                                    })]} style={{
                                    width: 260
                                }}/>
                            </Form.Item>
                            <Form.Item label={t('access.settings.terminal.font_size')} name="fontSize" rules={[{
                                required: true
                            }]}>
                                <InputNumber
                                    onChange={value => {
                                        if (value) {
                                            setPreviewFontSize(Math.trunc(value));
                                        }
                                    }}
                                    min={10}
                                    max={30}
                                    precision={0}
                                    style={{
                                        width: "100%"
                                    }}/>
                            </Form.Item>
                            <Form.Item label={t('access.settings.terminal.line_height')}
                                       name={'lineHeight'}
                                       rules={[{
                                           required: true
                                       }]}
                            >
                                <InputNumber
                                    onChange={value => {
                                        if (value) {
                                            setPreviewLineHeight(value);
                                        }
                                    }}
                                    min={1.0} max={2.0} style={{
                                    width: "100%"
                                }}/>
                            </Form.Item>

                        </div>

                        {/* 字体预览区域 */}
                        <div className={'my-4'}>
                            <div className={'mb-2 font-semibold'}>{t('access.settings.font.preview')}</div>
                            <div className={'p-4 border rounded bg-gray-50 dark:bg-[#141414] overflow-auto'} style={{
                                fontFamily: previewFont,
                                fontSize: `${previewFontSize}px`,
                                lineHeight: previewLineHeight
                            }}>
                                <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                                <div>abcdefghijklmnopqrstuvwxyz</div>
                                <div>0123456789 !@#$%^&*()</div>
                                <div>{'`~-_=+[]{}\\|;:\'",.<>/?'}</div>
                                <div className={'mt-2'}>$ npm install package-name</div>
                                <div>$ ssh user@192.168.1.100</div>
                                <div>$ ps aux | grep node</div>
                            </div>
                        </div>

                        <div>{t('access.settings.mouse.label')}</div>
                        <div className={formCardClassName}>
                            <Form.Item name={'selectionCopy'} valuePropName="checked">
                                <Checkbox>{t('access.settings.mouse.selection_copy')}</Checkbox>
                            </Form.Item>
                            <Form.Item name={'rightClickPaste'} valuePropName="checked">
                                <Checkbox>{t('access.settings.mouse.right_click_paste')}</Checkbox>
                            </Form.Item>
                        </div>

                        <div>{t('access.settings.keyboard.label')}</div>
                        <div className={formCardClassName}>
                            <Form.Item name={'interceptSearchShortcut'} valuePropName="checked">
                                <Checkbox>{t('access.settings.keyboard.intercept_search_shortcut')}</Checkbox>
                            </Form.Item>
                            <Form.Item name={'macOptionIsMeta'} valuePropName="checked">
                                <Checkbox>{t('access.settings.keyboard.mac_option_is_meta')}</Checkbox>
                            </Form.Item>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                                {t('actions.save')}
                            </Button>
                        </Form.Item>
                    </Form>
                </ConfigProvider>
            </div>
        </div>
    </ScrollArea>;
};
export default AccessSetting;
