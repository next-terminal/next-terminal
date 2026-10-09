---
name: next-terminal-api
description: Manage Next Terminal resources through its HTTP API using an API key. Use for interface discovery, asset queries, and resource creation or updates authorized by the user.
---

# Next Terminal Resource Management API

Install this Skill and `scripts/nt_api.py` in the agent's persistent Skill directory, then load or reload it as required by the framework. The installer saves the instance root URL and token environment variable name in `config.json`; it does not store the API key.

The user creates an `api` token on the account access tokens page and configures `NT_API_KEY` in the agent's persistent environment or secrets settings. Ensure the agent process can read it after restarting or reloading. The key is read from the environment and must not be written to files, URLs, or output. Use `--token-env <variable-name>` for a different environment variable. The client requires only the Python 3 standard library.

## Verify the Installation

Run the installed client from this Skill directory, or use its absolute path from another working directory. Verify connectivity before managing resources:

```sh
python3 scripts/nt_api.py check
python3 scripts/nt_api.py permissions
python3 scripts/nt_api.py assets
python3 scripts/nt_api.py describe --keyword /portal/assets
```

`check` verifies identity and prints only the connection result, account username, and account type. `permissions` reads `/api/account/info` and `/api/license`, returning account type, roles, menus, administrative method/path permissions, and effective license limits. `assets` lists assets authorized for the current account. `describe` retrieves matching interfaces and referenced schemas from the complete `/swagger/doc.json`; visibility in this document does not grant permission to call an interface.

## Required Permission Check

Before discovering or calling business interfaces in each new task, run `permissions`. Repeat it when the account, API key, instance, role permissions, or license changes. If the check fails, stop dependent operations and report the failure; do not assume administrator privileges or try write requests to probe permissions.

- `user`: use the account and portal interfaces appropriate for the task. Never call `/api/admin/*`, even if the complete document lists them. Resource access is limited to the user's authorized resources.
- `admin`: call an administrative operation only when its HTTP method and path match an entry in `permissions`. Paths use `/api` and `:id` parameters; OpenAPI uses `{id}`. Match path segments and methods, not substrings. An empty or absent permissions list does not authorize management operations. Menu visibility or role names alone are not sufficient evidence.
- `super-admin`: role permissions do not restrict administrative operations, but license, resource rules, token type, secondary verification, and the user's task authorization still apply.
- Unknown account types: stop and report that the permission scope cannot be determined.

Read `license.type` before selecting paid functionality. Only `test`, `premium`, and `enterprise` enable premium features. Free instances cannot use SQL work orders, Agent gateways/tokens, gateway groups, authorization strategies, command filters/rules, access policy groups, geodata administration, credential rotation, website response modification, or session sharing. Do not infer paid capability from the presence of an interface. Asset/user limits and parameter-dependent restrictions (such as binding an Agent gateway) remain subject to server validation. Do not request session-only account security operations using an API token.

If the account response lacks `permissions` on an older instance, ordinary-user and super-admin scope can still be determined from `type`, but an administrator must stop management operations until exact permissions are available. Never bypass authorization, switch credentials, or retry writes to discover permissions.

## Call Management APIs

API keys inherit their account's permissions. Administrative endpoints still require the relevant roles and permissions. Preserve the system's authentication and authorization rules.

Authenticate with the `X-Auth-Token` header, without a `Bearer` prefix. The OpenAPI server prefix is `/api`; include it only once in request paths.

Discover the required interface and fields before making a request. Do not guess parameters or expand the user's authorization. Examples:

```sh
python3 scripts/nt_api.py request --path '/api/admin/assets/paging?pageIndex=1&pageSize=10'
python3 scripts/nt_api.py request --method POST --path /api/admin/assets --body-file create-asset.json
```

Populate request body files according to the instance specification and the resources specified by the user. Do not invent asset credentials. Query targets before modifying them and use explicit IDs. Deletion and bulk changes must be within the user's authorized task. The client does not automatically retry write requests, to avoid duplicate resource creation or changes.

## Handle Responses

Successful responses return data directly, without a common `data` wrapper. `201` indicates creation. `202` indicates an accepted background task; query its status according to the interface contract. `204` has no response body.

Report HTTP status on failure and determine the cause from the contract without bypassing permissions. Use an HTTP client suitable for the response type when working with downloads or streaming endpoints.
