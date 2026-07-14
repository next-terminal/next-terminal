import { baseWebSocketUrl } from "@/api/core/requests";
import { Message,MessageTypeData } from "@/pages/access/Terminal";
import { maybe } from "@/utils/maybe";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import qs from "qs";
import { useEffect } from 'react';
import { useSearchParams } from "react-router-dom";

const TerminalMonitor = () => {

    const [searchParams, _setSearchParams] = useSearchParams();
    let sessionId = maybe(searchParams.get('sessionId'), '');

    const writeErrorMessage = (term: Terminal, message: string) => {
        term.writeln(`\x1B[1;3;31m${message}\x1B[0m `);
    }

    const init = (term: Terminal, sessionId: string) => {
        let elementTerm = document.getElementById('terminal');
        if (!elementTerm) {
            return
        }
        term.open(elementTerm);
        let fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddon.fit();
        term.focus();

        term.writeln('trying to connect to the server ...');
        let cols = term.cols;
        let rows = term.rows;
        let params = {
            'cols': cols,
            'rows': rows,
            'sessionId': sessionId,
        };

        let paramStr = qs.stringify(params);

        let websocket = new WebSocket(`${baseWebSocketUrl()}/admin/sessions/${sessionId}/terminal-monitor?${paramStr}`);
        websocket.onopen = (_e => {
            term.clear();
        });

        websocket.onerror = (_e) => {
            writeErrorMessage(term, `websocket error`);
        }

        websocket.onclose = (_e) => {
            writeErrorMessage(term, `connection is closed.`);
        }

        websocket.onmessage = (e) => {
            let msg = Message.parse(e.data);
            switch (msg.type) {
                case MessageTypeData:
                    term.write(msg.content);
                    break;
            }
        }
        return websocket;
    }

    useEffect(() => {
        let term = new Terminal({
            fontFamily: 'monaco, Consolas, "Lucida Console", monospace',
            fontSize: 15,
            theme: {
                background: '#141414'
            },
        });

        let websocket = init(term, sessionId);

        return () => {
            term.dispose();
            if (websocket) {
                websocket.close(3886, 'client quit');
            }
        }

    }, []);

    return (
        <div id='terminal'
             style={{
                 overflow: 'hidden',
                 padding: 8,
                 backgroundColor: '#141414',
             }}
             className={'h-screen w-screen'}
        />
    );
};

export default TerminalMonitor;