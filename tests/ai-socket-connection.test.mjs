import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAISocketConnection} from '../src/pages/ai/aiSocketConnection.ts';

function setup(t) {
    t.mock.timers.enable({apis: ['setTimeout']});
    const sockets = [];
    const events = [];
    const stop = createAISocketConnection({
        createSocket: () => {
            const socket = {close() { this.onclose?.(); }};
            sockets.push(socket);
            return socket;
        },
        onConnecting: () => events.push('connecting'),
        onOpen: (_socket, reconnected) => events.push(reconnected ? 'reconnected' : 'open'),
        onClose: () => events.push('closed'),
        onMessage: event => events.push(event.data),
    });
    t.after(stop);
    return {sockets, events, stop};
}

test('断线后重连，并忽略旧连接的迟到事件', t => {
    const {sockets, events} = setup(t);
    sockets[0].onopen();
    sockets[0].onclose();
    t.mock.timers.tick(999);
    assert.equal(sockets.length, 1);
    t.mock.timers.tick(1);
    assert.equal(sockets.length, 2);
    sockets[1].onopen();
    sockets[0].onmessage({data: 'stale'});
    sockets[1].onmessage({data: 'current'});
    assert.deepEqual(events, ['connecting', 'open', 'closed', 'connecting', 'reconnected', 'current']);
});

test('连续失败逐步延长重连间隔，成功后恢复初始间隔', t => {
    const {sockets} = setup(t);
    sockets[0].onclose();
    t.mock.timers.tick(1000);
    sockets[1].onclose();
    t.mock.timers.tick(1999);
    assert.equal(sockets.length, 2);
    t.mock.timers.tick(1);
    sockets[2].onopen();
    sockets[2].onclose();
    t.mock.timers.tick(1000);
    assert.equal(sockets.length, 4);
});

test('关闭组件后取消重连，旧连接不再更新界面', t => {
    const {sockets, events, stop} = setup(t);
    sockets[0].onopen();
    sockets[0].onclose();
    stop();
    t.mock.timers.tick(30_000);
    sockets[0].onopen();
    sockets[0].onmessage({data: 'stale'});
    assert.equal(sockets.length, 1);
    assert.deepEqual(events, ['connecting', 'open', 'closed']);
});
