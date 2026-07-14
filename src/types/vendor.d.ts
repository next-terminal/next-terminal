declare module '@dushixiang/guacamole-common-js' {
    namespace Guacamole {
        class Status {
            [key: string]: any;
        }
        namespace Tunnel {
            enum State {
                CONNECTING,
                OPEN,
                CLOSED,
                UNSTABLE,
            }
        }
        class WebSocketTunnel {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class StaticHTTPTunnel {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class InputStream {
            [key: string]: any;
        }
        class OutputStream {
            [key: string]: any;
        }
        class StringReader {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class BlobReader {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class BlobWriter {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class StringWriter {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class InputSink {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class Display {
            [key: string]: any;
        }
        class Layer {
            [key: string]: any;
        }
        class Client {
            constructor(...args: any[]);
            [key: string]: any;
        }
        namespace Client {
            type State = any;
        }
        class Keyboard {
            constructor(...args: any[]);
            [key: string]: any;
        }
        class Mouse {
            static Touchpad: any;
            constructor(...args: any[]);
            [key: string]: any;
        }
        namespace Mouse {
            type State = any;
            type Touchpad = any;
        }
        class SessionRecording {
            constructor(...args: any[]);
            [key: string]: any;
        }
    }

    const Guacamole: any;
    export default Guacamole;
}

declare module 'asciinema-player' {
    interface Player {
        dispose(): void;
    }

    export function create(src: string, element: HTMLElement | null, options?: Record<string, unknown>): Player;
}
