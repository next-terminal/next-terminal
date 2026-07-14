import React, { CSSProperties } from 'react';
import { Alert, theme } from 'antd';
import { useTranslation } from "react-i18next";
import {cn} from "@/lib/utils";

export interface Props {
    disabled?: boolean;
    children?: React.ReactNode;
    className?: string;
    style?: CSSProperties;
}

const Disabled = ({disabled, children, className, style}: Props) => {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const disabledStyle: CSSProperties | undefined = disabled ? {
        padding: token.padding,
        border: `1px solid ${token.colorWarningBorder}`,
        borderRadius: token.borderRadius,
        background: token.colorWarningBg
    } : undefined;

    return (
        <div className={cn(disabled && 'transition-colors', className)} style={{...disabledStyle, ...style}}>
            {disabled &&
                <Alert
                    type={'warning'}
                    showIcon={false}
                    style={{marginBottom: token.margin}}
                    title={
                        <>
                            <strong>{t('settings.license.restricted.label')}: </strong>
                            {t('settings.license.restricted.content')}
                            <a className={'ml-1'}
                               target={'_blank'}
                               rel={'noreferrer'}
                               href={'https://www.next-terminal.com/pricing'}>
                                {t('settings.license.restricted.pay')}
                            </a>
                        </>
                    }
                />
            }
            <div
                className={disabled ? 'grayscale opacity-60 pointer-events-none select-none' : undefined}
                inert={disabled ? true : undefined}
                aria-disabled={disabled}>
                {children}
            </div>
        </div>
    );
};

export default Disabled;
