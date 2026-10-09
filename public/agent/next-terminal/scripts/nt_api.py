#!/usr/bin/env python3
"""Next Terminal resource management HTTP client (Python 3 standard library)."""
import argparse
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('unexpected redirect; check the instance base URL')


def request(base, token, path, method='GET', body=None):
    if not path.startswith('/') or path.startswith('//') or urllib.parse.urlsplit(path).fragment:
        raise RuntimeError('path must be an absolute API path on the configured instance')
    data = json.dumps(body).encode() if body is not None else None
    headers = {'Accept': 'application/json'}
    if token:
        headers['X-Auth-Token'] = token
    if data is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=30) as response:
            if response.status == 204:
                return {'status': 204}
            if 'json' not in response.headers.get('Content-Type', ''):
                raise RuntimeError('expected a JSON response; use an appropriate client for downloads or streams')
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Do not echo remote responses, which might contain credentials.
        raise RuntimeError(f'API request failed with HTTP {error.code}: {method} {path}') from None


def describe(spec, keyword):
    matches = {p: methods for p, methods in spec['paths'].items()
               if keyword.lower() in (p + json.dumps(methods, ensure_ascii=False)).lower()}
    schemas = spec.get('components', {}).get('schemas', {})
    selected = {}
    pending = re.findall(r'#/components/schemas/([^"\s]+)', json.dumps(matches))
    while pending:
        name = pending.pop()
        if name in selected or name not in schemas:
            continue
        selected[name] = schemas[name]
        pending.extend(re.findall(r'#/components/schemas/([^"\s]+)', json.dumps(schemas[name])))
    return {'servers': spec.get('servers'), 'paths': matches,
            'components': {'schemas': selected, 'securitySchemes': spec.get('components', {}).get('securitySchemes', {})}}


def main():
    config_path = Path(__file__).resolve().parents[1] / 'config.json'
    config = json.loads(config_path.read_text()) if config_path.exists() else {}
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['check', 'assets', 'describe', 'permissions', 'request'])
    parser.add_argument('--base-url', default=os.getenv('NT_BASE_URL') or config.get('baseUrl', ''))
    parser.add_argument('--token-env', default=config.get('tokenEnv', 'NT_API_KEY'))
    parser.add_argument('--keyword', default='')
    parser.add_argument('--path', default='')
    parser.add_argument('--method', choices=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default='GET')
    parser.add_argument('--body-file', help='JSON request body file; kept local')
    args = parser.parse_args()
    base = args.base_url.rstrip('/')
    parts = urllib.parse.urlsplit(base)
    if parts.scheme not in ('http', 'https') or not parts.hostname or parts.username or parts.password or parts.query or parts.fragment or parts.path not in ('', '/'):
        raise RuntimeError('--base-url must be an instance root URL, such as https://nt.example.com')
    token = os.getenv(args.token_env)
    if not token:
        raise RuntimeError(f'environment variable {args.token_env} is not set')
    if args.action == 'describe':
        if not args.keyword.strip():
            raise RuntimeError('--keyword is required for interface discovery')
        result = describe(request(base, None, '/swagger/doc.json'), args.keyword)
    elif args.action == 'check':
        info = request(base, token, '/api/account/info')
        result = {'connected': True, 'username': info.get('username'), 'type': info.get('type')}
    elif args.action == 'permissions':
        info = request(base, token, '/api/account/info')
        license_info = request(base, token, '/api/license')
        result = {name: info.get(name) for name in ('type', 'roles', 'menus', 'permissions')}
        result['license'] = {name: license_info.get(name) for name in ('type', 'expired', 'asset', 'user')}
    elif args.action == 'assets':
        result = request(base, token, '/api/portal/assets?type=asset')
    else:
        if not args.path.startswith('/api/'):
            raise RuntimeError('--path must start with /api/')
        body = None
        if args.body_file:
            with open(args.body_file, encoding='utf-8') as file:
                body = json.load(file)
        result = request(base, token, args.path, args.method, body)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
