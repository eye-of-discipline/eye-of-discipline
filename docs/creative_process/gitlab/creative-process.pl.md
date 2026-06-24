---
tags:
  - documentation
  - creative process
---

# Gitlab Pipeline Creative Process

Plik `.gitlab-ci.yml` w tym katalogu jest przykładowym pipeline'em dla repozytorium, które wytwarza, wersjonuje i publikuje standardy Eye of Discipline.

Pipeline rozdziela dwa procesy:

- **wyliczenie wersji i przygotowanie artefaktów wersji** wykonywane po commit push albo merge push,
- **budowę i publikację portalu MkDocs** wykonywaną dla wyliczonej wersji,
- **publikację release** wykonywaną przez `semantic-release`.

## Założenia

Pipeline zakłada, że repozytorium:

- używa Conventional Commits,
- publikuje wersje przez `semantic-release`,
- zawiera konfigurację MkDocs,
- zawiera standardy w katalogu `standards/`,
- może wypychać zmiany do gałęzi `gitlab-pages`,
- publikuje stronę z katalogu `public/`.

Skrypt `bin/prepare_build` przygotowuje standardy przed publikacją dokumentacji. Jego miejsce w procesie opisuje sekcja [Przygotowanie artefaktów wersji](../../../docs/creative_process.md#6-przygotowanie-artefaktow-wersji).

Konfiguracja `semantic-release` jest trzymana w pliku:

```text
ci/gitlab/creative-process/.releaserc.cjs
```

Joby kopiują ten plik do katalogu roboczego jako `.releaserc.cjs`.

## Zmienne pipeline'u

| Zmienna | Domyślna wartość | Znaczenie |
| --- | --- | --- |
| `GIT_DEPTH` | `0` | pobiera pełną historię wymaganą przez `semantic-release` |
| `RELEASE_CANDIDATE_VERSION` | wyliczana w `🕵 Set Version` | kandydacka wersja używana przez `bin/prepare_build` |
| `CI_COMMIT_TAG` | ustawiana przez GitLab | tag release używany przy publikacji dokumentacji |
| `PAGES_BRANCH` | `gitlab-pages` | gałąź, na której `mike` utrzymuje wersjonowaną dokumentację |
| `DISABLE_MKDOCS_2_WARNING` | `true` | wyłącza ostrzeżenie MkDocs 2 w obrazie buildowym |

`🏗️ MkDocs build` publikuje dokumentację dla wersji z `CI_COMMIT_TAG` albo `RELEASE_CANDIDATE_VERSION`. Jeżeli obie wartości są puste, `mike` nie ma poprawnej wersji do opublikowania.

## Struktura pipeline'u

Pipeline składa się z trzech stage'y:

| Stage | Job | Odpowiedzialność |
| --- | --- | --- |
| `prepare` | `🕵 Set Version` | wykonuje dry-run `semantic-release` i zapisuje `versioning.env` |
| `build` | `🏗️ MkDocs build` | publikuje wersjonowaną dokumentację przez `mike` i przygotowuje artefakt `public/` |
| `publish` | `🌐 MkDocs publish` | przekazuje artefakt `public/` do GitLab Pages |
| `publish` | `📍 Publish Version` | uruchamia właściwe `semantic-release` i publikuje release |

## Przykładowy pipeline

![pipeline](pipeline.png)

## Relacja między wersjonowaniem a publikacją

Proces wersjonowania jest wykonywany na zwykłym pipeline po zmianie w repozytorium:

- commit push albo merge push uruchamia joby `🕵 Set Version` i `📍 Publish Version`,
- `🕵 Set Version` wykonuje `semantic-release --dry-run`, żeby poznać następną wersję i zapisać ją w `versioning.env`,
- `🏗️ MkDocs build` pobiera `versioning.env`, uruchamia `bin/prepare_build` i publikuje portal przez `mike`,
- `🌐 MkDocs publish` wystawia artefakt `public/` jako GitLab Pages,
- `📍 Publish Version` wykonuje `semantic-release`, który tworzy release i tag.

Pipeline tagowy jest traktowany inaczej:

- joby `🕵 Set Version` i `📍 Publish Version` są pomijane dla `CI_COMMIT_TAG`,
- publikacja dokumentacji używa wersji z taga,
- `🏗️ MkDocs build` generuje dokumentację wersjonowaną,
- `🌐 MkDocs publish` publikuje katalog `public/` jako GitLab Pages.

Dzięki temu wersja jest wyznaczana na podstawie historii commitów, a dokumentacja standardów jest publikowana jako konkretny, wersjonowany artefakt.

## `🕵 Set Version`

Job działa w stage'u `prepare` i nie uruchamia się dla pipeline'ów tagowych:

```yaml
rules:
  - if: '$CI_COMMIT_TAG'
    when: never
  - when: on_success
```

Job kopiuje konfigurację release:

```bash
cp ci/gitlab/creative-process/.releaserc.cjs .releaserc.cjs
```

Następnie uruchamia dry-run:

```bash
semantic-release --dry-run
```

Konfiguracja `.releaserc.cjs` zapisuje zmienne release do `versioning.env`. Najważniejsza z nich to `RELEASE_CANDIDATE_VERSION`, używana później przez `bin/prepare_build` i `mike`.

## `📍 Publish Version`

Job działa w stage'u `publish` i również nie uruchamia się dla pipeline'ów tagowych.

Uruchamia właściwy proces publikacji:

```bash
semantic-release
```

`semantic-release` analizuje commity, wylicza wersję, publikuje release i tworzy tag. Tag może później uruchomić pipeline odpowiedzialny za publikację dokumentacji wersjonowanej.

!!! warning

    Przed użyciem sprawdź aktualną wersję obrazu [semantic-release](https://gitlab.com/dev.rachuna/artifacts/containers/semantic-release/-/releases).

## `🏗️ MkDocs build`

Job działa w stage'u `build` i przygotowuje dokumentację publikowaną przez GitLab Pages.

Job konfiguruje Git, pobiera gałąź `gitlab-pages`, a następnie używa `mike` do publikacji wersji:

```bash
if [ -f ./bin/prepare_build ]; then
  chmod +x ./bin/prepare_build
  ./bin/prepare_build
fi

DOCS_VERSION="${CI_COMMIT_TAG:-${RELEASE_CANDIDATE_VERSION:-}}"

mike deploy "$DOCS_VERSION" latest \
  --push \
  --update-aliases \
  -b "$PAGES_BRANCH"
```

Po deployu job ustawia opublikowaną wersję jako domyślną:

```bash
mike set-default --push "$DOCS_VERSION" \
  -b "$PAGES_BRANCH"
```

Na końcu zawartość gałęzi `gitlab-pages` jest pakowana do katalogu `public/`, który staje się artefaktem dla kolejnego joba.

`bin/prepare_build` jest uruchamiany przed publikacją przez `mike`, ponieważ przygotowuje pliki zależne od wersji: metadane standardów, definicje jobów weryfikujących oraz inne wygenerowane artefakty procesu.

!!! warning

    Przed użyciem sprawdź aktualną wersję obrazu [mkdocs](https://gitlab.com/dev.rachuna/artifacts/containers/mkdocs/-/releases).

## `🌐 MkDocs publish`

Job działa w stage'u `publish` i zależy od artefaktu z `🏗️ MkDocs build`:

```yaml
needs:
  - job: 🏗️ MkDocs build
    artifacts: true
```

Publikuje katalog `public/` jako GitLab Pages:

```yaml
pages:
  publish: public
```

W efekcie GitLab Pages serwuje dokumentację standardów wygenerowaną przez MkDocs i wersjonowaną przez `mike`.

`📍 Publish Version` czeka na `🌐 MkDocs publish`, żeby release był publikowany po przygotowaniu i wystawieniu portalu.

## Artefakty

Job `🕵 Set Version` zapisuje:

```text
versioning.env
CHANGELOG.md
```

`versioning.env` jest raportem `dotenv`, więc GitLab udostępnia zapisane w nim zmienne kolejnym jobom. W tym pipeline najważniejsza jest zmienna `RELEASE_CANDIDATE_VERSION`.

Job `🏗️ MkDocs build` zapisuje:

```text
public/
```

Artefakt `public/` jest przekazywany do `🌐 MkDocs publish`, który publikuje go przez GitLab Pages.

Job `📍 Publish Version` korzysta z tej samej konfiguracji `.releaserc.cjs`, ale nie publikuje osobnego artefaktu. Jego efektem jest release i tag w GitLab.
