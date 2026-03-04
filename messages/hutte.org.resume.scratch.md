# summary

Resume waiting for a scratch org that was created asynchronously.

# description

Polls for the status of a scratch org until it reaches a terminal state (active, failed, setup_failed, push_failed). When the org becomes active, it authenticates with the SF CLI.

Use this command after creating a scratch org with `sf hutte org create --async`.

# examples

- Resume waiting for a scratch org:

  <%= config.bin %> <%= command.id %> --scratch-org-id abc-123

- Resume with a longer timeout:

  <%= config.bin %> <%= command.id %> --scratch-org-id abc-123 --wait 30

# flags.scratch-org-id.summary

ID of the scratch org to resume.

# flags.wait.summary

Number of minutes to wait for the scratch org to be ready.

# spinner.polling

Waiting for org to be ready

# info.alreadyActive

Scratch org '%s' is already active
