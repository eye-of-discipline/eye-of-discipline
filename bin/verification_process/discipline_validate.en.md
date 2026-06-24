---
tags:
  - documentation
  - verification process
---

# Discipline Declaration Validation

`bin/verification_process/discipline_validate` validates the `discipline.yaml` contract prepared by the development team. It is the first technical step of the verification process: before the pipeline fetches the discipline and runs standard checks, it must have a valid declaration of the version, attestations, and waivers.

The script does not measure conformance with standards. A validation error means that the declaration is invalid or ambiguous.

## Usage

By default, the script reads `discipline.yaml` from the current directory:

```bash
bin/verification_process/discipline_validate
```

Use a different file:

```bash
bin/verification_process/discipline_validate --file path/to/discipline.yaml
```

Quiet mode prints only errors:

```bash
bin/verification_process/discipline_validate --file discipline.yaml --quiet
```

Help:

```bash
bin/verification_process/discipline_validate --help
```

## Requirements

The script requires:

- Bash,
- `yq` compatible with the `yq -r '.path' file` syntax.

In a GitLab pipeline, the script can be fetched from the central discipline repository and run locally against the application repository's `discipline.yaml` file.

## Minimal Declaration

```yaml
apiVersion: eye-of-discipline.rachuna.dev/v1
kind: Discipline
metadata:
  name: my-service
spec:
  discipline:
    repository: dev.rachuna/eye-of-discipline
    ref: 1.0.0
```

## Validated Contract

The script checks required fields:

| Field | Requirement |
| --- | --- |
| `apiVersion` | must be `eye-of-discipline.rachuna.dev/v1` |
| `kind` | must be `Discipline` |
| `metadata.name` | must exist and must not be empty |
| `spec.discipline.repository` | must exist and use the `owner/name` format |
| `spec.discipline.ref` | must exist and look like a semver version |

Examples of valid values:

```yaml
repository: dev.rachuna/eye-of-discipline
ref: 1.0.0
```

## Attestations

If `spec.attest` exists, it must be a YAML object:

```yaml
spec:
  attest:
    STD-REPO-002:
      r6: true
      r7: false
```

The validator does not decide whether a given attestation is required or whether its value is sufficient for the standard. At this stage, only the shape of the data is checked. Interpretation belongs to the standard check.

## Waivers

If `spec.exceptions` exists, it must be an array:

```yaml
spec:
  exceptions:
    - check: STD-REPO-002
      reason: "repository is being migrated"
      owner: platform-team
      expires: 2026-09-30
      ticket: ~
```

Each waiver must have the following fields:

| Field | Meaning |
| --- | --- |
| `check` | identifier of the standard or check covered by the waiver |
| `reason` | reason for the waiver |
| `owner` | owner of the technical debt |
| `expires` | waiver expiration date |

The validator checks that the fields are present. The decision whether a waiver is active belongs to a later step of the verification process.

## Result

For a valid declaration, the script prints:

```text
discipline declaration is valid
  file: discipline.yaml
  repository: dev.rachuna/eye-of-discipline
  ref: 1.0.0-develop.3
```

Exit code: `0`.

Error examples:

```text
ERROR: discipline declaration not found: discipline.yaml
ERROR: invalid kind: expected 'Discipline', got 'ConfigMap'
ERROR: missing required field: spec.discipline.ref
ERROR: missing required field: spec.exceptions[0].expires
```

## Place in the Process

`bin/verification_process/discipline_validate` should be run before fetching the discipline and before standard jobs:

```bash
bin/verification_process/discipline_validate --file discipline.yaml
```

Only after successful validation can measurement and aggregation be run:

```bash
bin/verification_process/discipline_verify --discipline-file discipline.yaml --output conformance.json
```

!!! note "Validation is not measurement"
    The validator answers the question: **does the declaration have a valid contract?** Standard checks answer the question: **does the project satisfy the requirements?** Separating these steps makes it possible to distinguish a YAML error from a real non-conformance with a standard.
