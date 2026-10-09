#!/usr/bin/env python3
"""Install the Next Terminal Skill and API client in an agent's persistent Skill directory."""
import argparse
import json
from pathlib import Path
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('unexpected redirect while downloading the Skill')


def install(base_url, directory, token_env='NT_API_KEY'):
    base_url = base_url.rstrip('/')
    url = urllib.parse.urlsplit(base_url)
    if url.scheme not in ('http', 'https') or not url.hostname or url.username or url.password or url.path not in ('', '/') or url.query or url.fragment:
        raise RuntimeError('--base-url must be an instance root URL')
    if not token_env.isidentifier():
        raise RuntimeError('--token-env must be an environment variable name')
    target = Path(directory).expanduser().resolve()
    config_path = target / 'config.json'
    if config_path.exists() and json.loads(config_path.read_text()).get('baseUrl') != base_url:
        raise RuntimeError('this Skill directory belongs to another instance; choose a separate --directory')
    opener = urllib.request.build_opener(NoRedirect())
    files = {}
    for name in ['SKILL.md', 'scripts/nt_api.py']:
        with opener.open(base_url + '/agent/next-terminal/' + name, timeout=30) as response:
            data = response.read(1024 * 1024)
        text = data.decode('utf-8')
        if (name == 'SKILL.md' and not text.startswith('---\n')) or (name.endswith('.py') and not text.startswith('#!/usr/bin/env python3')):
            raise RuntimeError('invalid installation file: ' + name)
        files[name] = data
    # Download and validate both files before modifying the installation.
    for name, data in files.items():
        path = target / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    (target / 'config.json').write_text(json.dumps({'baseUrl': base_url, 'tokenEnv': token_env}, indent=2) + '\n')
    print(json.dumps({'installed': True, 'skillDirectory': str(target), 'tokenEnv': token_env,
                      'next': 'Configure the API key in the agent persistent environment, reload the Skill, and run scripts/nt_api.py check and scripts/nt_api.py permissions.'}, indent=2))


if __name__ == '__main__':
    import sys
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--directory', required=True, help='Persistent next-terminal-api directory inside the agent Skill directory')
    parser.add_argument('--token-env', default='NT_API_KEY')
    args = parser.parse_args()
    try:
        install(args.base_url, args.directory, args.token_env)
    except (RuntimeError, OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
