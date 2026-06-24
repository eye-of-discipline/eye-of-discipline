---
tags:
  - documentation
  - verification process
---

# GitHub Actions as the Discipline Quality Gate

The workflow `.github/workflows/verification-process.yml` is the central discipline conformance verification process for GitHub Actions. An application repository should not copy the whole process into itself. It should call it as a reusable workflow and treat it as a quality gate.

The most important integration element:

```yaml
jobs:
  discipline-verification:
    name: Eye discipline quality gate
    uses: eye-of-discipline/eye-of-discipline/.github/workflows/verification-process.yml@main
    secrets: inherit
```

This call adds the following to the application pipeline:

- validation of `discipline.yaml`,
- standard jobs collected in `.github/workflows/checks-jobs.yml`,
- `results/{STD_ID}.json` reports,
- aggregation of results into `conformance.json`,
- the quality gate decision.

## Place in the Main CI

The discipline verification process is part of the application's main CI. It does not replace the build, unit tests, or deployment. It acts as an additional quality gate that answers the question:

```text
does the repository satisfy the standards of the declared discipline version?
```

Minimal workflow example in an application repository:

```yaml
name: Discipline verification

on:
  push:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  discipline-verification:
    name: Eye discipline quality gate
    uses: eye-of-discipline/eye-of-discipline/.github/workflows/verification-process.yml@main
    secrets: inherit
```

GitHub Actions does not have a GitLab-style `include` that injects an arbitrary YAML fragment into a pipeline. In this process, the equivalent is a reusable workflow called with `jobs.<job>.uses`.

## Required Files in the Application Repository

The application repository must contain:

| File | Role |
| --- | --- |
| `discipline.yaml` | declaration of the discipline version, attestations, and waivers |

The application repository does not need to keep a local copy of:

- `.github/workflows/verification-process.yml`,
- `.github/workflows/checks-jobs.yml`,
- `bin/verification_process/discipline_validate`,
- `bin/verification_process/discipline_verify`.

The workflow downloads the declared discipline version from `discipline.yaml`, and the process tools from the repository version that provides the reusable workflow.

Minimal declaration:

```yaml
apiVersion: eye-of-discipline.rachuna.dev/v1
kind: Discipline
metadata:
  name: my-service
spec:
  discipline:
    repository: eye-of-discipline/eye-of-discipline
    ref: 1.0.0
```

`spec.discipline.repository` tells the workflow where to download the discipline from. `spec.discipline.ref` tells it which discipline version or branch to use for measurement.

For compatibility with GitLab declarations, the workflow maps:

```text
dev.rachuna/eye-of-discipline -> eye-of-discipline/eye-of-discipline
```

## Workflow Inputs

`.github/workflows/verification-process.yml` exposes `workflow_call` with these inputs:

| Input | Default value | Meaning |
| --- | --- | --- |
| `discipline-file` | `discipline.yaml` | team declaration file |
| `conformance-file` | `conformance.json` | final conformance report |
| `discipline-repository` | `eye-of-discipline/eye-of-discipline` | fallback discipline repository |
| `discipline-ref` | `main` | fallback discipline ref |

The workflow can also receive an optional secret:

| Secret | Meaning |
| --- | --- |
| `GH_TOKEN` | token used to checkout private discipline repositories |

If the repositories are public, the default `github.token` is enough.

## Process Structure

The process consists of three parts:

| Element | Job / file | Responsibility |
| --- | --- | --- |
| declaration validation | `👁️ Eye discipline:Validate discipline declaration` | checks the `discipline.yaml` contract |
| standard jobs | `.github/workflows/checks-jobs.yml` | runs standard jobs and writes `results/{STD_ID}.json` |
| result aggregation | `🪬 Eye discipline:Verify discipline standards` | builds `conformance.json` and returns the quality gate decision |

Flow:

```text
👁️ Eye discipline:Validate discipline declaration
      |
      v
👁️ Eye discipline:Verify standard jobs
      |
      v
🪬 Eye discipline:Verify discipline standards
```

The `👁️ Eye discipline:Verify standard jobs` job calls another reusable workflow:

```yaml
uses: ./.github/workflows/checks-jobs.yml
```

## Two Code Sources

The workflow uses two checkouts:

| Directory | Source | Usage |
| --- | --- | --- |
| `.discipline-source` | `spec.discipline.repository` and `spec.discipline.ref` | discipline version declared by the application, including standards and checks |
| `.discipline-process-source` | reusable workflow repository/ref | current verification process tools |

The separation is necessary because an older discipline tag may contain standards, but may not yet contain the latest process scripts:

```text
bin/verification_process/discipline_validate
bin/verification_process/discipline_verify
```

If the script exists in `.discipline-source`, the workflow uses the version from the declared discipline. If it does not exist there, it uses the version from `.discipline-process-source`.

## Declaration Validation

Job:

```text
👁️ Eye discipline:Validate discipline declaration
```

runs in this container:

```text
ghcr.io/eye-of-discipline/image-python:1.0.0
```

The job performs:

1. checkout of the application repository,
2. reading `spec.discipline.repository` and `spec.discipline.ref`,
3. checkout of the declared discipline version,
4. checkout of the process repository,
5. execution of `discipline_validate`.

The validator checks:

- file presence,
- `apiVersion`,
- `kind`,
- `metadata.name`,
- `spec.discipline.repository`,
- `spec.discipline.ref`,
- attestation structure,
- waiver structure.

A validation error means a declaration error, not a standard nonconformance.

## Standard Jobs

Each standard has its own source job in the standard directory:

```text
standards/{domain}/{STD_ID}/.github-actions.yml
```

The creative process combines these definitions into:

```text
.github/workflows/checks-jobs.yml
```

The rule is:

```text
one standard = one job = one results/{STD_ID}.json report
```

Example job:

```yaml
std-repo-001:
  name: 👁️ Eye discipline:STD-REPO-001
  runs-on: ubuntu-latest
  container:
    image: ghcr.io/eye-of-discipline/image-python:1.0.0
  env:
    STD_DOMAIN: repository
    STD_ID: STD-REPO-001
    DOCS_MD_FILE_PATH: standards/repository/STD-REPO-001/README.en.md
    STD_CHECK_SCRIPT: .discipline-source/standards/repository/STD-REPO-001/bin/checks
```

A standard job:

- checks out the application repository,
- checks out the declared discipline version,
- checks out the process repository,
- copies `bin/` tools,
- checks whether an active waiver exists for `STD_ID`,
- runs `bin/checks`,
- writes `results/{STD_ID}.json`,
- uploads the report as an artifact.

## Waivers

A standard job checks `spec.exceptions[]` in `discipline.yaml`.

If an active waiver exists for `STD_ID`, the job writes a report:

```json
{"key":"STD-REPO-001","status":"waived","exception":{"check":"STD-REPO-001","reason":"migration","owner":"platform-team","expires":"2026-09-30"}}
```

If `expires` is earlier than the current UTC date, the waiver is ignored and the check runs normally.

An active waiver is not a regular success. It is reported as `waived`, and the aggregator returns `pass_with_waivers`.

## Standard Job Status

The standard job always tries to write and upload the report first:

```yaml
- name: Upload standard report
  if: always()
  uses: actions/upload-artifact@v7
```

If the check returned `fail` and there is no active waiver, the last step marks the job as failed:

```yaml
- name: Fail standard job
  if: always() && steps.check.outputs.status == 'fail' && steps.waiver.outputs.status != 'active'
  run: exit 1
```

This makes the individual standard red in GitHub Actions, while `results/{STD_ID}.json` remains available for the aggregator.

## Result Aggregation

Job:

```text
🪬 Eye discipline:Verify discipline standards
```

downloads `results-*` artifacts, merges them into `results/`, and then runs:

```bash
discipline_verify \
  --results-dir results \
  --discipline-file "$DISCIPLINE_FILE" \
  --output "$CONFORMANCE_FILE"
```

The script reads `results/*.json`, builds `conformance.json`, and prints a message intended for the pipeline recipient.

Possible final statuses:

| Status | Meaning |
| --- | --- |
| `pass` | all standards passed |
| `pass_with_waivers` | there are nonconformities, but all of them are covered by active waivers |
| `fail` | a nonconformity exists without an active waiver |
| `error` | some reports could not be read |
| `no_checks` | no `results/*.json` files were found |

## Quality Gate

The aggregation job is the quality gate for the main CI pipeline.

Exit codes have the following meaning:

| Code | Meaning | Effect |
| --- | --- | --- |
| `0` | everything is ok | the pipeline passes |
| `101` | not ok, but all nonconformities have active waivers | the workflow converts this code to success |
| `1` | not ok and no waiver exists, or aggregation failed | the pipeline is blocked |

GitHub Actions does not have GitLab-style `allow_failure`. This is why `verification-process.yml` catches code `101` and exits successfully:

```bash
if [ "$verify_rc" -eq 101 ]; then
  exit 0
fi
```

A real nonconformity without a waiver ends the job with code `1`.

## Artifacts

Standard jobs write:

```text
results/
```

The artifact is named:

```text
results-{STD_ID}
```

In the current configuration, standard reports use:

```yaml
retention-days: 90
```

GitHub Actions does not support artifacts with `never` retention. Retention cannot exceed the limit configured for the repository, organization, or enterprise.

The aggregation job writes:

```text
conformance.json
```

`conformance.json` is a CI artifact. It should not be committed to the application repository because it describes the result of a specific workflow run.

## Minimal Integration

Minimal integration in an application repository consists of two elements:

1. The `discipline.yaml` file.
2. A workflow that calls the reusable workflow:

```yaml
jobs:
  discipline-verification:
    name: Eye discipline quality gate
    uses: eye-of-discipline/eye-of-discipline/.github/workflows/verification-process.yml@main
    secrets: inherit
```

The application repository does not need to move `checks-jobs.yml`, `discipline_validate`, or `discipline_verify`. They are part of the versioned process in the discipline repository.
