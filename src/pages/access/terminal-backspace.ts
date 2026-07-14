export interface TerminalBackspaceSession {
    attrs?: Record<string, any>;
}

export const BackspaceModeDel = 'del';
export const BackspaceModeBS = 'bs';

export const normalizeTerminalBackspace = (data: string, session?: TerminalBackspaceSession) => {
    if (data === '\x7f' && session?.attrs?.backspaceMode === BackspaceModeBS) {
        return '\b';
    }
    return data;
};
