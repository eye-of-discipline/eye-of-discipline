---
tags:
  - documentation
  - standards writing
  - creative process
---

# Creating a Documentation Domain

A documentation domain organizes standards by area of responsibility. It is not a visual category in MkDocs, but part of the discipline model: it affects the standards directory, `STD-{GID}-{NNN}` identifiers, and the navigation structure.

Example domain:

```json
{
  "path": "repository",
  "gid": "REPO"
}
```

This domain means that standards are placed in:

```text
standards/repository/
```

and their identifiers have the following form:

```text
STD-REPO-001
STD-REPO-002
STD-REPO-003
```

## When to Create a Domain

It is worth creating a new domain when a standard concerns a different area of responsibility than existing standards.

A good domain:

- groups several potential standards,
- has a clear responsibility,
- does not mix abstraction levels,
- has a name that development teams can understand.

Examples of sensible domains:

| Domain | Scope |
| --- | --- |
| `repository` | repository structure, branch protection, code review, required files |
| `release` | versioning, changelog, artifact publishing |
| `security` | secrets, dependencies, scanning, security policies |
| `observability` | logs, metrics, alerts, and service behavior tracing |

Do not create a domain for a single tool if the standard concerns a broader problem. For example, `gitlab` is usually a worse domain than `repository` if the requirement describes how to work with a repository rather than the GitLab API itself.

## Naming

Each domain has two fields:

| Field | Rule | Example |
| --- | --- | --- |
| `path` | lowercase slug used as a directory | `repository` |
| `gid` | short identifier used in the standard ID | `REPO` |

`path` should be stable. Changing the domain path means changing documentation links and moving standards.

`gid` should be short and unambiguous. After standards are published, it should not change because it is part of stable identifiers.

## Creating a Domain

A domain is created by the tool:

```bash
bin/tools/discipline_create_domain repository REPO
```

The script:

1. validates `path` and `gid`,
2. creates the `standards/{path}` directory,
3. adds the domain to `standards/domain.json`,
4. blocks duplicate paths and identifiers.

After creating the domain, you can create standards inside it:

```bash
bin/tools/discipline_create_standard \
  repository \
  "Main branch protection"
```

## Navigation

Domain standards are published in MkDocs in the section:

```yaml
Discipline Rules:
  Repository:
    - standards/repository/STD-REPO-001/README.md
```

The standard generator adds the new document to `mkdocs.yml`. After the change, it is worth running the documentation build to catch broken links or an invalid structure:

```bash
mkdocs build --strict
```

## Domain Review

A review of a new domain should answer these questions:

| Question | Why It Matters |
| --- | --- |
| Does the domain describe an area of responsibility rather than a tool? | domains are meant to organize standards over the long term |
| Is `gid` unambiguous? | the identifier will be used in all standards from the domain |
| Can the domain contain more than one standard? | a domain for a single requirement is usually too specific |
| Will the name be understandable to the development team? | users read the portal by domain |

!!! warning "Do not change a domain without a reason"
    Moving a published standard between domains changes its documentation path. If the standard already has an identifier and is used in `discipline.yaml`, the decision to change its domain should be treated as a product change, not cosmetics.
