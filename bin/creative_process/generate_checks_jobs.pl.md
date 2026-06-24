---
tags:
  - documentation
  - creative process
---

# Przygotowanie jobów weryfikujących

`bin/creative_process/generate_checks_jobs` jest adapterem procesu wytwórczego. Nie generuje samodzielnie konfiguracji GitLab CI, tylko uruchamia właściwy generator:

```bash
bin/creative_process/discipline_generate_checks_jobs
```

Rozdzielenie tych odpowiedzialności jest celowe:

- `bin/creative_process/discipline_generate_checks_jobs` zawiera logikę wyszukiwania i łączenia definicji jobów,
- `bin/creative_process/generate_checks_jobs` określa, kiedy generator ma zostać użyty podczas przygotowania wersji,
- `bin/prepare_build` pozostaje orkiestratorem całego procesu.

## Miejsce w procesie

Skrypt jest uruchamiany przez `bin/prepare_build` po aktualizacji metadanych standardów:

```text
standards/**/.gitlab-ci.yml
              |
              v
bin/creative_process/discipline_generate_checks_jobs
              |
              v
ci/gitlab/verify/cheks_jobs.yml
```

Każdy plik `.gitlab-ci.yml` standardu definiuje jego własny job weryfikujący. Generator skleja te definicje w jeden plik, który może zostać dołączony przez pipeline procesu weryfikacji.

## Zachowanie

Jeżeli `bin/creative_process/discipline_generate_checks_jobs` istnieje, adapter:

1. nadaje mu uprawnienie wykonywania,
2. uruchamia generator,
3. przekazuje jego kod wyjścia do `prepare_build`.

Jeżeli generator nie istnieje, krok jest pomijany z komunikatem i kończy się kodem `0`. Dzięki temu `prepare_build` może być użyty również w repozytorium, które nie publikuje jobów weryfikujących.

## Użycie

```bash
bin/creative_process/generate_checks_jobs
```

Pomoc:

```bash
bin/creative_process/generate_checks_jobs --help
```

Szczegóły formatu wejścia i walidacji opisuje dokumentacja [generatora jobów standardów](discipline_generate_checks_jobs.md).
