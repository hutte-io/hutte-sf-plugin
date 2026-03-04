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
- [`sf hutte org authorize`](#sf-hutte-org-authorize)
- [`sf hutte org create scratch`](#sf-hutte-org-create-scratch)
- [`sf hutte org list`](#sf-hutte-org-list)
- [`sf hutte org resume scratch`](#sf-hutte-org-resume-scratch)
- [`sf hutte org terminate`](#sf-hutte-org-terminate)
- [`sf hutte pool take`](#sf-hutte-pool-take)

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

## `sf hutte org authorize`

Authorize a scratch org from Hutte.io.

```
USAGE
  $ sf hutte org authorize [--json] [--flags-dir <value>] [-t <value>] [--no-git] [--no-pull] [-n <value>]

FLAGS
  -n, --org-name=<value>   The name of the org to authorize.
  -t, --api-token=<value>  The API token. Only needed if you have not previously logged in using `sf hutte auth login`.
      --no-git             Doesn't check out the scratch org's git branch.
      --no-pull            Doesn't pull the source code from the scratch org.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/hutte/org/authorize.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/authorize.ts)_

## `sf hutte org create scratch`

Create a scratch org via Hutte.

```
USAGE
  $ sf hutte org create scratch -n <value> [--json] [--flags-dir <value>] [--async] [-w <value>] [-b <value>] [--branch
    <value>] [-y <value>] [-c] [-m] [--issue <value>] [--notes <value>] [-f <value>] [--no-git] [--no-pull] [-t <value>]
    [-p <value>]

FLAGS
  -b, --initial-branch=<value>   Source branch used to push (deploy) code to the org.
  -c, --no-ancestors             Do not include second-generation managed package (2GP) ancestors.
  -f, --definition-file=<value>  Path to a scratch org definition JSON file.
  -m, --no-namespace             Create the scratch org with no namespace, even if the Dev Hub has a namespace.
  -n, --name=<value>             (required) Name for the scratch org.
  -p, --project-id=<value>       The ID of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>        The API token. Only needed if you have not previously logged in using `sf hutte auth
                                 login`.
  -w, --wait=<value>             [default: 10] Number of minutes to wait for the scratch org to be ready.
  -y, --duration-days=<value>    [default: 7] Number of days until the scratch org expires (1-30).
      --async                    Do not wait for the scratch org to be ready.
      --branch=<value>           Feature/dev branch name created from the initial branch.
      --issue=<value>            Link to the related issue in your issue tracking tool (e.g., Jira, Linear).
      --no-git                   Doesn't check out the scratch org's git branch.
      --no-pull                  Doesn't pull the source code from the scratch org.
      --notes=<value>            Notes for the scratch org.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Create a scratch org via Hutte.

  Creates a new scratch org for the current project. By default, the command waits for the org to be ready and
  authenticates with the SF CLI.

  Use --async to return immediately without waiting (you can resume later with `sf hutte org resume scratch`).

EXAMPLES
  Create a scratch org and wait for it to be ready:

    $ sf hutte org create scratch --name "My Feature Org"

  Create a scratch org asynchronously:

    $ sf hutte org create scratch --name "Quick Test" --async

  Create a scratch org with initial branch and feature branch:

    $ sf hutte org create scratch --name "Feature Org" --initial-branch main --branch feature/my-feature

  Create a scratch org without ancestors or namespace:

    $ sf hutte org create scratch --name "Clean Org" --no-ancestors --no-namespace

  Create a scratch org with a custom definition file:

    $ sf hutte org create scratch --name "Custom Org" --definition-file config/project-scratch-def.json
```

_See code: [src/commands/hutte/org/create/scratch.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/create/scratch.ts)_

## `sf hutte org list`

List Hutte scratch orgs from the current repository.

```
USAGE
  $ sf hutte org list [--json] [--flags-dir <value>] [-t <value>] [--verbose] [--all]

FLAGS
  -t, --api-token=<value>  The API token. Only needed if you have not previously logged in using `sf hutte auth login`.
      --all                When provided, the output includes all orgs from the Hutte project. By default, only active
                           orgs are returned.
      --verbose            Includes all information about the scratch org, such as auth URL.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/hutte/org/list.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/list.ts)_

## `sf hutte org resume scratch`

Resume waiting for a scratch org that was created asynchronously.

```
USAGE
  $ sf hutte org resume scratch -i <value> [--json] [--flags-dir <value>] [-w <value>] [--no-git] [--no-pull] [-t
  <value>]

FLAGS
  -i, --scratch-org-id=<value>  (required) ID of the scratch org to resume.
  -t, --api-token=<value>       The API token. Only needed if you have not previously logged in using `sf hutte auth
                                login`.
  -w, --wait=<value>            [default: 10] Number of minutes to wait for the scratch org to be ready.
      --no-git                  Doesn't check out the scratch org's git branch.
      --no-pull                 Doesn't pull the source code from the scratch org.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Resume waiting for a scratch org that was created asynchronously.

  Polls for the status of a scratch org until it reaches a terminal state (active, failed, setup_failed, push_failed).
  When the org becomes active, it authenticates with the SF CLI.

  Use this command after creating a scratch org with `sf hutte org create --async`.

EXAMPLES
  Resume waiting for a scratch org:

    $ sf hutte org resume scratch --scratch-org-id abc-123

  Resume with a longer timeout:

    $ sf hutte org resume scratch --scratch-org-id abc-123 --wait 30
```

_See code: [src/commands/hutte/org/resume/scratch.ts](https://github.com/hutte-io/hutte-sf-plugin/blob/main/src/commands/hutte/org/resume/scratch.ts)_

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

<!-- commandsstop -->
