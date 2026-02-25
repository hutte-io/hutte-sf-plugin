# summary

Create a scratch org via Hutte.

# description

Creates a new scratch org for the current project. By default, the command waits for the org to be ready and authenticates with the SF CLI.

Use --async to return immediately without waiting (you can resume later with `sf hutte org resume scratch`).

# examples

- Create a scratch org and wait for it to be ready:

  <%= config.bin %> <%= command.id %> --name "My Feature Org"

- Create a scratch org asynchronously:

  <%= config.bin %> <%= command.id %> --name "Quick Test" --async

- Create a scratch org with initial branch and feature branch:

  <%= config.bin %> <%= command.id %> --name "Feature Org" --initial-branch main --branch feature/my-feature

- Create a scratch org without ancestors or namespace:

  <%= config.bin %> <%= command.id %> --name "Clean Org" --no-ancestors --no-namespace

- Create a scratch org with a custom definition file:

  <%= config.bin %> <%= command.id %> --name "Custom Org" --definition-file config/project-scratch-def.json

# flags.name.summary

Name for the scratch org.

# flags.async.summary

Do not wait for the scratch org to be ready.

# flags.wait.summary

Number of minutes to wait for the scratch org to be ready.

# flags.initial-branch.summary

Source branch used to push (deploy) code to the org.

# flags.branch.summary

Feature/dev branch name created from the initial branch.

# flags.duration-days.summary

Number of days until the scratch org expires (1-30).

# flags.no-ancestors.summary

Do not include second-generation managed package (2GP) ancestors.

# flags.no-namespace.summary

Create the scratch org with no namespace, even if the Dev Hub has a namespace.

# flags.issue.summary

Link to the related issue in your issue tracking tool (e.g., Jira, Linear).

# flags.notes.summary

Notes for the scratch org.

# flags.definition-file.summary

Path to a scratch org definition JSON file.

# spinner.creating

Creating scratch org

# spinner.waiting

Waiting for org to be ready

# spinner.authenticating

Authenticating with SF CLI

# info.orgCreated

Scratch org '%s' created with ID: %s

# info.orgReady

Scratch org '%s' is ready

# info.status

Status: %s

# error.orgCreationFailed

Scratch org creation failed.

# error.setupFailed

Scratch org setup failed.

# error.pushFailed

Scratch org push failed.

# error.definitionFileNotFound

Definition file not found: %s

# error.invalidDefinitionFile

Invalid JSON in definition file: %s
