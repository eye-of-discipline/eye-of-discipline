---
tags:
  - documentation
  - standards writing
---

# BCP 14 Normative Language

BCP 14 is a convention for describing requirements in technical documents. Its purpose is to distinguish what is mandatory from what is a recommendation or an option.

In Eye of Discipline, we use this convention in English so that standards are unambiguous for development teams and measurable in the pipeline.

## Keywords

| Word | Meaning |
| --- | --- |
| `MUST` | mandatory requirement; failure to meet it means non-compliance |
| `MUST NOT` | prohibition; the presence of the given state means non-compliance |
| `SHOULD` | strong recommendation; an exception requires conscious justification |
| `SHOULD NOT` | strong recommendation to avoid a given behavior |
| `MAY` | permitted behavior, but not required |

It is worth writing keywords in uppercase. This makes it immediately visible which sentences are normative.

## `MUST`

Use `MUST` when a requirement is mandatory and failure to meet it should result in `fail`, unless an active exception exists.

Example:

```markdown
The repository MUST have a protected main branch.
```

Such a requirement should have a clear measurement:

- the check confirms branch protection and returns `pass`,
- the check does not confirm protection and returns `fail`,
- an active exception changes the job result to `waived`.

## `MUST NOT`

Use `MUST NOT` when the standard prohibits a specific state.

Example:

```markdown
The repository MUST NOT store secrets in versioned files.
```

A prohibition should be as measurable as a positive requirement. If not all cases can be detected automatically, the documentation must describe the measurement limitations.

## `SHOULD`

Use `SHOULD` when a requirement is recommended but justified exceptions may exist.

Example:

```markdown
A Merge Request SHOULD be approved by someone other than the author of the change.
```

`SHOULD` does not mean optional at will. If a team does not meet such a requirement, it should be able to explain why. The standard must say whether failure to meet it results in `fail`, requires attestation, or is treated as a non-blocking recommendation.

## `MAY`

Use `MAY` when the standard allows a behavior but does not require it.

Example:

```markdown
The project MAY maintain additional documentation files in the `docs/` directory.
```

`MAY` usually should not be the basis for a blocking check. It is useful for describing acceptable implementation variants.

## What to Avoid

Avoid words that sound normative but do not have a clear operational meaning:

| Wording | Problem |
| --- | --- |
| "well secured" | it is unclear which state should be checked |
| "where possible" | it is unclear who evaluates possibility |
| "it is recommended" | it is unclear whether this means `SHOULD` or a loose suggestion |
| "best" | it is unclear whether a requirement exists |
| "appropriate" | it is unclear which criterion applies |

Instead of writing:

```markdown
The repository should be appropriately secured.
```

write:

```markdown
The repository's main branch MUST be protected from direct pushes.
```

## Relationship with Measurement

Each normative requirement should have a known interpretation method:

| Requirement Type | Expected Decision |
| --- | --- |
| `MUST` / `MUST NOT` | usually measured automatically or through attestation |
| `SHOULD` / `SHOULD NOT` | measured, attested, or described as a recommendation |
| `MAY` | describes permitted variants, usually without a block |

If a requirement has no way to be checked, the standard should clearly say why it is descriptive rather than enforced.

!!! note "A standard must be discussable"
    A good requirement lets the development team, reviewer, and discipline team talk about the same state. If it is unclear what meeting the requirement means, the check will not fix the problem.
