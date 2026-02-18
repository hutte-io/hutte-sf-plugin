# summary

Authorize a scratch org from Hutte.io.

# flags.no-git.summary

Doesn't check out the scratch org's git branch.

# flags.no-pull.summary

Doesn't pull the source code from the scratch org.

# flags.org-name.summary

The name of the org to authorize.

# error.orgNotFound

There is not any scratch org to authorize by the provided name.

# error.orgNotFound.actions

- Remove the --org-name flag to choose from a list.
- Visit https://app.hutte.io to see available orgs.

# error.unstagedChanges

You have unstaged changes.

# error.unstagedChanges.actions

- Run `git stash` to temporarily save your changes.
- Run `git commit` to commit your changes.

# error.noOrgsToAuthorize

You don't have any scratch orgs to authorize.

# error.noOrgsToAuthorize.actions

- Visit https://app.hutte.io to create a scratch org.

# error.noOrgSelected

No org selected.

# prompt.chooseOrg

Which scratch org would you like to authorize?

# info.checkoutBranch

Checking out remote branch %s

# info.creatingBranch

Remote branch does not exist. Creating based on %s...
