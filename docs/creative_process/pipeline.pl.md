---
tags:
  - documentation
  - creative process
  - pipeline
---

# Pipeline procesu twórczego

Pipeline procesu twórczego odpowiada za przygotowanie i wydanie nowej wersji dyscypliny. Ten sam kontrakt procesu jest utrzymywany dla GitHub Actions i GitLab CI, mimo że obie platformy mają inną składnię i inny model wykonywania jobów.

Źródła procesu:

| Platforma | Lokalizacja |
| --- | --- |
| [GitHub Actions](github/creative-process.md) | `ci/github/creative-process` albo `.github/workflows/creative-process.yml` |
| [GitLab CI](gitlab/creative-process.md) | `ci/gitlab/creative-process` |

Pipeline jest częścią procesu tworzenia standardów: po zmianie w repozytorium wyznacza kandydacką wersję, przygotowuje dokumentację MkDocs, publikuje wersjonowany portal i wykonuje właściwe wydanie przez `semantic-release`.

## Cel pipeline

Pipeline ma zamknąć zmianę w repozytorium w spójny produkt:

- wersję dyscypliny wyliczoną z historii commitów,
- ostemplowane metadane standardów,
- wygenerowane definicje jobów weryfikujących,
- zbudowaną i opublikowaną dokumentację MkDocs,
- tag i release utworzone przez `semantic-release`.

Skrypty repozytorium pozostają źródłem logiki domenowej. Pipeline ma tylko dostarczyć środowisko, zmienne i artefakty.

## Przebieg procesu

Proces składa się z trzech kroków:

```text
🕵 Set Version
      |
      v
🏗️ MkDocs build
      |
      v
📍 Publish Version
```

W GitLab CI kolejność jest opisana przez `stages` i `needs`. W GitHub Actions kolejność jest opisana przez `jobs.<job>.needs`.

## 🕵 Set Version

Ten job wyznacza kandydacką wersję wydania.

Kontener:

```text
image-semantic-release
```

Na GitHub Actions używany jest obraz:

```text
ghcr.io/eye-of-discipline/image-semantic-release:1.0.0
```

Na GitLab CI odpowiednikiem jest obraz semantic-release z rejestru GitLab.

Job nie uruchamia się dla tagów. Tag jest skutkiem wydania, a nie wejściem do procesu twórczego.

Główne kroki:

1. repozytorium jest checkoutowane z pełną historią Git,
2. `semantic-release --dry-run` analizuje commity,
3. wynik jest zapisywany do `versioning.env`,
4. `RELEASE_CANDIDATE_VERSION` jest przekazywana do kolejnych jobów.

Przykładowa zawartość `versioning.env`:

```bash
RELEASE_CANDIDATE_VERSION=1.2.0
```

W GitHub Actions plik jest przekazywany dalej jako artefakt. W GitLab CI może być przekazywany jako artifact typu dotenv albo zwykły plik artefaktu.

## 🏗️ MkDocs build

Ten job przygotowuje dokumentację i publikuje wersję roboczą do brancha stron.

Kontener:

```text
image-mkdocs
```

Na GitHub Actions używany jest obraz:

```text
ghcr.io/eye-of-discipline/image-mkdocs:1.1.0
```

Job potrzebuje wyniku `🕵 Set Version`, ponieważ skrypty przygotowania builda wymagają wersji:

```bash
RELEASE_CANDIDATE_VERSION
```

Pipeline mapuje także zmienne GitLab CI, których używają skrypty:

| Zmienna | Znaczenie |
| --- | --- |
| `RELEASE_CANDIDATE_VERSION` | wersja wyliczona przez `semantic-release --dry-run` |
| `CI_COMMIT_TAG` | nazwa taga, pusta dla zwykłego pusha |
| `CI_DEFAULT_BRANCH` | domyślna gałąź repozytorium |
| `GIT_DEPTH` | `0`, pełna historia Git |

Skrypty nie powinny znać szczegółów platformy CI. Dlatego GitHub Actions mapuje zmienne GitLabowe zamiast wymagać zmian w `bin/prepare_build` i skryptach procesu twórczego.

Jeżeli istnieje `bin/prepare_build`, job uruchamia go przed publikacją MkDocs:

```bash
chmod +x ./bin/prepare_build
./bin/prepare_build
```

`bin/prepare_build` może wykonywać między innymi:

- stemplowanie metadanych standardów,
- generowanie jobów weryfikujących,
- przygotowanie plików dashboardu,
- commitowanie zmian wygenerowanych w buildzie, jeżeli proces tego wymaga.

Następnie dokumentacja jest publikowana przez `mike`:

```bash
mike deploy "$DOCS_VERSION" latest \
  --push \
  --update-aliases \
  -b "$PAGES_BRANCH" \
  -m "chore: deploy version $DOCS_VERSION" \
  --ignore-remote-status
```

Domyślna wersja dokumentacji jest ustawiana na publikowaną wersję:

```bash
mike set-default --push "$DOCS_VERSION" \
  -b "$PAGES_BRANCH" \
  -m "chore: set default latest version $DOCS_VERSION"
```

W GitHub Actions branch stron to:

```text
gh-pages
```

W GitLab CI branch stron może nazywać się:

```text
gitlab-pages
```

Nazwa brancha jest konfiguracją pipeline, a nie logiką skryptów.

Na końcu job przygotowuje artefakt:

```text
public/
```

Jest to statyczna zawartość portalu, którą może pobrać kolejny job.

## 📍 Publish Version

Ten job wykonuje właściwe wydanie wersji.

Kontener:

```text
image-semantic-release
```

Job wymaga artefaktów z poprzednich kroków:

| Artefakt | Źródło | Zastosowanie |
| --- | --- | --- |
| `versioning.env` | `🕵 Set Version` | przenosi `RELEASE_CANDIDATE_VERSION` |
| `public/` | `🏗️ MkDocs build` | zawiera przygotowaną dokumentację |

Przed uruchomieniem `semantic-release` pipeline może skopiować konfigurację procesu twórczego:

```bash
cp ci/gitlab/creative-process/.releaserc.cjs .releaserc.cjs
```

Na GitHub Actions kopiowanie jest wykonywane tylko wtedy, gdy plik istnieje. Dzięki temu pipeline może działać również w repozytorium, które nie ma jeszcze pełnej struktury `ci/gitlab/creative-process`.

Wydanie jest wykonywane poleceniem:

```bash
semantic-release
```

To `semantic-release` decyduje, czy powstaje nowa wersja. Pipeline nie tworzy ręcznie tagów release'owych.

## Zdarzenia i tagi

Proces twórczy działa dla zwykłych zmian w repozytorium, na przykład po `push` albo po merge do gałęzi objętej workflow.

Dla tagów release'owych joby procesu twórczego są pomijane:

```text
CI_COMMIT_TAG / refs/tags/*
```

Powód jest prosty: tag jest wynikiem procesu wydawniczego. Gdyby pipeline twórczy uruchamiał się od taga, łatwo byłoby zbudować dokumentację z wersji, która została już zamknięta, albo wywołać pętlę wydawniczą.

## Kontrakt zmiennych

Skrypty procesu twórczego używają wspólnego kontraktu zmiennych:

| Zmienna | Wymagana przez | Opis |
| --- | --- | --- |
| `RELEASE_CANDIDATE_VERSION` | `bin/prepare_build`, `mike` | kandydacka wersja dyscypliny |
| `CI_COMMIT_TAG` | skrypty kompatybilne z GitLab CI | tag bieżącego checkoutu albo wartość pusta |
| `CI_DEFAULT_BRANCH` | skrypty wybierające bazę porównania | domyślna gałąź repozytorium |
| `GIT_DEPTH` | konfiguracja CI | `0`, pełna historia Git |
| `PAGES_BRANCH` | job MkDocs | branch publikacji stron |
| `DOCS_VERSION` | job MkDocs | wersja publikowana przez `mike` |

Jeżeli pipeline działa na GitHub Actions, powinien mapować zmienne GitHubowe na ten kontrakt. Skrypty nie powinny rozróżniać, czy zostały uruchomione przez GitHub Actions, czy GitLab CI.

## Kontrakt artefaktów

Pipeline przekazuje między jobami dwa główne artefakty:

| Artefakt | Zawartość | Retencja |
| --- | --- | --- |
| `versioning.env` | zmienne wersjonowania, w szczególności `RELEASE_CANDIDATE_VERSION` | krótka, zwykle 1 dzień |
| `public/` | statyczna zawartość portalu MkDocs | krótka, zwykle 1 dzień |

Artefakty są częścią kontraktu między jobami. Nie powinny zastępować trwałego źródła prawdy, którym pozostaje repozytorium Git oraz branch publikacji stron.

## Różnice między GitHub Actions i GitLab CI

| Obszar | GitHub Actions | GitLab CI |
| --- | --- | --- |
| Kolejność jobów | `needs` między jobami | `stages` oraz `needs` |
| Obraz joba | `container.image` | `image` |
| Pełna historia Git | `actions/checkout` z `fetch-depth: 0` | `GIT_DEPTH: "0"` |
| Artefakty | `actions/upload-artifact` i `actions/download-artifact` | `artifacts` |
| Zmienna tagu | `github.ref_name` dla `refs/tags/*` | `CI_COMMIT_TAG` |
| Domyślna gałąź | `github.event.repository.default_branch` | `CI_DEFAULT_BRANCH` |
| Branch stron | zwykle `gh-pages` | zwykle `gitlab-pages` |

## Zasada utrzymania

Logika domenowa powinna zostawać w skryptach:

```text
bin/prepare_build
bin/creative_process/*
bin/reporting_process/*
```

Pipeline powinien odpowiadać za:

- wybór obrazu kontenerowego,
- checkout repozytorium,
- mapowanie zmiennych CI,
- przekazywanie artefaktów,
- kolejność jobów,
- publikację przez narzędzia procesu.

Dzięki temu proces można utrzymywać równolegle na GitHub Actions i GitLab CI bez rozgałęziania logiki standardów.
