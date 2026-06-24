# Github Pipeline Creative Process

`.github/workflows/creative-process.yml` implementuje pipeline przygotowania wydania dla repozytorium dyscypliny.

Pipeline wylicza następną kandydacką wersję wydania, przygotowuje i publikuje wersjonowaną dokumentację MkDocs, a na końcu uruchamia `semantic-release`, żeby opublikować wersję.

## Wyzwalacze

Workflow uruchamia się dla:

| Zdarzenie | Zachowanie |
| --- | --- |
| `push` do dowolnej gałęzi | uruchamia joby procesu twórczego |
| `push` tagów `v*` | uruchamia workflow, ale joby procesu twórczego są pomijane |
| `workflow_dispatch` | ręczny punkt wejścia z parametrem `version` |

Pipeline dla tagów jest celowo pomijany przez joby procesu twórczego, ponieważ release jest tworzony przez `semantic-release`, a nie przez ręczne wypychanie tagów release'owych.

## Uprawnienia

Workflow używa:

```yaml
permissions:
  contents: write
```

Jest to wymagane, ponieważ pipeline zapisuje do brancha Pages, a `semantic-release` może tworzyć commity release'owe i tagi.

## Joby

```text
🕵 Set Version
      |
      v
🏗️ MkDocs build
      |
      v
📍 Publish Version
```

GitHub Actions nie ma `stages` w stylu GitLab CI. Kolejność jobów jest modelowana przez `needs`.

## 🕵 Set Version

Techniczny identyfikator joba:

```yaml
set-version
```

Obraz kontenera:

```text
ghcr.io/eye-of-discipline/image-semantic-release:1.1.0
```

Job uruchamia się tylko dla pushy do gałęzi:

```yaml
if: github.event_name == 'push' && !startsWith(github.ref, 'refs/tags/')
```

Wykonuje pełny checkout:

```yaml
fetch-depth: 0
```

Jest to wymagane przez `semantic-release`, który potrzebuje historii Git i tagów.

Job uruchamia:

```bash
semantic-release --dry-run
```

Tryb dry run zapisuje `versioning.env`. Workflow wczytuje ten plik i wystawia:

```text
RELEASE_CANDIDATE_VERSION
```

jako output joba:

```yaml
release-candidate-version
```

Plik `versioning.env` jest wysyłany jako artefakt o nazwie:

```text
versioning-env
```

Retencja jest ustawiona na jeden dzień.

## 🏗️ MkDocs Build

Techniczny identyfikator joba:

```yaml
build
```

Obraz kontenera:

```text
ghcr.io/eye-of-discipline/image-mkdocs:1.1.0
```

Job zależy od:

```yaml
needs: set-version
```

Uruchamia się tylko wtedy, gdy `set-version` zakończy się powodzeniem, a ref nie jest tagiem.

Job mapuje zmienne zorientowane na GitLab dla skryptów, które pierwotnie zostały napisane pod GitLab CI:

| Zmienna | Źródło |
| --- | --- |
| `RELEASE_CANDIDATE_VERSION` | output `set-version` |
| `CI_COMMIT_TAG` | nazwa taga GitHub, gdy ref jest tagiem; w przeciwnym razie wartość pusta |
| `CI_DEFAULT_BRANCH` | domyślna gałąź repozytorium GitHub |
| `PAGES_BRANCH` | `gh-pages` |
| `DOCS_VERSION` | kandydacka wersja wydania |

Job pobiera artefakt `versioning-env` i wykonuje `source versioning.env` przed uruchomieniem kroków builda.

Jeżeli istnieje `bin/prepare_build`, zostaje uruchomiony:

```bash
chmod +x ./bin/prepare_build
./bin/prepare_build
```

Dzięki temu skrypty repozytorium pozostają odpowiedzialne za wygenerowane metadane, zawartość dashboardu i definicje jobów weryfikujących.

Następnie job publikuje dokumentację przez `mike`:

```bash
mike deploy "$DOCS_VERSION" latest \
  --push \
  --update-aliases \
  -b "$PAGES_BRANCH" \
  -m "chore: deploy version $DOCS_VERSION" \
  --ignore-remote-status
```

Domyślna wersja jest ustawiana na opublikowaną wersję:

```bash
mike set-default --push "$DOCS_VERSION" \
  -b "$PAGES_BRANCH" \
  -m "chore: set default latest version $DOCS_VERSION"
```

Branch Pages jest archiwizowany do:

```text
public/
```

i wysyłany jako artefakt `public` na jeden dzień.

## 📍 Publish Version

Techniczny identyfikator joba:

```yaml
publish-version
```

Obraz kontenera:

```text
ghcr.io/eye-of-discipline/image-semantic-release:1.1.0
```

Job zależy od:

```yaml
needs:
  - set-version
  - build
```

Uruchamia się tylko wtedy, gdy oba poprzednie joby zakończą się powodzeniem, a ref nie jest tagiem.

Job pobiera:

| Artefakt | Cel |
| --- | --- |
| `versioning-env` | środowisko kandydackiej wersji wydania |
| `public` | wygenerowana zawartość MkDocs Pages |

Mapuje te same zmienne kompatybilne z GitLabem co job MkDocs build:

```text
RELEASE_CANDIDATE_VERSION
CI_COMMIT_TAG
CI_DEFAULT_BRANCH
```

Jeżeli plik istnieje, job kopiuje konfigurację `semantic-release` procesu twórczego z GitLaba:

```bash
cp ci/gitlab/creative-process/.releaserc.cjs .releaserc.cjs
```

Następnie publikuje release:

```bash
semantic-release
```

## Wymagane sekrety

Workflow oczekuje:

| Secret | Cel |
| --- | --- |
| `SEMANTIC_RELEASE_TOKEN` | token używany przez `semantic-release` do tworzenia release'ów, tagów i commitów |

Secret jest wystawiany do jobów jako:

```yaml
GITHUB_TOKEN: ${{ secrets.SEMANTIC_RELEASE_TOKEN }}
```

## Warstwa kompatybilności z GitLabem

Kilka skryptów repozytorium nadal używa nazw zmiennych z GitLab CI. Workflow celowo mapuje te nazwy zamiast zmieniać skrypty:

| Zmienna GitLab | Źródło GitHub |
| --- | --- |
| `CI_COMMIT_TAG` | `github.ref_name` dla refów tagów; w przeciwnym razie wartość pusta |
| `CI_DEFAULT_BRANCH` | `github.event.repository.default_branch` |
| `GIT_DEPTH` | ustawione na `"0"` |
| `RELEASE_CANDIDATE_VERSION` | wygenerowane przez `semantic-release --dry-run` i `versioning.env` |

Dzięki temu skrypty shellowe pozostają przenośne między GitLab CI i GitHub Actions.

## Artefakty

| Artefakt | Tworzony przez | Używany przez | Retencja |
| --- | --- | --- | --- |
| `versioning-env` | `🕵 Set Version` | `🏗️ MkDocs build`, `📍 Publish Version` | 1 dzień |
| `public` | `🏗️ MkDocs build` | `📍 Publish Version` | 1 dzień |

## Branch Pages

Workflow publikuje wynik MkDocs do:

```text
gh-pages
```

Branch jest pobierany przed publikacją:

```bash
git fetch origin "$PAGES_BRANCH:$PAGES_BRANCH" 2>/dev/null || true
```

Dzięki temu `mike` może aktualizować istniejące wersje zamiast zastępować całą historię dokumentacji.
