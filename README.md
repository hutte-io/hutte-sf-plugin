# hutte

CLI for [hutte.io](https://hutte.io)

[![Version](https://img.shields.io/npm/v/hutte.svg)](https://npmjs.org/package/hutte)
[![Downloads/week](https://img.shields.io/npm/dw/hutte.svg)](https://npmjs.org/package/hutte)
[![License](https://img.shields.io/npm/l/hutte.svg)](https://github.com/hutte-io/cli/blob/master/package.json)

## Installation

```sh-session
$ sfdx plugins:install hutte
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

_See code: [src/commands/hutte/auth/login.ts](https://github.com/hutte-io/cli/blob/master/src/commands/hutte/auth/login.ts)_

## `sf hutte org authorize`

authorize a scratch org from hutte.io

```
USAGE
  $ sf hutte org authorize [--json] [-t <value>] [--no-git] [--no-pull]

FLAGS
  -t, --api-token=<value>  the api token. Only needed if you have not previously logged in using `sfdx hutte:auth:login`
  --no-git                 doesn't checkout the scratch org's git branch
  --no-pull                doesn't pull the source code from the scratch org

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/org/authorize.ts](https://github.com/hutte-io/cli/blob/master/src/commands/hutte/org/authorize.ts)_

## `sf hutte org list`

list hutte scratch orgs from current repository

```
USAGE
  $ sf hutte org list [--json] [-t <value>] [--verbose] [--all]

FLAGS
  -t, --api-token=<value>  the api token. Only needed if you have not previously logged in using `sfdx hutte:auth:login`
  --all                    when provided, the output includes all orgs from hutte project, otherwise (by default) only
                           active orgs will be returned
  --verbose                includes all information of scratch org, such as auth url

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/org/list.ts](https://github.com/hutte-io/cli/blob/master/src/commands/hutte/org/list.ts)_

## `sf hutte org terminate`

terminates the default org on Hutte.io and logs out locally

```
USAGE
  $ sf hutte org terminate [--json] [-t <value>]

FLAGS
  -t, --api-token=<value>  the api token. Only needed if you have not previously logged in using `sfdx hutte:auth:login`

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/org/terminate.ts](https://github.com/hutte-io/cli/blob/master/src/commands/hutte/org/terminate.ts)_

## `sf hutte pool take`

take a scratch org from the pool

```
USAGE
  $ sf hutte pool take [--json] [-t <value>] [-n <value>] [-p <value>] [--timeout <value>] [-w]

FLAGS
  -n, --name=<value>        the name of the org
  -p, --project-id=<value>  the id of the project. Useful when multiple projects use the same git repository.
  -t, --api-token=<value>   the api token. Only needed if you have not previously logged in using `sfdx
                            hutte:auth:login`
  -w, --wait                waits until an org becomes available
  --timeout=<value>         the timeout period in seconds.

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [src/commands/hutte/pool/take.ts](https://github.com/hutte-io/cli/blob/master/src/commands/hutte/pool/take.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->

# Debugging your plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command:

1. Start the inspector

If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch:

```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```

Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:

```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
   <br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
   Congrats, you are debugging!
