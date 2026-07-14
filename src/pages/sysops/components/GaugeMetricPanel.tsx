import {Tag} from "antd";
import type {ReactNode} from "react";
import {memo, useId} from "react";

export type GaugeStatus = "ok" | "warning" | "critical";

export interface GaugeMetricPanelProps {
    icon: ReactNode;
    title: string;
    value: number;
    subTitle: string;
    statusText: Record<GaugeStatus, string>;
    extra?: ReactNode;
    warningThreshold?: number;
    criticalThreshold?: number;
}

const GAUGE_ARC_PATH = "M 22 84 A 68 68 0 0 1 158 84";
const GAUGE_VIEW_BOX = "0 0 180 104";
const GAUGE_BASELINE_Y = 84;
// gap 必须明显大于 pathLength(100)，避免 dash 图案在路径终点处循环产生多余的圆头
const GAUGE_DASH_GAP = 1000;

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value || 0)));

const getGaugeState = (
    value: number,
    warningThreshold: number,
    criticalThreshold: number,
) => {
    const normalized = clampPercent(value);
    if (normalized >= criticalThreshold) {
        return {normalized, color: "#ef4444", status: "critical" as GaugeStatus};
    }
    if (normalized >= warningThreshold) {
        return {normalized, color: "#f59e0b", status: "warning" as GaugeStatus};
    }
    return {normalized, color: "#1677ff", status: "ok" as GaugeStatus};
};

const statusToTagColor = (status: GaugeStatus) => {
    switch (status) {
        case "critical":
            return "error";
        case "warning":
            return "warning";
        default:
            return "success";
    }
};

const hasExtraContent = (extra: ReactNode) =>
    Array.isArray(extra) ? extra.length > 0 : Boolean(extra);

const GaugeMetricPanel = ({
                              icon,
                              title,
                              value,
                              subTitle,
                              statusText,
                              extra,
                              warningThreshold = 70,
                              criticalThreshold = 90,
                          }: GaugeMetricPanelProps) => {
    const clipId = useId();
    const {normalized, color, status} = getGaugeState(value, warningThreshold, criticalThreshold);

    return (
        <div className="h-full rounded-lg border border-gray-100 p-4 dark:border-gray-800">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-medium">{title}</div>
                        <div className="truncate text-xs text-gray-500">{subTitle}</div>
                    </div>
                </div>
                <Tag color={statusToTagColor(status)} className="shrink-0">
                    {statusText[status]}
                </Tag>
            </div>

            <div className="mt-4 flex justify-center">
                <svg
                    aria-label={`${title} ${normalized}%`}
                    className="h-28 w-full max-w-[220px]"
                    role="img"
                    viewBox={GAUGE_VIEW_BOX}
                >
                    <defs>
                        <clipPath id={clipId}>
                            {/* 裁掉基线以下部分，消除圆角端点在竖直切线处的溢出 */}
                            <rect x={0} y={0} width={180} height={GAUGE_BASELINE_Y} />
                        </clipPath>
                    </defs>
                    <g clipPath={`url(#${clipId})`}>
                        <path
                            className="text-gray-200 dark:text-gray-800"
                            d={GAUGE_ARC_PATH}
                            fill="none"
                            pathLength={100}
                            stroke="currentColor"
                            strokeLinecap="butt"
                            strokeWidth={14}
                        />
                        {normalized > 0 && (
                            <path
                                d={GAUGE_ARC_PATH}
                                fill="none"
                                pathLength={100}
                                stroke={color}
                                // gap 远大于剩余路径长度，避免 dash 图案在路径终点处
                                // 触发新一轮循环，从而产生多余的圆形描边端点
                                strokeDasharray={`${normalized} ${GAUGE_DASH_GAP}`}
                                strokeLinecap="butt"
                                strokeWidth={14}
                            />
                        )}
                    </g>
                    <text
                        aria-hidden="true"
                        className="text-gray-950 dark:text-gray-100"
                        dominantBaseline="middle"
                        fill="currentColor"
                        fontSize={26}
                        fontWeight={600}
                        textAnchor="middle"
                        x={90}
                        y={66}
                    >
                        {normalized}%
                    </text>
                </svg>
            </div>

            {hasExtraContent(extra) && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 [&>div]:min-w-0 [&>div]:truncate [&>div]:rounded [&>div]:bg-gray-50 [&>div]:px-3 [&>div]:py-2 dark:[&>div]:bg-gray-900">
                    {extra}
                </div>
            )}
        </div>
    );
};

export default memo(GaugeMetricPanel);