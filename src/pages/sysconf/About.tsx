import {useTranslation} from "react-i18next";
import {useQuery} from "@tanstack/react-query";
import brandingApi from "@/api/branding-api";
import propertyApi from "@/api/property-api";
import {useMobile} from "@/hook/use-mobile";
import {cn} from "@/lib/utils";
import {VersionInfo} from "@/components/VersionInfo";

const CHANGELOG_URL = 'https://www.next-terminal.com/changelog';

const About = () => {

    const {isMobile} = useMobile();
    const {t} = useTranslation();

    let brandingQuery = useQuery({
        queryKey: ['branding'],
        queryFn: brandingApi.getBranding,
    });

    let versionQuery = useQuery({
        queryKey: ['version'],
        queryFn: propertyApi.getLatestVersion,
    });

    return (
        <div>
            <div className={'flex flex-col gap-4'}>
                <div className={cn(
                    'space-y-4',
                    isMobile && 'w-full px-2'
                )}>
                    <div className={cn(
                        'flex flex-col gap-1',
                        isMobile ? 'text-left' : 'text-left'
                    )}>
                        <VersionInfo
                            label={t('settings.about.current_version')}
                            isPending={brandingQuery.isPending}
                            error={brandingQuery.error}
                            value={brandingQuery.data?.version}
                            errorText={t('error')}
                            isMobile={isMobile}
                        />
                        <VersionInfo
                            label={t('settings.about.latest_version')}
                            isPending={versionQuery.isPending}
                            error={versionQuery.error}
                            value={versionQuery.data?.latestVersion}
                            errorText={t('error')}
                            isMobile={isMobile}
                        />
                        <div className={cn('font-bold', isMobile && 'text-sm')}>
                            {t('settings.about.update_content')}:
                            <a
                                href={CHANGELOG_URL}
                                target="_blank"
                                rel="noreferrer"
                                className={'mt-2 block text-base font-medium text-blue-500 hover:text-blue-600'}
                            >
                                {CHANGELOG_URL}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
