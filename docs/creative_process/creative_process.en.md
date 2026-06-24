---
tags:
  - documentation
  - creative process
---

# Standards Development Process Idea

The development process describes how the discipline team turns organizational requirements into a versioned product: standards, documentation, and ready-to-use verification jobs. The result is not only a descriptive page. The result is a released discipline version that development teams can reference in `discipline.yaml` and measure in their own pipelines.

The core rule of the process is simple:

- the standard describes **what** must be satisfied,
- the check describes **how** it will be measured,
- the discipline version says **since when** the rule applies.

```mermaid
flowchart TD
    A(["Discipline\nteam"])
    A -->|describes requirements| B["Standard\nREADME.md"]
    A -->|defines measurement| C["Check\nbin/checks"]
    A -->|defines verification job| D["Job definition\n.gitlab-ci.yml"]

    B --> E["Merge Request"]
    C --> E
    D --> E

    E --> F(["Development\npipeline"])
    F -->|semantic-release| G["Discipline\nversion"]
    F -->|prepare_build| H["Dashboard,\nmetadata and jobs"]
    G --> I["MkDocs\nGitLab Pages"]
    H --> I

    style A fill:#1a3a5c,color:#fff
    style F fill:#1a3a5c,color:#fff
    style I fill:#3949ab,color:#fff,stroke:#3949ab
```

## 1. Creating a Standard

The discipline team creates a standard in:

```text
standards/{domain}/STD-XXX-YYY/
```

The domain list is maintained in `standards/domain.json`. A new domain can be created with the generator:

```bash
bin/tools/discipline_create_domain repozytorium REPO
```

The generator adds the domain to the registry and creates the `standards/{domain}` directory.

A skeleton for a new standard can be created with:

```bash
bin/tools/discipline_create_standard \
  repozytorium \
  "Standard name"
```

The generator reads the domain `gid`, assigns the next `STD-{GID}-{NNN}` identifier, creates `README.md`, `bin/checks`, and `.gitlab-ci.yml`, and then adds the standard page to `mkdocs.yml`.

The standard identifier is permanent. Once assigned, it should not change, even if the standard is later clarified, replaced, or withdrawn.

The primary standard file is `README.md`. This is where the team describes requirements, context, and how the standard should be interpreted. Normative requirements should be written using [BCP 14](https://datatracker.ietf.org/doc/rfc2119/) language:

- `MUST` for mandatory requirements,
- `SHOULD` for recommended requirements,
- `MAY` for permitted behaviors.

The normative description should be independent of tools. A standard should not merely say "use this specific script"; it should describe the expected state. Tools, examples, and measurement implementation belong to the execution layer of the standard.

## 2. Defining the Measurement

If the standard should be measured automatically, the discipline team adds a check, most often as:

```text
standards/{domain}/STD-XXX-YYY/bin/checks
```

The check can measure compliance in any way justified by the standard. It can inspect repository files, GitLab configuration, the result of another tool, attestations in `discipline.yaml`, CI artifacts, or an external API.

The process does not impose a closed list of verification types. The contract matters:

- the check must measure the requirement described in the standard,
- the result must be processable by the pipeline,
- a measurement error should not pretend to be compliance,
- the log should help the development team understand what must be fixed.

In practice, the standard job writes the result of a single measurement as:

```text
results/{STD_ID}.json
```

The minimal result looks like this:

```json
{"key":"STD-REPO-001","status":"pass"}
```

Allowed statuses for a single standard are `pass`, `fail`, and `waived`.

## 3. Adding the Verification Job Definition

The `bin/checks` script alone is not enough, because the pipeline also needs to know when and how to run it. Therefore each standard should have its own GitLab CI job defined in:

```text
standards/{domain}/STD-XXX-YYY/.gitlab-ci.yml
```

The rule is intentionally simple:

```text
one standard = one job
```

This file does not define the standard content. It defines the verification job that will later be used in the verification process. It describes how to run the measurement in GitLab CI: image, variables, standard identifier, and the command that starts the check.

!!! info "Why a custom job definition?"
    The idea of a custom job definition comes from the fact that different standards may require different tools and different pipeline flows. One standard may only need a Bash shell, another one may need the GitLab API client, another one may need a Python interpreter, security tools, or the earlier result of another standard. That is why the process does not assume one rigid check execution method hardcoded in the pipeline.

    A job definition gives the standard control over the measurement environment. The standard can choose the image, variables, commands, and dependencies needed for correct verification. The verification pipeline therefore remains a result aggregator, not a place where special cases must be added for every standard.

The job sets the standard identifier and runs the actual `bin/checks` script. This allows the verification pipeline to later collect results from all standards without knowing their internal implementation.

Example job responsibility:

```yaml
---
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

The list of jobs published for the verification process is generated automatically by:

```bash
bin/creative_process/discipline_generate_checks_jobs
```

The generator reads files:

```text
standards/**/.gitlab-ci.yml
```

and refreshes:

```text
ci/gitlab/verify/cheks_jobs.yml
```

## 4. Standard Review

A standard change goes through a Merge Request. The review should answer four questions:

| Question | Why it matters |
| --- | --- |
| Is the requirement unambiguous? | The development team must know what the standard expects. |
| Can the requirement be verified? | A standard without measurement quickly becomes an uncontrolled declaration. |
| Does the check measure the same thing the standard describes? | The measurement must not check something different from the rule it enforces. |
| Is the impact of the change described correctly by the commit? | `semantic-release` calculates the version based on Conventional Commits. |

A new mandatory standard or a stricter existing requirement has a real impact on application repositories. Development teams will need to satisfy the requirement or request a temporary waiver with an owner, reason, and expiration date.

## 5. Version Decision

The discipline version is calculated by `semantic-release` based on Conventional Commits. This means the commit description is part of the development process, not just a technical format.

Approximate impact interpretation:

| Change | Semver impact |
| --- | --- |
| clarification without changing requirements | `patch` |
| adding a new standard or new measurement | `minor` |
| tightening a requirement that affects existing consumers | `major` or a consciously planned `minor` |
| changing the `discipline.yaml` format | `major` |
| removing or replacing an active standard | `major` |

Semver has practical meaning here: development teams pin the version in `discipline.yaml`, so a discipline update is explicitly visible in their repository.

## 6. Preparing Version Artifacts

The development pipeline runs:

```bash
bin/prepare_build
```

`bin/prepare_build` is the process orchestrator. The actual logic is split into smaller steps in `bin/creative_process/`:

| Step | Responsibility |
| --- | --- |
| `bin/reporting_process/discipline_generate_dashboard` | feeds `docs/dashboard.md` and dashboard subpages with GitLab API data, rendering the result from Jinja2 templates |
| `bin/creative_process/stamp_standard_metadata` | updates `since:` and `tags: [domain, version]` in standards |
| `bin/creative_process/generate_checks_jobs` | refreshes `ci/gitlab/verify/cheks_jobs.yml` |
| `bin/commit_build_changes` | common script that commits and pushes changes only when they actually exist |

The scripts prepare version-dependent files:

- update `since:` in standards,
- update `tags: [domain, version]`,
- update `docs/dashboard.md` and `docs/dashboard/**` subpages if the dashboard generator has data to write,
- run `bin/creative_process/generate_checks_jobs`,
- commit changes only when something actually changed.

The `since:` field says from which discipline version the standard applies. Assigning it in CI reduces manual mistakes: the standard receives the version resulting from the actual release, not from the Merge Request author's prediction.

This stage also feeds the portal dashboard. It is not a separate decision-making process: the dashboard generator only retrieves data from the GitLab API and writes a Markdown view that MkDocs later publishes.

If the repository contains generated `docs/dashboard.md` and detail subpages, the MkDocs build includes them in the portal as regular documentation pages. The development process does not calculate project conformance, but it publishes the current dashboard view together with documentation.

Changes generated by `prepare_build` are committed with the message:

```text
chore(standards): Nadanie wersji zmienionym standardom lub aktualizacja dashboard
```

Updating the dashboard does not have to bump the discipline version. It is a change to the portal view, not a change to standards, checks, or the `discipline.yaml` contract.

!!! warning "The dashboard is a view"
    The dashboard published in the portal is only as current as the data available when `prepare_build` runs. The dashboard generator does not run standard checks and does not create `conformance.json`; it only searches for existing declarations and application pipeline artifacts.

## 7. Publishing the Version

Version publication is split into two steps:

1. `semantic-release` publishes the release and the `vX.Y.Z` tag.
2. The tag pipeline builds the MkDocs portal and publishes documentation through GitLab Pages.

From this moment, the discipline version is a product that application repositories can consume. The development team can update:

```yaml
spec:
  discipline:
    ref: X.Y.Z
```

After changing `spec.discipline.ref`, the application pipeline measures compliance with the new version of standards.

!!! note
    The key distinction:

    - A standard is **law**: it describes what must be satisfied.
    - A check is **measurement**: it verifies whether the law is followed.
    - A release is **product**: it closes standards and measurements into a concrete version.

    Changing the law without updating the measurement creates a dead standard. A measurement without described law creates an incomprehensible quality gate.
