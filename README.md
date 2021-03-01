hutte
=====

CLI for [hutte.io](https://hutte.io)

[![Version](https://img.shields.io/npm/v/hutte.svg)](https://npmjs.org/package/hutte)
[![CircleCI](https://circleci.com/gh/hutte-io/cli/tree/master.svg?style=shield)](https://circleci.com/gh/hutte-io/cli/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/hutte-io/cli?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/cli/branch/master)
[![Codecov](https://codecov.io/gh/hutte-io/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/hutte-io/cli)
[![Greenkeeper](https://badges.greenkeeper.io/hutte-io/cli.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/hutte-io/cli/badge.svg)](https://snyk.io/test/github/hutte-io/cli)
[![Downloads/week](https://img.shields.io/npm/dw/hutte.svg)](https://npmjs.org/package/hutte)
[![License](https://img.shields.io/npm/l/hutte.svg)](https://github.com/hutte-io/cli/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g hutte
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
hutte/0.0.46 darwin-x64 node-v15.5.1
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx hutte:auth:login [-e <string>] [-p <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-hutteauthlogin--e-string--p-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx hutte:org:authorize [--no-git] [--no-pull] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-hutteorgauthorize---no-git---no-pull---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx hutte:org:terminate [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-hutteorgterminate--t-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx hutte:pool:take [-t <string>] [-n <string>] [-p <string>] [--timeout <integer>] [-w] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-huttepooltake--t-string--n-string--p-string---timeout-integer--w---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx hutte:auth:login [-e <string>] [-p <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

authorize your hutte-io account

```
USAGE
  $ sfdx hutte:auth:login [-e <string>] [-p <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --email=email                                                                 the email address of your account on
                                                                                    hutte.io

  -p, --password=password                                                           the password of your account on
                                                                                    hutte.io

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx hutte:auth:login --email myEmail@example.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
```

_See code: [lib/commands/hutte/auth/login.js](https://github.com/hutte-io/cli/blob/v0.0.46/lib/commands/hutte/auth/login.js)_

## `sfdx hutte:org:authorize [--no-git] [--no-pull] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

authorize a scratch org from hutte.io

```
USAGE
  $ sfdx hutte:org:authorize [--no-git] [--no-pull] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --no-git                                                                          doesn't checkout the scratch org's
                                                                                    git branch

  --no-pull                                                                         doesn't pull the source code from
                                                                                    the scratch org
```

_See code: [lib/commands/hutte/org/authorize.js](https://github.com/hutte-io/cli/blob/v0.0.46/lib/commands/hutte/org/authorize.js)_

## `sfdx hutte:org:terminate [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

terminates the default org on Hutte.io and logs out locally

```
USAGE
  $ sfdx hutte:org:terminate [-t <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -t, --api-token=api-token                                                         the api token. Only needed if you
                                                                                    have not previously logged in using
                                                                                    `sfdx hutte:auth:login`

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [lib/commands/hutte/org/terminate.js](https://github.com/hutte-io/cli/blob/v0.0.46/lib/commands/hutte/org/terminate.js)_

## `sfdx hutte:pool:take [-t <string>] [-n <string>] [-p <string>] [--timeout <integer>] [-w] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

take a scratch org from the pool

```
USAGE
  $ sfdx hutte:pool:take [-t <string>] [-n <string>] [-p <string>] [--timeout <integer>] [-w] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -n, --name=name                                                                   the name of the org

  -p, --project-id=project-id                                                       the id of the project. Useful when
                                                                                    multiple projects use the same git
                                                                                    repository.

  -t, --api-token=api-token                                                         the api token. Only needed if you
                                                                                    have not previously logged in using
                                                                                    `sfdx hutte:auth:login`

  -w, --wait                                                                        waits until an org becomes available

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --timeout=timeout                                                                 the timeout period in seconds.
```

_See code: [lib/commands/hutte/pool/take.js](https://github.com/hutte-io/cli/blob/v0.0.46/lib/commands/hutte/pool/take.js)_
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
