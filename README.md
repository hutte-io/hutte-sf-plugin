# hutte

CLI for [Hutte](https://hutte.io)

[![Version](https://img.shields.io/npm/v/hutte.svg)](https://npmjs.org/package/hutte)
[![Downloads/week](https://img.shields.io/npm/dw/hutte.svg)](https://npmjs.org/package/hutte)
[![License](https://img.shields.io/npm/l/hutte.svg)](https://github.com/hutte-io/hutte-sf-plugin/blob/master/package.json)

## Installation

```sh-session
$ sf plugins install hutte
```

## Commands

<!-- commands -->

- [`sf hutte auth login`](#sf-hutte-auth-login)
- [`sf hutte info`](#sf-hutte-info)
- [`sf hutte org authorize`](#sf-hutte-org-authorize)
- [`sf hutte org list`](#sf-hutte-org-list)
- [`sf hutte org terminate`](#sf-hutte-org-terminate)
- [`sf hutte pool take`](#sf-hutte-pool-take)
- [`sf hutte project list`](#sf-hutte-project-list)
- [`sf hutte project set`](#sf-hutte-project-set)

## `sf hutte auth login`

Authorize your Hutte.io account.

```
USAGE
  $ sf hutte auth login [--json] [--flags-dir <value>] [-e <value>] [-p <value>]

FLAGS
  -e, --email=<value>     The email address of your account on hutte.io.
  -p, --password=<value>  The password of your account on hutte.io.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  $ sf hutte auth login --email john.doe@example.org
```

_See code: [src/commands/hutte/auth/login.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/auth/login.ts)_

## `sf hutte info`

Display information about the current Hutte session.

```
USAGE
  $ sf hutte info [--json] [--flags-dir <value>] [-t <value>]

FLAGS
  -t, --api-token=<value>  Hutte API token for authentication.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  `sf hutte info`

  `sf hutte info --api-token <token>`
```

_See code: [src/commands/hutte/info.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/info.ts)_

## `sf hutte org authorize`

Authorize a scratch org from Hutte.io.

```
USAGE
  $ sf hutte org authorize [--json] [--flags-dir <value>] [-t <value>] [--no-git] [--no-pull] [-n <value>] [-p <value>]

FLAGS
  -n, --org-name=<value>    The name of the org to authorize.
  -p, --project-id=<value>  The ID of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   The API token. Only needed if you have not previously logged in using `sf hutte auth login`.
      --no-git              Doesn't check out the scratch org's git branch.
      --no-pull             Doesn't pull the source code from the scratch org.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/hutte/org/authorize.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/authorize.ts)_

## `sf hutte org list`

List Hutte scratch orgs from the current repository.

```
USAGE
  $ sf hutte org list [--json] [--flags-dir <value>] [-t <value>] [--verbose] [--all] [-p <value>]

FLAGS
  -p, --project-id=<value>  The ID of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   The API token. Only needed if you have not previously logged in using `sf hutte auth login`.
      --all                 When provided, the output includes all orgs from the Hutte project. By default, only active
                            orgs are returned.
      --verbose             Includes all information about the scratch org, such as auth URL.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/hutte/org/list.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/list.ts)_

## `sf hutte org terminate`

Terminates the default org on Hutte.io and logs out locally.

```
USAGE
  $ sf hutte org terminate [--json] [--flags-dir <value>] [-t <value>] [-p <value>]

FLAGS
  -p, --project-id=<value>  The ID of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   The API token. Only needed if you have not previously logged in using `sf hutte auth login`.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/hutte/org/terminate.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/terminate.ts)_

## `sf hutte pool take`

Take a scratch org from the pool.

```
USAGE
  $ sf hutte pool take [--json] [--flags-dir <value>] [-t <value>] [-n <value>] [-p <value>] [--timeout <value>] [-w]

FLAGS
  -n, --name=<value>        The name of the org.
  -p, --project-id=<value>  The ID of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   The API token. Only needed if you have not previously logged in using `sf hutte auth login`.
  -w, --wait                Waits until an org becomes available.
      --timeout=<value>     The timeout period in seconds.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/hutte/pool/take.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/pool/take.ts)_

## `sf hutte project list`

List Hutte projects accessible to the authenticated user.

```
USAGE
  $ sf hutte project list [--json] [--flags-dir <value>] [-t <value>]

FLAGS
  -t, --api-token=<value>  The API token. Only needed if you have not previously logged in using `sf hutte auth login`.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  `sf hutte project list`

  `sf hutte project list --api-token <token>`
```

_See code: [src/commands/hutte/project/list.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/project/list.ts)_

## `sf hutte project set`

List your Hutte projects and set the default for the current directory.

```
USAGE
  $ sf hutte project set [--json] [--flags-dir <value>] [-t <value>] [-p <value>] [--clear] [-g]

FLAGS
  -g, --global              Set or clear the default project globally instead of for the current directory.
  -p, --project-id=<value>  The ID of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   The API token. Only needed if you have not previously logged in using `sf hutte auth login`.
      --clear               Remove the stored default project.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  `sf hutte project set`

  `sf hutte project set --project-id <id>`

  `sf hutte project set --global`

  `sf hutte project set --clear`

  `sf hutte project set --clear --global`
```

_See code: [src/commands/hutte/project/set.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/project/set.ts)_

<!-- commandsstop -->
