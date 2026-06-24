---
tags:
  - documentation
  - verification process
---

# Verification Job Definition

A verification job is the place where a specific standard is turned into a measurement executed in an application pipeline. It is the layer between `discipline.yaml` validation and the final discipline conformance assessment.

The declaration validator answers the question: **do we know which discipline to run?**

The verification job answers the question: **has this specific standard been satisfied?**

The conformance assessment answers the question: **what is the overall discipline result?**

## Job Role

Each standard has its own job because each standard may require a different toolset, container image, variables, dependencies, or check execution method.

The rule is:

```text
one standard = one job = one results/{STD_ID}.json report
```

This means the verification process does not impose one rigid measurement implementation. The standard defines how it will be checked, and the pipeline requires only a shared result contract.

## Where the Definition Is Created

The standard job definition is maintained next to the standard:

```text
standards/{domain}/{STD_ID}/.gitlab-ci.yml
```

The development process collects these definitions and generates:

```text
ci/gitlab/verify/cheks_jobs.yml
```

The application pipeline includes this file:

```yaml
include:
  - local: ci/gitlab/verify/cheks_jobs.yml
```

As a result, the application repository runs standard jobs published in the selected discipline version.

## `.dyscypline` Template

The shared base for standard jobs is the template:

```yaml
.dyscypline:
  stage: validate
  extends:
    - .before_script
    - .after_script
  allow_failure:
    exit_codes:
      - 101
      - 120
  artifacts:
    paths:
      - results/
    when: always
    expire_in: 1 day
```

The template provides process elements that must be shared by all standards:

- fetching the discipline repository declared in `discipline.yaml`,
- checking for an active waiver for `STD_ID`,
- writing the `results/{STD_ID}.json` report,
- exposing the `results/` artifact,
- printing a message with a link to the standard documentation.

## Fetching the Discipline

Before running the check, the template reads the repository and ref from the team's declaration:

```yaml
before_script:
  - |
    DISCIPLINE_REPOSITORY=$(yq '.spec.discipline.repository' discipline.yaml | tr -d '"')
    DISCIPLINE_REF=$(yq '.spec.discipline.ref' discipline.yaml | tr -d '"')

    glab repo clone "${DISCIPLINE_REPOSITORY}" /tmp/discipline -- --branch "${DISCIPLINE_REF}" --depth 1
    cp /tmp/discipline/bin/* bin/
```

This ensures the standard check is run from the same discipline version the team declared in `discipline.yaml`.

## Waivers

The template checks whether `spec.exceptions[]` contains a waiver for the current `STD_ID`:

```yaml
before_script:
  - |
    exception_json=$(STD_ID="$STD_ID" yq -r '.spec.exceptions[]? | select(.check == env.STD_ID) | @json' "$DISCIPLINE_FILE" | head -n 1)
    if [ -n "$exception_json" ]; then
      expires=$(printf '%s' "$exception_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("expires", ""))')
      today=$(date -u +%F)

      if [ -n "$expires" ] && [ "$expires" \< "$today" ]; then
        echo "Odstępstwo dla standardu ${STD_ID} wygasło ${expires}; standard zostanie zweryfikowany normalnie."
      else
        mkdir -p .discipline
        printf '%s\n' "$exception_json" > .discipline/exception.json
        echo "Standard ${STD_ID} uzyskał odstępstwo ważne do ${expires:-bez terminu}."
        exit 101
      fi
    fi
```

Exit code `101` means the standard has an active waiver. The job may finish as `allow_failure`, but `after_script` still writes a `waived` report that later goes into `conformance.json`.

If `expires` is earlier than the current UTC date, the waiver is ignored and the check runs normally.

## Standard Job

The generated standard job extends `.dyscypline` and sets variables required by the template:

```yaml
👁️ Eye discipline:STD-REPO-001:
  image: registry.gitlab.com/dev.rachuna/artifacts/containers/python:1.2.1
  extends:
    - .dyscypline
  variables:
    STD_DOMAIN: repozytorium
    STD_ID: STD-REPO-001
    DOCS_MD_FILE_PATH: standards/repozytorium/STD-REPO-001/README.md
    STD_CHECK_SCRIPT: /tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
  script:
    - |
      if [ ! -f "$STD_CHECK_SCRIPT" ]; then
        echo "Standard check script not found: $STD_CHECK_SCRIPT"
        exit 120
      fi

      bash "$STD_CHECK_SCRIPT"
  allow_failure:
    exit_codes:
      - 101
      - 120
```

The most important element is `STD_CHECK_SCRIPT`. It points to the actual measurement script for the standard:

```text
/tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
```

The pipeline itself does not need to know what is inside `bin/checks`. The standard can check files, GitLab configuration, artifacts, repository structure, or data from `discipline.yaml`.

## Contract Variables

| Variable | Role |
| --- | --- |
| `STD_DOMAIN` | standard domain, for example `repozytorium` |
| `STD_ID` | standard identifier, for example `STD-REPO-001` |
| `DOCS_MD_FILE_PATH` | path to standard documentation used in the message for the team |
| `STD_CHECK_SCRIPT` | path to the `bin/checks` script in the fetched discipline version |
| `DISCIPLINE_FILE` | team declaration, `discipline.yaml` by default |

`STD_ID` is key because it connects:

- the job definition,
- the waiver in `spec.exceptions[]`,
- the `results/{STD_ID}.json` report,
- the entry in the final `conformance.json`.

## Exit Codes

| Code | Meaning | Effect |
| --- | --- | --- |
| `0` | standard check passed | `pass` report |
| `1` | standard check detected non-conformance | `fail` report |
| `101` | an active waiver exists | `waived` report |
| `120` | check script is missing or not implemented | allowed technical job failure |

Code `120` is used so that an empty or unfinished standard definition is not accidentally treated as compliance.

## Standard Report

After the job finishes, the template writes a report:

```yaml
after_script:
  - |
    mkdir -p results
    if [ -f .discipline/exception.json ]; then
      exception_json=$(tr -d '\n' < .discipline/exception.json)
      printf '{"key":"%s","status":"waived","exception":%s}\n' "$STD_ID" "$exception_json" > "results/${STD_ID}.json"
    else
      STATUS=$([[ "$CI_JOB_STATUS" == "success" ]] && echo "pass" || echo "fail")
      echo "{\"key\":\"${STD_ID}\",\"status\":\"${STATUS}\"}" > "results/${STD_ID}.json"
    fi
```

Minimal positive report:

```json
{"key":"STD-REPO-001","status":"pass"}
```

Non-conformance report:

```json
{"key":"STD-REPO-001","status":"fail"}
```

Waiver report:

```json
{"key":"STD-REPO-002","status":"waived","exception":{"check":"STD-REPO-002","reason":"repository is being migrated","owner":"platform-team","expires":"2026-09-30"}}
```

This report is the input for `bin/verification_process/discipline_verify`.

## Responsibility Boundary

The `.dyscypline` template is responsible for process mechanics.

The standard job is responsible for running the correct check.

The `bin/checks` script is responsible for assessing a specific norm.

The `bin/verification_process/discipline_verify` aggregator is responsible for the final quality gate decision.
