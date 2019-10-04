hutte
=====

CLI for hutte.io

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
hutte/0.0.13 darwin-x64 node-v12.9.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx hutte:auth:login [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-hutteauthlogin--e-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx hutte:org:authorize [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-hutteorgauthorize---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx hutte:auth:login [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

authorize your hutte-io account

```
USAGE
  $ sfdx hutte:auth:login [-e <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --email=email                                                                 the email address of your account on
                                                                                    hutte.io

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx hutte:auth:login --email myEmail@example.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
```

_See code: [lib/commands/hutte/auth/login.js](https://github.com/hutte-io/cli/blob/v0.0.13/lib/commands/hutte/auth/login.js)_

## `sfdx hutte:org:authorize [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

authorize a scratch org from hutte.io

```
USAGE
  $ sfdx hutte:org:authorize [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [lib/commands/hutte/org/authorize.js](https://github.com/hutte-io/cli/blob/v0.0.13/lib/commands/hutte/org/authorize.js)_
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
