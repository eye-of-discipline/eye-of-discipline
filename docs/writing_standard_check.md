---
tags:
  - documentation
  - standards writing
  - checks
---

# Writing a Standard Check

A standard check is a script that answers one question:

```text
Does the repository meet the requirement described in the standard?
```

You do not need to write a perfect framework. A simple, readable script is enough: it checks the requirement, prints a clear message, and exits with the right code.

## Before You Start

The standard documentation must exist first. The check should not invent the standard in code. It should measure what is written in `README.md`.

Before implementation, answer three questions:

| Question | Example Answer |
| --- | --- |
| What am I checking? | Whether the main branch is protected |
| Where do I get the data from? | From a file in the repository, the GitLab API, or `discipline.yaml` |
| What does an error mean? | Missing branch protection means `fail` |

If you cannot answer these questions, go back to the standard documentation.

## Where the Check Is

The standard check is located in the standard directory:

```text
standards/{domain}/{STD_ID}/bin/checks
```

Example:

```text
standards/repository/STD-REPO-001/bin/checks
```

The verification job runs this file through a variable:

```text
STD_CHECK_SCRIPT=/tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
```

## Exit Code Contract

The check should use simple codes:

| Code | Meaning |
| --- | --- |
| `0` | the standard is met |
| `1` | the standard is not met |
| `120` | the check is not implemented or there are no conditions to perform the measurement |

Code `101` is reserved for the `.dyscypline` template, which handles active exceptions. A standard check usually should not return `101` itself.

## Minimal Check

The simplest Bash check:

```bash
#!/usr/bin/env bash
set -euo pipefail

if [[ -f README.md ]]; then
    echo "OK: README.md exists"
    exit 0
fi

echo "FAIL: README.md does not exist"
exit 1
```

This example checks a local file. In a real standard, the message should say exactly what needs to be fixed.

## Script Structure

For most checks, this structure is enough:

```bash
#!/usr/bin/env bash
set -euo pipefail

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

pass() {
    printf 'OK: %s\n' "$*"
    exit 0
}

command -v yq >/dev/null 2>&1 || fail "required command not found: yq"

if [[ ! -f discipline.yaml ]]; then
    fail "discipline.yaml not found"
fi

value="$(yq -r '.metadata.name // ""' discipline.yaml)"

if [[ -z "$value" ]]; then
    fail "metadata.name is empty in discipline.yaml"
fi

pass "metadata.name is set: $value"
```

This layout gives:

- a clear place for errors,
- one positive exit path,
- readable messages in the job log,
- predictable behavior in CI.

## Reading `discipline.yaml`

If the standard requires manual attestation, the check can read `spec.attest`.

Example:

```bash
#!/usr/bin/env bash
set -euo pipefail

STD_ID="${STD_ID:-STD-REPO-002}"
DISCIPLINE_FILE="${DISCIPLINE_FILE:-discipline.yaml}"

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

pass() {
    printf 'OK: %s\n' "$*"
    exit 0
}

command -v yq >/dev/null 2>&1 || fail "required command not found: yq"
[[ -f "$DISCIPLINE_FILE" ]] || fail "missing file: $DISCIPLINE_FILE"

attested="$(STD_ID="$STD_ID" yq -r '.spec.attest[env.STD_ID].r6 // false' "$DISCIPLINE_FILE")"

if [[ "$attested" != "true" ]]; then
    fail "requirement r6 is not attested for $STD_ID"
fi

pass "requirement r6 is attested for $STD_ID"
```

The standard documentation must then explain what `r6` is and what the team confirms with the value `true`.

## Checking Files in the Repository

If the check verifies a file in the application repository, remember that it runs in the working directory of the application project, not in the standard directory.

Example:

```bash
required_file=".gitlab-ci.yml"

if [[ ! -f "$required_file" ]]; then
    echo "FAIL: missing required file: $required_file" >&2
    exit 1
fi

echo "OK: required file exists: $required_file"
exit 0
```

If the check needs its own standard files, refer to the path under `/tmp/discipline/standards/...` or set such a path in the job.

## Checking the GitLab API

If the standard requires GitLab data, the check should clearly validate the required environment variables.

Example skeleton:

```bash
#!/usr/bin/env bash
set -euo pipefail

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

require_env() {
    local name="$1"
    [[ -n "${!name:-}" ]] || fail "required environment variable is empty: $name"
}

require_env CI_API_V4_URL
require_env CI_PROJECT_ID
require_env CI_JOB_TOKEN

project_url="${CI_API_V4_URL}/projects/${CI_PROJECT_ID}"

response="$(
    curl -fsSL \
        --header "JOB-TOKEN: ${CI_JOB_TOKEN}" \
        "$project_url"
)"

visibility="$(printf '%s' "$response" | jq -r '.visibility')"

if [[ "$visibility" == "private" ]]; then
    echo "OK: project visibility is private"
    exit 0
fi

fail "project visibility is $visibility, expected private"
```

This check requires an image with `curl` and `jq`. If the standard needs these tools, set the appropriate image in the standard's `.gitlab-ci.yml`.

## Log Messages

An error message should be written for the team that needs to fix the repository.

Weak message:

```text
FAIL
```

Better message:

```text
FAIL: main branch is not protected. Enable branch protection for the default branch.
```

A good message says:

- what is wrong,
- what the standard expects,
- where to start fixing it.

## Local Test

Before committing, run the check locally from the repository directory:

```bash
bash standards/repository/STD-REPO-001/bin/checks
```

Also check the syntax:

```bash
bash -n standards/repository/STD-REPO-001/bin/checks
```

If you have ShellCheck:

```bash
shellcheck -x standards/repository/STD-REPO-001/bin/checks
```

## Common Mistakes

| Mistake | Effect |
| --- | --- |
| the check verifies something different than the documentation | the standard is not trustworthy |
| no readable message | the team does not know what to fix |
| missing tools are ignored | the job fails with an accidental error |
| too much logic in one script | the check is hard to maintain |
| using `exit 0` despite an uncertain result | the pipeline shows false compliance |

!!! note "AI can help, but the contract must be clear"
    You can use AI to write the first version of a check. First describe the requirement, data source, expected `pass` result, `fail` condition, and tools available in the job. Without this information, AI will most often write a script that looks correct but measures the wrong thing.
