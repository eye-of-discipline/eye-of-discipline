---
tags:
  - documentation
  - creative process
  - pipeline
---

# Creative Process Pipeline

The creative process pipeline is responsible for preparing and releasing a new version of the discipline. The same process contract is maintained for GitHub Actions and GitLab CI, even though both platforms use different syntax and a different job execution model.

Process sources:

| Platform | Location |
| --- | --- |
| [GitHub Actions](github/creative-process.md) | `ci/github/creative-process` or `.github/workflows/creative-process.yml` |
| [GitLab CI](gitlab/creative-process.md) | `ci/gitlab/creative-process` |

The pipeline is part of the standards creation process: after a repository change, it determines the release candidate version, prepares the MkDocs documentation, publishes the versioned portal, and performs the actual release through `semantic-release`.

## Pipeline Goal

The pipeline turns a repository change into a coherent product:

- a discipline version calculated from commit history,
- stamped standard metadata,
- generated verification job definitions,
- built and published MkDocs documentation,
- a tag and release created by `semantic-release`.

Repository scripts remain the source of domain logic. The pipeline should only provide the environment, variables, and artifacts.

## Process Flow

The process consists of three steps:

```text
🕵 Set Version
      |
      v
🏗️ MkDocs build
      |
      v
📍 Publish Version
```

In GitLab CI, the order is described by `stages` and `needs`. In GitHub Actions, the order is described by `jobs.<job>.needs`.

## 🕵 Set Version

This job determines the release candidate version.

Container:

```text
image-semantic-release
```

GitHub Actions uses this image:

```text
ghcr.io/eye-of-discipline/image-semantic-release:1.1.0
```

In GitLab CI, the equivalent is the semantic-release image from the GitLab registry.

The job does not run for tags. A tag is the result of a release, not an input to the creative process.

Main steps:

1. the repository is checked out with full Git history,
2. `semantic-release --dry-run` analyzes commits,
3. the result is written to `versioning.env`,
4. `RELEASE_CANDIDATE_VERSION` is passed to the next jobs.

Example `versioning.env` content:

```bash
RELEASE_CANDIDATE_VERSION=1.2.0
```

In GitHub Actions, the file is passed forward as an artifact. In GitLab CI, it can be passed as a dotenv artifact or as a regular artifact file.

## 🏗️ MkDocs build

This job prepares the documentation and publishes a working version to the pages branch.

Container:

```text
image-mkdocs
```

GitHub Actions uses this image:

```text
ghcr.io/eye-of-discipline/image-mkdocs:1.1.0
```

The job needs the `🕵 Set Version` result because the build preparation scripts require a version:

```bash
RELEASE_CANDIDATE_VERSION
```

The pipeline also maps GitLab CI variables used by the scripts:

| Variable | Meaning |
| --- | --- |
| `RELEASE_CANDIDATE_VERSION` | version calculated by `semantic-release --dry-run` |
| `CI_COMMIT_TAG` | tag name, empty for a regular push |
| `CI_DEFAULT_BRANCH` | repository default branch |
| `GIT_DEPTH` | `0`, full Git history |

Scripts should not need to know CI platform details. This is why GitHub Actions maps GitLab-style variables instead of requiring changes in `bin/prepare_build` and the creative process scripts.

If `bin/prepare_build` exists, the job runs it before publishing MkDocs:

```bash
chmod +x ./bin/prepare_build
./bin/prepare_build
```

`bin/prepare_build` may perform, among other things:

- stamping standard metadata,
- generating verification jobs,
- preparing dashboard files,
- committing changes generated during the build if the process requires it.

Then the documentation is published with `mike`:

```bash
mike deploy "$DOCS_VERSION" latest \
  --push \
  --update-aliases \
  -b "$PAGES_BRANCH" \
  -m "chore: deploy version $DOCS_VERSION" \
  --ignore-remote-status
```

The default documentation version is set to the published version:

```bash
mike set-default --push "$DOCS_VERSION" \
  -b "$PAGES_BRANCH" \
  -m "chore: set default latest version $DOCS_VERSION"
```

In GitHub Actions, the pages branch is:

```text
gh-pages
```

In GitLab CI, the pages branch may be:

```text
gitlab-pages
```

The branch name is pipeline configuration, not script logic.

At the end, the job prepares an artifact:

```text
public/
```

This is the static portal content that the next job can download.

## 📍 Publish Version

This job performs the actual version release.

Container:

```text
image-semantic-release
```

The job requires artifacts from the previous steps:

| Artifact | Source | Usage |
| --- | --- | --- |
| `versioning.env` | `🕵 Set Version` | carries `RELEASE_CANDIDATE_VERSION` |
| `public/` | `🏗️ MkDocs build` | contains the prepared documentation |

Before running `semantic-release`, the pipeline may copy the creative process configuration:

```bash
cp ci/gitlab/creative-process/.releaserc.cjs .releaserc.cjs
```

In GitHub Actions, the copy is performed only when the file exists. This allows the pipeline to work also in a repository that does not yet have the full `ci/gitlab/creative-process` structure.

The release is performed with:

```bash
semantic-release
```

`semantic-release` decides whether a new version is created. The pipeline does not create release tags manually.

## Events and Tags

The creative process runs for regular repository changes, for example after a `push` or after a merge to a branch covered by the workflow.

For release tags, creative process jobs are skipped:

```text
CI_COMMIT_TAG / refs/tags/*
```

The reason is simple: the tag is the result of the release process. If the creative pipeline started from a tag, it would be easy to build documentation from a version that has already been closed or to trigger a release loop.

## Variable Contract

Creative process scripts use a shared variable contract:

| Variable | Required by | Description |
| --- | --- | --- |
| `RELEASE_CANDIDATE_VERSION` | `bin/prepare_build`, `mike` | discipline release candidate version |
| `CI_COMMIT_TAG` | GitLab CI-compatible scripts | current checkout tag or an empty value |
| `CI_DEFAULT_BRANCH` | scripts selecting the comparison base | repository default branch |
| `GIT_DEPTH` | CI configuration | `0`, full Git history |
| `PAGES_BRANCH` | MkDocs job | pages publication branch |
| `DOCS_VERSION` | MkDocs job | version published by `mike` |

If the pipeline runs on GitHub Actions, it should map GitHub variables to this contract. Scripts should not distinguish whether they were started by GitHub Actions or GitLab CI.

## Artifact Contract

The pipeline passes two main artifacts between jobs:

| Artifact | Content | Retention |
| --- | --- | --- |
| `versioning.env` | versioning variables, especially `RELEASE_CANDIDATE_VERSION` | short, usually 1 day |
| `public/` | static MkDocs portal content | short, usually 1 day |

Artifacts are part of the contract between jobs. They should not replace the durable source of truth, which remains the Git repository and the pages publication branch.

## Differences Between GitHub Actions and GitLab CI

| Area | GitHub Actions | GitLab CI |
| --- | --- | --- |
| Job order | `needs` between jobs | `stages` and `needs` |
| Job image | `container.image` | `image` |
| Full Git history | `actions/checkout` with `fetch-depth: 0` | `GIT_DEPTH: "0"` |
| Artifacts | `actions/upload-artifact` and `actions/download-artifact` | `artifacts` |
| Tag variable | `github.ref_name` for `refs/tags/*` | `CI_COMMIT_TAG` |
| Default branch | `github.event.repository.default_branch` | `CI_DEFAULT_BRANCH` |
| Pages branch | usually `gh-pages` | usually `gitlab-pages` |

## Maintenance Rule

Domain logic should stay in scripts:

```text
bin/prepare_build
bin/creative_process/*
bin/reporting_process/*
```

The pipeline should be responsible for:

- selecting the container image,
- checking out the repository,
- mapping CI variables,
- passing artifacts,
- ordering jobs,
- publishing through process tools.

This allows the process to be maintained in parallel on GitHub Actions and GitLab CI without branching the standards logic.
