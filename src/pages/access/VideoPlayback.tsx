import { baseUrl } from "@/api/core/requests";
import sessionApi,{ Session } from "@/api/session-api";
import IPRegion from "@/components/IPRegion";
import times from "@/components/time/times";
import { maybe } from "@/utils/maybe";
import { renderSize } from "@/utils/utils";
import { StyleProvider } from "@ant-design/cssinjs";
import { useQuery } from "@tanstack/react-query";
import { Button,ConfigProvider,Descriptions,Drawer,theme,Tooltip } from "antd";
import { Info } from "lucide-react";
import { useEffect,useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Plyr } from "plyr-react";
import type { PlyrOptions,PlyrSource } from "plyr-react";
import "plyr-react/plyr.css";
import "./VideoPlayback.css";

const playerOptions: PlyrOptions = {
    autoplay: true,
    iconUrl: '/plyr/plyr.svg',
    blankVideo: '/plyr/blank.mp4',
    controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'fullscreen',
    ],
    settings: ['speed'],
    speed: {
        selected: 1,
        options: [0.5, 1, 1.25, 1.5, 2],
    },
    invertTime: false,
    clickToPlay: true,
};

const buildPlayerSource = (src: string): PlyrSource => ({
    type: 'video',
    sources: [
        {
            src,
            type: 'video/mp4',
        },
    ],
});

const VideoPlayback = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const sessionId = maybe(searchParams.get('sessionId'), '');
    const [open, setOpen] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const sessionQuery = useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => sessionApi.getById(sessionId),
        enabled: sessionId !== '',
    });

    const session = sessionQuery.data as Session | undefined;
    const recordingUrl = `${baseUrl()}/admin/sessions/${sessionId}/video-recording`;
    const [playerSource, setPlayerSource] = useState<PlyrSource>(() => buildPlayerSource(recordingUrl));

    useEffect(() => {
        setLoadError(false);
        setPlayerSource(buildPlayerSource(recordingUrl));
    }, [recordingUrl]);

    return (
        <div className="fixed inset-0 overflow-hidden bg-black">
            <div className="video-playback-player h-full w-full">
                <Plyr
                    source={playerSource}
                    options={playerOptions}
                    autoPlay
                    playsInline
                    onError={() => setLoadError(true)}
                />
            </div>

            {loadError && (
                <div className="pointer-events-none fixed inset-x-0 top-6 z-10 flex justify-center">
                    <div className="rounded bg-black/70 px-4 py-2 text-sm text-white">
                        {t('general.failed')}
                    </div>
                </div>
            )}

            <div className="absolute right-5 top-5 z-10">
                <Tooltip title={t('actions.detail')}>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setOpen(true)}
                    >
                        <Info className="h-4 w-4 text-white"/>
                    </Button>
                </Tooltip>
            </div>

            <ConfigProvider theme={{
                algorithm: theme.darkAlgorithm,
                components: {
                    Drawer: {
                        paddingLG: 16,
                    },
                },
            }}>
                <StyleProvider hashPriority="high">
                    <Drawer
                        title={t('actions.detail')}
                        placement="right"
                        onClose={() => setOpen(false)}
                        open={open}
                        mask={false}
                        size={400}
                    >
                        <Descriptions
                            column={1}
                            items={[
                                {
                                    key: 'clientIp',
                                    label: t('audit.client_ip'),
                                    children: <IPRegion ip={session?.clientIp} regionInfo={session?.regionInfo}/>,
                                },
                                {
                                    key: 'userAccount',
                                    label: t('menus.identity.submenus.user'),
                                    children: session?.userAccount,
                                },
                                {
                                    key: 'assetName',
                                    label: t('menus.resource.submenus.asset'),
                                    children: session?.assetName,
                                },
                                {
                                    key: 'addr',
                                    label: t('assets.addr'),
                                    children: session ? `${session.protocol} ${session.username}@${session.ip}:${session.port}` : '',
                                },
                                {
                                    key: 'connectedAt',
                                    label: t('audit.connected_at'),
                                    children: times.format(session?.connectedAt),
                                },
                                {
                                    key: 'disconnectedAt',
                                    label: t('audit.disconnected_at'),
                                    children: times.format(session?.disconnectedAt),
                                },
                                {
                                    key: 'connectionDuration',
                                    label: t('audit.connection_duration'),
                                    children: session?.connectionDuration,
                                },
                                {
                                    key: 'recordingSize',
                                    label: t('audit.video_recording'),
                                    children: renderSize(session?.videoSize),
                                },
                            ]}
                        />
                    </Drawer>
                </StyleProvider>
            </ConfigProvider>
        </div>
    );
};

export default VideoPlayback;
