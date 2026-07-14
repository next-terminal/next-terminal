import {useEffect, useRef} from 'react';
import {Modal} from 'antd';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import monitoringApi from '@/api/monitoring-api';

const storageKeyPrefix = 'nt-monitor-critical-dismissed:';

export function useGlobalMonitorStatus() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [modal, contextHolder] = Modal.useModal();
    const shownKeyRef = useRef('');

    const query = useQuery({
        queryKey: ['monitoringGlobalStatus'],
        queryFn: monitoringApi.getGlobalStatus,
        refetchInterval: 60000,
        retry: false,
    });

    useEffect(() => {
        const items = query.data?.items?.filter(item => item.status === 'active') || [];
        if (items.length === 0) {
            return;
        }
        const key = items.map(item => `${item.key}:${item.updatedAt}`).join('|');
        if (!key || shownKeyRef.current === key || sessionStorage.getItem(storageKeyPrefix + key)) {
            return;
        }
        shownKeyRef.current = key;

        const content = (
            <div className="space-y-2">
                <div>{t('sysops.monitoring.global_critical_desc')}</div>
                <div className="space-y-1">
                    {items.map(item => (
                        <div key={item.key} className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                            {t(`sysops.monitoring.metrics.${item.metric}`, item.metric)} · {item.target} · {item.currentValue.toFixed(1)}%
                        </div>
                    ))}
                </div>
            </div>
        );

        modal.confirm({
            title: t('sysops.monitoring.global_critical_title'),
            content,
            okText: t('sysops.monitoring.go_monitoring'),
            cancelText: t('sysops.monitoring.remind_later'),
            okButtonProps: {danger: true},
            onOk: () => {
                navigate('/monitoring');
            },
            onCancel: () => {
                sessionStorage.setItem(storageKeyPrefix + key, '1');
            },
        });
    }, [modal, navigate, query.data, t]);

    return {contextHolder};
}
