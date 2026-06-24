---
tags:
  - documentation
  - creative process
---

# Preparing Verification Jobs

`bin/creative_process/generate_checks_jobs` is an adapter in the creative process. It does not generate the GitLab CI configuration by itself, but runs the actual generator:

```bash
bin/creative_process/discipline_generate_checks_jobs
```

This separation of responsibilities is intentional:

- `bin/creative_process/discipline_generate_checks_jobs` contains the logic for finding and combining job definitions,
- `bin/creative_process/generate_checks_jobs` defines when the generator should be used during version preparation,
- `bin/prepare_build` remains the orchestrator of the whole process.

## Place in the Process

The script is run by `bin/prepare_build` after standard metadata is updated:

```text
standards/**/.gitlab-ci.yml
              |
              v
bin/creative_process/discipline_generate_checks_jobs
              |
              v
ci/gitlab/verify/cheks_jobs.yml
```

Each standard `.gitlab-ci.yml` file defines its own verification job. The generator combines these definitions into one file that can be included by the verification process pipeline.

## Behavior

If `bin/creative_process/discipline_generate_checks_jobs` exists, the adapter:

1. grants it execute permission,
2. runs the generator,
3. passes its exit code to `prepare_build`.

If the generator does not exist, the step is skipped with a message and exits with code `0`. This allows `prepare_build` to be used also in a repository that does not publish verification jobs.

## Usage

```bash
bin/creative_process/generate_checks_jobs
```

Help:

```bash
bin/creative_process/generate_checks_jobs --help
```

The input format and validation details are described in the [standard jobs generator](discipline_generate_checks_jobs.md) documentation.
