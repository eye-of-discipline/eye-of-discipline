---
tags:
  - documentation
---

# Glossary

This document organizes the terms used in Eye of Discipline. It is not a general DevOps glossary. It describes only the terms that have a specific meaning in the discipline process.

## Domain Terms

| Term | Meaning |
| --- | --- |
| Discipline | A set of versioned standards against which application repositories are measured. |
| Standard | A single rule or group of requirements, for example related to the repository, code review, security, or release. |
| Normative requirement | A requirement written using `MUST`, `SHOULD`, or `MAY` language. It defines what the standard expects. |
| Measurement | The technical way to verify whether a standard is met. A measurement can be a script, an API query, a file check, an attestation, or another signal defined by the standard. |
| Check | The runnable part of a standard's measurement. In the pipeline, each standard should have its own checking job. |
| Compliance | The state in which a repository meets the requirements of the specified discipline version. Compliance is not a declaration, but a measurement result. |
| Non-compliance | A measurement result showing that a standard has not been met. Non-compliance can block the pipeline if there is no active exception. |
| Exception | An explicit, temporary allowance for non-compliance. An exception must have an owner, a reason, and an expiration date. |
| Attestation | A development team's declaration stored in `discipline.yaml`, used when a standard requires explicit confirmation instead of full automated measurement. |
| Quality gate | The pipeline's decision after result aggregation. It can pass the pipeline, pass it with an exception, or block it. |
| Discipline QA result | The aggregated result of a project's compliance with the discipline, stored in `conformance.json`. |
| Dashboard | A reporting view showing discipline status across many projects. The dashboard presents results, but does not run checks itself. |

## Files and Artifacts

| Element | Meaning |
| --- | --- |
| `discipline.yaml` | The development team's declaration. It points to the discipline repository, standards version, attestations, and exceptions. |
| `spec.discipline.ref` | The pinned discipline version used by the application repository. |
| `spec.attest` | The attestation section in `discipline.yaml`. Its content depends on the requirements of specific standards. |
| `spec.exceptions` | A list of active or historical exceptions from standards or checks. |
| `standards/{domain}/STD-XXX-YYY/` | The directory of a single standard in the discipline repository. |
| `bin/checks` | The standard script responsible for measurement. The standard decides what it checks and how. |
| `results/{STD_ID}.json` | The result of a single standard job, for example `pass`, `fail`, or `waived`. |
| `conformance.json` | An artifact that aggregates the results of all standards for a specific application pipeline run. |
| `docs/dashboard.md` | A reporting page generated from project declarations and artifacts. |

## Statuses

| Status | Scope | Meaning |
| --- | --- | --- |
| `pass` | check or the entire discipline | The requirement has been met. |
| `fail` | check or the entire discipline | The requirement has not been met and there is no active exception. |
| `waived` | check | The requirement has not been met, but it is covered by an active exception. |
| `pass_with_waivers` | the entire discipline | There is no blocking non-compliance, but at least one active exception exists. |
| `error` | aggregation | The pipeline could not correctly read part of the results. |
| `no_checks` | aggregation | The pipeline did not provide check results. |
| `no_discipline` | dashboard | The project does not have a `discipline.yaml` declaration. |
| `no_report` | dashboard | The project has a declaration, but no `conformance.json` report was found. |

## Interpretation Rule

`discipline.yaml`, `results/{STD_ID}.json`, and `conformance.json` do not mean the same thing.

| Element | Answers the Question |
| --- | --- |
| `discipline.yaml` | Which discipline version does the project intend to comply with? |
| `results/{STD_ID}.json` | How did the measurement of a single standard finish? |
| `conformance.json` | Does the entire discipline pass the quality gate? |

A team can declare its intent to comply, but compliance must be measured by the pipeline.
