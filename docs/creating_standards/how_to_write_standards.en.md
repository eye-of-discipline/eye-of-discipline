---
tags:
  - documentation
  - standards writing
---

# How to Write Standards?

This thread describes how to create standard documentation in **Eye of Discipline**. It covers the work of the discipline team: from organizing standards into domains to writing a standard document so that it can later be measured in the verification process.

A standard is not only a description of good practices. In this repository, a standard is part of a versioned discipline:

- it has a place in the `standards/` structure,
- it has a stable identifier `STD-{GID}-{NNN}`,
- it describes requirements using normative language,
- it can have an automated check,
- it can require manual attestation,
- it is published in the MkDocs portal.

## Purpose of Standard Documentation

Good standard documentation should answer three questions:

| Question | Answer in the Documentation |
| --- | --- |
| What is required? | normative requirements written clearly and unambiguously |
| Why is it required? | context, risk, and rationale for the standard |
| How will it be checked? | description of the measurement, attestation, or check responsibility boundary |

Documentation should not hide uncertainty. If a requirement cannot be fully measured automatically, the standard should say so and indicate whether it uses manual attestation.

## Work Order

When creating a new standard, define the domain first, then write the standard.

1. Check whether the right domain exists in `standards/domain.json`.
2. If the domain does not exist, create it and name it so that it groups standards by responsibility.
3. Create the standard skeleton with the generator.
4. Write the standard documentation.
5. Only then refine the check and verification job definition.

!!! warning "Standard first, check second"
    The check should measure the requirement described in the standard. If the script is created first and the documentation only later, it is easy to create a standard that describes the tool instead of the expected state.

## Documents in This Thread

| Document | When to Use |
| --- | --- |
| [Creating a Documentation Domain](standard_domain_documentation.md) | when a new standards area must be added, for example `repository`, `security`, or `release` |
| [BCP 14 Normative Language](bcp14_standard_language.md) | before you start writing `MUST`, `SHOULD`, and `MAY` requirements |
| [Writing Documentation](writing_standard_documentation.md) | when you create or change the `README.md` of a specific standard |
| [Writing a Standard Check](writing_standard_check.md) | when a standard requirement must be turned into a `bin/checks` script |
