---
tags:
  - documentation
  - creative process
---

# Standard Generator

`bin/tools/discipline_create_standard` creates a skeleton for a new standard from `standards/template`.

The generator:

1. checks the domain in `standards/domain.json`,
2. reads its `gid`,
3. calculates the next `STD-{GID}-{NNN}` identifier,
4. creates documentation, a check, and a verification job definition,
5. adds the standard to the appropriate domain in `mkdocs.yml`.

## Usage

```bash
bin/tools/discipline_create_standard \
  repozytorium \
  "Main branch protection"
```

If the last standard in the domain is `STD-REPO-003`, the generator creates:

```text
standards/repozytorium/STD-REPO-004/
├── .gitlab-ci.yml
├── README.md
└── bin/
    └── checks
```

The following link is added to `mkdocs.yml`:

```yaml
- standards/repozytorium/STD-REPO-004/README.md
```

## Arguments

| Argument | Example | Meaning |
| --- | --- | --- |
| `DOMAIN` | `repozytorium` | domain `path` from `standards/domain.json` |
| `STANDARD NAME` | `"Main branch protection"` | standard title; names with spaces must be quoted |

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `-s`, `--standards-dir` | `standards` | standards directory |
| `-d`, `--domains-file` | `standards/domain.json` | domain registry |
| `-t`, `--template-dir` | `standards/template` | template directory |
| `-m`, `--mkdocs-file` | `mkdocs.yml` | MkDocs navigation configuration |
| `-h`, `--help` | | help |

## Identifier Assignment

The generator reads the domain `gid` from `standards/domain.json`:

```json
{
  "path": "repozytorium",
  "gid": "REPO"
}
```

It then searches for directories matching `STD-REPO-NNN` and increments the highest number by one. A deleted identifier is not reused if a standard with a higher number still exists in the directory.

## Template

`standards/template` contains:

| Template file | Output file |
| --- | --- |
| `README.md.tpl` | `README.md` |
| `.gitlab-ci.yml.tpl` | `.gitlab-ci.yml` |
| `bin/checks.tpl` | `bin/checks` |

Supported placeholders:

- `{{STD_ID}}`,
- `{{DOMAIN_PATH}}`,
- `{{DOMAIN_GID}}`,
- `{{STANDARD_NAME}}`.

The `.tpl` extension prevents the template from being treated as an active standard by MkDocs and the job generator.

!!! warning "A new check intentionally fails"
    The generated `bin/checks` exits with code `120`. The discipline team must implement the actual measurement before publishing the standard. This prevents an empty check from being treated as compliance.

## Errors

The generator exits with an error when:

- the domain does not exist in `standards/domain.json`,
- the domain registry or template is invalid,
- the calculated standard directory already exists,
- the discipline navigation section cannot be found in `mkdocs.yml`,
- the template did not create `README.md`, `.gitlab-ci.yml`, or `bin/checks`.
