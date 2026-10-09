import assert from 'node:assert/strict';
import test from 'node:test';
import {parseResponse} from '../src/api/core/parse-response.ts';

test('204 返回 undefined，忽略 JSON 内容类型并且不读取响应体', async () => {
    const response = new Response(null, {status: 204, headers: {'Content-Type': 'application/json'}});
    response.json = async () => assert.fail('204 不应尝试解析 JSON');
    response.text = async () => assert.fail('204 不应读取响应体');
    assert.equal(await parseResponse(response), undefined);
});

for (const status of [200, 201, 202]) {
    test(`${status} 正常解析 JSON 数据`, async () => {
        const result = {id: 'resource', statusUrl: '/api/tasks/resource'};
        const response = Response.json(result, {status});
        assert.deepEqual(await parseResponse(response), result);
    });
}

test('保留查询接口的 JSON null', async () => {
    assert.equal(await parseResponse(Response.json(null)), null);
});

test('保留文本响应', async () => {
    assert.equal(await parseResponse(new Response('text')), 'text');
});

test('非法 JSON 仍然报错', async () => {
    await assert.rejects(parseResponse(new Response('{', {headers: {'Content-Type': 'application/json'}})), SyntaxError);
});

test('HTTP 400 登录失败保留异常，本地处理不跳转，全局处理跳转访问拒绝页', async () => {
    const {readFile} = await import('node:fs/promises');
    const {stripTypeScriptTypes} = await import('node:module');
    const {ApiError} = await import('../src/api/core/api-error.ts');
    const original = {fetch: globalThis.fetch, window: globalThis.window, localStorage: globalThis.localStorage};
    const redirects = [];
    try {
        globalThis.localStorage = {removeItem() {}};
        globalThis.window = {location: {
            pathname: '/login', origin: 'https://example.com',
            replace: target => redirects.push(target),
        }};
        // 转换真实请求模块，仅替换 Node 不识别的路径别名。
        let source = await readFile(new URL('../src/api/core/requests.ts', import.meta.url), 'utf8');
        for (const name of ['api-error', 'event-emitter', 'parse-response']) {
            source = source.replace(`@/api/core/${name}`, new URL(`../src/api/core/${name}.ts`, import.meta.url).href);
        }
        const outputText = stripTypeScriptTypes(source);
        const {default: requests} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
        const message = 'your IP address is not allowed to access the system';
        globalThis.fetch = async () => Response.json({code: 10010, message}, {status: 400});
        for (const errorMode of ['local', 'silent']) {
            let succeeded = false;
            await assert.rejects(requests.post('/login', {}, {errorMode}).then(() => {
                succeeded = true;
            }), error => {
                assert.ok(error instanceof ApiError);
                assert.equal(error.status, 400);
                assert.equal(error.code, 10010);
                assert.equal(error.message, message);
                return true;
            });
            assert.equal(succeeded, false);
            assert.deepEqual(redirects, []);
        }
        await assert.rejects(requests.post('/login', {}, {errorMode: 'global'}), ApiError);
        assert.deepEqual(redirects, ['/access-denied?code=10010&from=%2Flogin']);
    } finally {
        Object.assign(globalThis, original);
    }
});
