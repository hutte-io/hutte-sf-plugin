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
* [`sf hutte auth login`](#sf-hutte-auth-login)
* [`sf hutte org authorize`](#sf-hutte-org-authorize)
* [`sf hutte org list`](#sf-hutte-org-list)
* [`sf hutte org terminate`](#sf-hutte-org-terminate)
* [`sf hutte pool take`](#sf-hutte-pool-take)

## `sf hutte auth login`

authorize your hutte-io account

```
USAGE
  $ sf hutte auth login [--json] [-e <value>] [-p <value>]

FLAGS
  -e, --email=<value>     the email address of your account on hutte.io
  -p, --password=<value>  the password of your account on hutte.io

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sf hutte auth login --email john.doe@example.org
```

_See code: [src/commands/hutte/auth/login.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/master/src/commands/hutte/auth/login.ts)_

## `sf hutte org authorize`

authorize a scratch org from hutte.io

```
USAGE
  $ sf hutte org authorize [--json] [-t <value>] [--no-git] [--no-pull] [-n <value>]

FLAGS
  -n, --org-name=<value>   the name of the org to authorize
  -t, --api-token=<value>  the api token. Only needed if you have not previously logged in using `sf hutte auth login`
  --no-git                 doesn't checkout the scratch org's git branch
  --no-pull                doesn't pull the source code from the scratch org

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/org/authorize.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/master/src/commands/hutte/org/authorize.ts)_

## `sf hutte org list`

list hutte scratch orgs from current repository

```
USAGE
  $ sf hutte org list [--json] [-t <value>] [--verbose] [--all]

FLAGS
  -t, --api-token=<value>  the api token. Only needed if you have not previously logged in using `sf hutte auth login`
  --all                    when provided, the output includes all orgs from hutte project, otherwise (by default) only
                           active orgs will be returned
  --verbose                includes all information of scratch org, such as auth url

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/org/list.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/master/src/commands/hutte/org/list.ts)_

## `sf hutte org terminate`

terminates the default org on Hutte.io and logs out locally

```
USAGE
  $ sf hutte org terminate [--json] [-t <value>]

FLAGS
  -t, --api-token=<value>  the api token. Only needed if you have not previously logged in using `sf hutte auth login`

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/org/terminate.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/master/src/commands/hutte/org/terminate.ts)_

## `sf hutte pool take`

take a scratch org from the pool

```
USAGE
  $ sf hutte pool take [--json] [-t <value>] [-n <value>] [-p <value>] [--timeout <value>] [-w]

FLAGS
  -n, --name=<value>        the name of the org
  -p, --project-id=<value>  the id of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   the api token. Only needed if you have not previously logged in using `sf hutte auth login`
  -w, --wait                waits until an org becomes available
  --timeout=<value>         the timeout period in seconds.

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/pool/take.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/master/src/commands/hutte/pool/take.ts)_
<!-- commandsstop -->
