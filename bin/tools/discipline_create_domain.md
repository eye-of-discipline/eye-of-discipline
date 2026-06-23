---
tags:
  - documentation
  - creative process
---

# Discipline Domain Generator

`bin/tools/discipline_create_domain` creates a new standards domain and registers it in the file:

```text
standards/domain.json
```

A domain organizes standards by area of responsibility, for example `repozytorium`, `security`, or `release`. Each domain has:

| Field | Meaning |
| --- | --- |
| `path` | directory name in `standards/` |
| `gid` | short identifier used in standard IDs |

Example entry:

```json
{
  "path": "repozytorium",
  "gid": "REPO"
}
```

## Usage

```bash
bin/tools/discipline_create_domain repozytorium REPO
```

The script:

1. validates arguments,
2. creates the `standards/{path}` directory,
3. creates `standards/domain.json` if the file does not exist yet,
4. adds the domain to the registry,
5. blocks duplicate `path` and `gid` values.

## Arguments

| Argument | Example | Rule |
| --- | --- | --- |
| `PATH` | `repozytorium` | lowercase slug: letters, digits, `_`, or `-` |
| `GID` | `REPO` | uppercase identifier: letters and digits |

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `-s`, `--standards-dir` | `standards` | standards directory |
| `-d`, `--domains-file` | `standards/domain.json` | domain registry |
| `-h`, `--help` | | help |

## Format `standards/domain.json`

The registry is a list of domains:

```json
[
  {
    "path": "repozytorium",
    "gid": "REPO"
  }
]
```

The list is sorted by `path` so that file changes are stable in review.

## New Domain Example

```bash
bin/tools/discipline_create_domain security SEC
```

Result:

```text
standards/security/
```

and an entry in `standards/domain.json`:

```json
{
  "path": "security",
  "gid": "SEC"
}
```

## Errors

The script exits with an error when:

- `PATH` is not a valid slug,
- `GID` is not an uppercase identifier,
- a domain with this `path` already exists in the registry,
- a domain with this `gid` already exists in the registry,
- the domain directory already exists,
- `standards/domain.json` is not a list of `{path, gid}` objects.
