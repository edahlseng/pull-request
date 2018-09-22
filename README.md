pull-request
============

pull-request is a helper script for common repository actions related to creating and submitting pull-requests.

Installation
------------

TODO

_Optional:_

It's recommended to create an alias for pull-request:

```shell
alias pr='pull-request'
```

Usage
-----

```shell
pull-request <action>
```

Actions:
* `<none>`: Rebases against upstream, runs checks, and opens a pull request
* `branch`: Creates a new branch to work in
* `setup`: Creates a fork and sets up remotes

### Submitting a pull request

```shell
pull-request
```

When called inside of a Git repository, this command will:
* Rebase the current branch off of the upstream master branch
* Run checks
* Push the updated branch to the origin remote
* Open a pull request on GitHub

Assumptions:

TODO

### Creating a branch

```shell
pull-request branch
```

When called inside of a Git repository, this command will:
* Prompt for a branch type (bugfix, dependency, feature, tech-debt, <none>)
* Prompt for a branch subname
* Create a new branch named `<branch type>/<branch subname>`
* Push the newly created branch to the origin remote

Assumptions:

TODO

### Setting up a repository

TODO
