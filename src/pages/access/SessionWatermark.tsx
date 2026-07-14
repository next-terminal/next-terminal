import {SessionWatermark as SessionWatermarkConfig} from "@/api/session-api";
import {Watermark} from "watermark-js-plus";
import {useEffect,useRef} from "react";
import type {CSSProperties} from "react";

interface Props {
    watermark?: SessionWatermarkConfig;
    className?: string;
    style?: CSSProperties;
    zIndex?: number;
}

const getWatermarkContent = (content?: string[] | string) => {
    if (Array.isArray(content)) {
        const items = content.filter((item) => item.trim().length > 0);
        return items.length > 0 ? items.join('\n') : undefined;
    }
    if (typeof content === 'string' && content.trim().length > 0) {
        return content;
    }
    return undefined;
};

const SessionWatermark = ({watermark, className, style, zIndex = 9}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const watermarkRef = useRef<Watermark | null>(null);
    const content = getWatermarkContent(watermark?.content);
    const enabled = watermark?.enabled === true
        && !!content
        && Number.isFinite(watermark.size)
        && watermark.size > 0;

    useEffect(() => {
        watermarkRef.current?.destroy();
        watermarkRef.current = null;

        if (!enabled || !containerRef.current || !content) {
            return;
        }

        let destroyed = false;
        const instance = new Watermark({
            parent: containerRef.current,
            content,
            contentType: 'multi-line-text',
            width: 300,
            height: 180,
            rotate: -22,
            globalAlpha: 1,
            zIndex,
            fontColor: watermark?.color || 'rgba(230, 244, 255, 0.2)',
            fontSize: `${watermark?.size}px`,
            lineHeight: Math.max((watermark?.size || 0) * 1.6, (watermark?.size || 0) + 6),
            textRowMaxWidth: 260,
        });

        watermarkRef.current = instance;
        instance.create()
            .then(() => {
                if (destroyed) {
                    instance.destroy();
                }
            })
            .catch((e) => {
                console.error('create session watermark failed', e);
            });

        return () => {
            destroyed = true;
            instance.destroy();
            if (watermarkRef.current === instance) {
                watermarkRef.current = null;
            }
        };
    }, [content, enabled, watermark?.color, watermark?.size, zIndex]);

    if (!enabled) {
        return null;
    }

    return (
        <div
            aria-hidden
            ref={containerRef}
            className={className}
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex,
                ...style,
            }}
        />
    );
};

export default SessionWatermark;
