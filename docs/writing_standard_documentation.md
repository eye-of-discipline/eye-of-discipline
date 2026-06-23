---
tags:
  - documentation
  - standards writing
  - creative process
---

# Writing Documentation

Standard documentation is the source of a standard's meaning. The check and verification job are the technical execution, but the standard's `README.md` tells the development team what the discipline expects.

A standard should be written so that it can be understood without reading the `bin/checks` script.

Before describing requirements, read [BCP 14 Normative Language](bcp14_standard_language.md). That document defines what `MUST`, `SHOULD`, and `MAY` mean in Eye of Discipline.

## Standard Structure

A standard is located in:

```text
standards/{domain}/{STD_ID}/README.md
```

The document should contain:

| Section | Purpose |
| --- | --- |
| standard title | briefly names the requirement |
| status and metadata | show the domain, entry version, and tags |
| purpose | explains why the standard exists |
| requirements | describe what the project MUST, SHOULD, or MAY do |
| measurement | describes how the standard is checked |
| attestations | if the standard requires a manual declaration |
| exceptions | if the standard allows temporary debt |
| remediation messages | help the team resolve non-compliance |

Not every standard must have all sections, but the requirements and result interpretation should always be clear.

## Normative Language

Requirements should use these words:

| Word | Meaning |
| --- | --- |
| `MUST` | mandatory requirement |
| `MUST NOT` | prohibition |
| `SHOULD` | recommended requirement from which a team can consciously deviate |
| `MAY` | permitted behavior |

Example:

```markdown
The repository MUST have a protected main branch.

A Merge Request SHOULD be approved by someone other than the author of the change.
```

Avoid non-operational wording:

```markdown
The repository should be well secured.
```

This wording does not say exactly what should be checked.

## Requirement Description

A good requirement has three properties:

- it is specific,
- it has a clear audience,
- it can be verified or consciously confirmed through attestation.

Instead of writing:

```markdown
The project should have a decent code review process.
```

write:

```markdown
Every Merge Request to the main branch MUST pass review before merge.
```

If the standard contains several requirements, number or name them. This makes later attestations, error messages, and review discussions easier.

## Measurement Description

The measurement section should say what the check does, but it should not copy the whole script.

It is enough to describe:

- which data sources are used,
- what a positive result means,
- what a negative result means,
- which limitations the measurement has,
- whether manual attestation is needed.

Example:

```markdown
The check reads project configuration through the GitLab API and verifies whether the main branch is protected.

The `pass` result means that the branch exists and has active protection.
The `fail` result means that the branch is not protected or protection could not be confirmed.
```

## Manual Attestations

If a standard requires attestation, the documentation must describe exactly what the team confirms in `discipline.yaml`.

Example:

```yaml
spec:
  attest:
    STD-REPO-002:
      r6: true
      r7: true
      r10: false
```

The standard documentation should then explain:

| Key | Meaning |
| --- | --- |
| `r6` | requirement R6 has been confirmed manually |
| `r7` | requirement R7 has been confirmed manually |
| `r10` | requirement R10 has not been confirmed |

!!! warning "Attestation does not replace an exception"
    Attestation means: the team confirms that the requirement is met. An exception means: the requirement is not met, but we temporarily accept this state.

## Exceptions

If a standard can be covered by an exception, the documentation should indicate the typical reason and expected debt removal plan.

Minimal exception format:

```yaml
spec:
  exceptions:
    - check: STD-REPO-002
      reason: "repository is being migrated"
      owner: platform-team
      expires: 2026-09-30
```

Do not describe an exception as a way to bypass the standard. Describe it as explicit, temporary debt.

## Messages for the Team

A standard should help the team fix the problem. If a check fails, the log should lead to the standard documentation, and the documentation should say what needs to change.

Good documentation answers this question:

```text
What should I do so that the next pipeline passes?
```

If the answer requires several steps, write them explicitly.

## Documentation Review

A standard review should check:

| Question | Why It Matters |
| --- | --- |
| Is the requirement unambiguous? | the development team must know what the discipline expects |
| Does the measurement check the same thing the documentation describes? | the check cannot measure a different requirement than the standard |
| Does the documentation say how to fix non-compliance? | the standard should help improvement, not only block the pipeline |
| Are attestations and exceptions distinguished? | these mechanisms have different meanings and effects |
| Does the change affect semver? | a new requirement or stricter requirement may require a new discipline version |

!!! note "The standard is the law"
    The standard documentation is the law, the check is the measurement, and the verification job is the way to run the measurement. These three elements must describe the same standard.
