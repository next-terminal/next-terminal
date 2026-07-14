import { baseUrl } from "@/api/core/requests";
import { Button,Form,Input,InputNumber } from 'antd';
import { useState } from 'react';
import { useTranslation } from "react-i18next";

const ToolsTcping = () => {

    let {t} = useTranslation();
    let [host, setHost] = useState('');
    let [port, setPort] = useState<number>(22);
    const [attempts, setAttempts] = useState<number>(4);

    const [logs, setLogs] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    let eventSource: EventSource | null = null;

    const onSearch = (host: string, port: number) => {
        if (running) return; // 防止重复启动
        setRunning(true);
        setLogs([]);

        eventSource = new EventSource(`${baseUrl()}/admin/tools/tcping?host=${host}&port=${port}&attempts=${attempts}`);

        eventSource.onmessage = (event) => {
            setLogs((prevLogs) => [...prevLogs, event.data]);
        };

        eventSource.onerror = () => {
            eventSource?.close();
            setRunning(false);
        };
    }

    return (
        <div className={'flex min-h-[calc(100vh-240px)] flex-col gap-4'}>
            <Form layout="inline" className="w-full">
                <Form.Item
                    label={t('sysops.tools.target')}
                >
                    <Input
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder={t('sysops.tools.target_placeholder')}
                        style={{
                            width: '200px'
                        }}
                    />
                </Form.Item>
                <Form.Item label={t('gateways.port')}>
                    <InputNumber
                        value={port}
                        onChange={(value) => setPort(value ?? 22)}
                        style={{width: '100px'}}
                        min={1}
                        max={65535}
                        precision={0}
                    />
                </Form.Item>
                <Form.Item
                    label={t('sysops.tools.attempts')}
                    tooltip={t('sysops.tools.attempts_tips')}
                >
                    <InputNumber
                        value={attempts}
                        onChange={(value) => setAttempts(value || 4)}
                        min={1}
                        max={100}
                        style={{width: '100px'}}
                    />
                </Form.Item>
                <Form.Item>
                    <Button
                        type={'primary'}
                        disabled={!host || running}
                        onClick={() => onSearch(host, port)}
                    >
                        {t('sysops.tools.testing')}
                    </Button>
                </Form.Item>
            </Form>

            <div className='min-h-0 flex-grow overflow-auto rounded-lg border p-4'>
                <pre className='m-0'>{logs.join("\n")}</pre>
            </div>
        </div>
    );
};

export default ToolsTcping;
