"""Verify client authentication, write responses and contract discovery locally."""
import importlib.util
import json
from pathlib import Path
import threading
import tempfile
import sys
sys.dont_write_bytecode = True
import unittest
from unittest.mock import patch
import io
from http.server import BaseHTTPRequestHandler, HTTPServer

spec = importlib.util.spec_from_file_location('nt_api', Path(__file__).parents[1] / 'public/agent/next-terminal/scripts/nt_api.py')
client = importlib.util.module_from_spec(spec)
spec.loader.exec_module(client)


class ClientTests(unittest.TestCase):
    def test_persistent_skill_installation(self):
        install_spec = importlib.util.spec_from_file_location('nt_install', Path(__file__).parents[1] / 'public/agent/next-terminal/install.py')
        installer = importlib.util.module_from_spec(install_spec)
        install_spec.loader.exec_module(installer)
        source = Path(__file__).parents[1] / 'public/agent/next-terminal'
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_GET(self):
                name = self.path.removeprefix('/agent/next-terminal/')
                data = (source / name).read_bytes()
                self.send_response(200); self.end_headers(); self.wfile.write(data)
        server = HTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                base = f'http://127.0.0.1:{server.server_port}'
                target = Path(directory) / 'next-terminal-api'
                installer.install(base, target)
                self.assertEqual((target / 'SKILL.md').read_bytes(), (source / 'SKILL.md').read_bytes())
                self.assertEqual((target / 'scripts/nt_api.py').read_bytes(), (source / 'scripts/nt_api.py').read_bytes())
                self.assertEqual(json.loads((target / 'config.json').read_text()), {'baseUrl': base, 'tokenEnv': 'NT_API_KEY'})
                installer.install(base, target)
                with self.assertRaisesRegex(RuntimeError, 'another instance'):
                    installer.install('https://other.example.com', target)
        finally:
            server.shutdown(); server.server_close(); thread.join()

    def test_discovery_uses_complete_document(self):
        with patch.object(sys, 'argv', ['nt_api.py', 'describe', '--base-url', 'https://nt.example.com', '--keyword', '/admin']), \
                patch.dict(client.os.environ, {'NT_API_KEY': 'test-key'}), \
                patch.object(client, 'request', return_value={'paths': {}}) as request, \
                patch('sys.stdout', new_callable=io.StringIO):
            client.main()
            request.assert_called_once_with('https://nt.example.com', None, '/swagger/doc.json')

    def test_discovery_requires_api_key(self):
        with patch.object(sys, 'argv', ['nt_api.py', 'describe', '--base-url', 'https://nt.example.com', '--keyword', '/assets']), \
                patch.dict(client.os.environ, {}, clear=True), \
                patch.object(client, 'request') as request:
            with self.assertRaisesRegex(RuntimeError, 'NT_API_KEY is not set'):
                client.main()
            request.assert_not_called()

    def test_permissions_queries_account_and_license(self):
        with patch.object(sys, 'argv', ['nt_api.py', 'permissions', '--base-url', 'https://nt.example.com']), \
                patch.dict(client.os.environ, {'NT_API_KEY': 'test-key'}), \
                patch.object(client, 'request', side_effect=[{'type': 'admin', 'permissions': [{'method': 'GET', 'path': '/api/admin/assets'}]}, {'type': 'free'}]) as request, \
                patch('sys.stdout', new_callable=io.StringIO) as output:
            client.main()
            self.assertEqual([call.args[2] for call in request.call_args_list], ['/api/account/info', '/api/license'])
            result = json.loads(output.getvalue())
            self.assertEqual(result['license']['type'], 'free')
            self.assertEqual(result['permissions'][0]['method'], 'GET')

    def test_contract_discovery_resolves_recursive_references(self):
        contract = {'paths': {'/assets': {'get': {'schema': {'$ref': '#/components/schemas/Asset'}}}, '/unrelated': {}},
                    'components': {'schemas': {'Asset': {'$ref': '#/components/schemas/Group'}, 'Group': {'$ref': '#/components/schemas/Asset'}, 'Unused': {}}}}
        result = client.describe(contract, '/assets')
        self.assertEqual(set(result['paths']), {'/assets'})
        self.assertEqual(set(result['components']['schemas']), {'Asset', 'Group'})

    def test_http_authentication_no_content_and_redirect_rejection(self):
        calls = []
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_GET(self):
                calls.append((self.path, self.headers.get('X-Auth-Token')))
                if self.path == '/redirect':
                    self.send_response(302); self.send_header('Location', '/target'); self.end_headers(); return
                self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
                self.wfile.write(b'{"username":"operator"}')
            def do_DELETE(self):
                calls.append((self.path, self.headers.get('X-Auth-Token')))
                self.send_response(204); self.end_headers()
        server = HTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            base = f'http://127.0.0.1:{server.server_port}'
            self.assertEqual(client.request(base, 'key', '/api/account/info')['username'], 'operator')
            self.assertEqual(client.request(base, 'key', '/api/assets/1', 'DELETE'), {'status': 204})
            with self.assertRaisesRegex(RuntimeError, 'redirect'):
                client.request(base, 'key', '/redirect')
            self.assertEqual(calls, [('/api/account/info', 'key'), ('/api/assets/1', 'key'), ('/redirect', 'key')])
        finally:
            server.shutdown(); server.server_close(); thread.join()


if __name__ == '__main__':
    unittest.main()
