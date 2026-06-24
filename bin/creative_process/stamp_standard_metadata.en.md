---
tags:
  - documentation
  - creative process
---

# Updating Standard Metadata

`bin/creative_process/stamp_standard_metadata` updates the front matter of changed standards before a new discipline version is published.

The script is responsible only for version-dependent metadata:

- it sets the `since:` field,
- it builds `tags:` from the standard domain and the discipline version.

It is run by `bin/prepare_build`, but it can also be used directly. The script does not stamp the entire `standards/` directory. First, it determines the latest tag reachable from the default branch, and then it updates only Markdown files changed relative to that tag.

## Usage

Explicit version:

```bash
bin/creative_process/stamp_standard_metadata --version 1.2.0
```

Use the version from the CI environment:

```bash
RELEASE_CANDIDATE_VERSION=1.2.0 \
  bin/creative_process/stamp_standard_metadata
```

Help:

```bash
bin/creative_process/stamp_standard_metadata --help
```

## Version Source

The script selects the version in the following order:

1. the `--version` argument,
2. the `CI_COMMIT_TAG` variable,
3. the `RELEASE_CANDIDATE_VERSION` variable.

If no version is available, the script exits with an error:

```text
ERROR: CI_COMMIT_TAG i RELEASE_CANDIDATE_VERSION są puste
```

## Processed Files

By default, the script scans all Markdown files in:

```text
standards/
```

Only files containing the `since:` field are modified. This keeps supporting documents without version metadata unchanged.

A different directory can be selected with:

```bash
bin/creative_process/stamp_standard_metadata \
  --version 1.2.0 \
  --standards-dir path/to/standards
```

## Selecting Changed Standards

The script compares the current repository state with the latest tag reachable from the default branch:

```text
origin/$CI_DEFAULT_BRANCH
```

If `origin/$CI_DEFAULT_BRANCH` is not available locally, the local `$CI_DEFAULT_BRANCH` branch is used. The default value is `main`.

Only files are processed that:

- are located in the `standards/` directory,
- have the `.md` extension,
- exist in the current checkout,
- were changed, added, copied, or renamed relative to the base tag,
- are not located in `standards/template/`.

New untracked Markdown files in `standards/` are also considered. This makes it easier to check changes locally before committing them.

The comparison base can be forced manually:

```bash
bin/creative_process/stamp_standard_metadata \
  --version 1.2.0 \
  --base-ref v1.0.0
```

## Front Matter Modification

Before running:

```yaml
---
domain: repozytorium
since: 1.0.0
tags:
  - repozytorium
  - 1.0.0
---
```

After running with `--version 1.2.0`:

```yaml
---
domain: repozytorium
since: 1.2.0
tags: [repozytorium, 1.2.0]
---
```

The `domain:` field is the source of the first tag. If the document contains `domain:` but does not contain `tags:`, the script adds tags before the end of the front matter.

If `tags:` already exists, its current content is replaced:

```yaml
tags: [domain, version]
```

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `-v`, `--version` | `$CI_COMMIT_TAG` or `$RELEASE_CANDIDATE_VERSION` | version written to `since:` and `tags:` |
| `-s`, `--standards-dir` | `standards` | directory containing standards |
| `-b`, `--base-ref` | latest tag on the default branch | ref used as the comparison base |
| `--default-branch` | `$CI_DEFAULT_BRANCH` or `main` | branch used to find the latest tag |
| `-h`, `--help` | | help |

## Result

For each modified file, the script prints:

```text
Stamping standard metadata: 1.2.0
Diff base: v1.0.0
  updated: standards/repozytorium/STD-REPO-001/README.pl.md
```

If no changed file contains `since:`, the script exits with code `0` and prints:

```text
No changed standards metadata to stamp.
```

!!! warning "Existing tags are replaced"
    The script does not preserve additional values from `tags:`. The target value is always built from `domain:` and the current discipline version.
