import type {RegionInfo} from "@/api/region-info";
import {Typography} from "antd";
import {useTranslation} from "react-i18next";

interface IPRegionProps {
    ip?: string;
    regionInfo?: RegionInfo;
}

export const localizedRegion = (regionInfo: RegionInfo | undefined, language: string) => {
    const names = regionInfo?.names;
    if (!names) {
        return '';
    }
    const localized = names[language]?.trim();
    if (localized) {
        return localized;
    }
    for (const fallbackLang of ['zh-CN', 'zh-TW', 'en-US', 'ja-JP']) {
        const value = names[fallbackLang]?.trim();
        if (value) {
            return value;
        }
    }
    return Object.values(names).find(value => value?.trim())?.trim() ?? '';
};

const IPRegion = ({ip, regionInfo}: IPRegionProps) => {
    const {i18n} = useTranslation();
    const region = localizedRegion(regionInfo, i18n.language);

    return (
        <div style={{display: 'grid', gap: 2, minWidth: 0}}>
            <Typography.Text style={{whiteSpace: 'nowrap'}}>{ip || '-'}</Typography.Text>
            {region && <Typography.Text type="secondary" style={{whiteSpace: 'nowrap'}}>{region}</Typography.Text>}
        </div>
    );
};

export default IPRegion;
