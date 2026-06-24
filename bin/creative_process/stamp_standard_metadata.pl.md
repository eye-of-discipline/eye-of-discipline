---
tags:
  - documentation
  - creative process
---

# Aktualizacja metadanych standardów

`bin/creative_process/stamp_standard_metadata` aktualizuje frontmatter zmienionych standardów przed publikacją nowej wersji dyscypliny.

Skrypt odpowiada wyłącznie za metadane zależne od wersji:

- ustawia pole `since:`,
- buduje `tags:` z domeny standardu i wersji dyscypliny.

Jest uruchamiany przez `bin/prepare_build`, ale może być również użyty samodzielnie. Skrypt nie stempluje całego katalogu `standards/`. Najpierw wyznacza ostatni tag osiągalny z gałęzi domyślnej, a następnie aktualizuje tylko pliki Markdown zmienione względem tego taga.

## Użycie

Jawne wskazanie wersji:

```bash
bin/creative_process/stamp_standard_metadata --version 1.2.0
```

Użycie wersji ze środowiska CI:

```bash
RELEASE_CANDIDATE_VERSION=1.2.0 \
  bin/creative_process/stamp_standard_metadata
```

Pomoc:

```bash
bin/creative_process/stamp_standard_metadata --help
```

## Źródło wersji

Skrypt wybiera wersję w następującej kolejności:

1. argument `--version`,
2. zmienna `CI_COMMIT_TAG`,
3. zmienna `RELEASE_CANDIDATE_VERSION`.

Jeżeli wersja nie jest dostępna, skrypt kończy się błędem:

```text
ERROR: CI_COMMIT_TAG i RELEASE_CANDIDATE_VERSION są puste
```

## Przetwarzane pliki

Domyślnie skrypt przegląda wszystkie pliki Markdown w katalogu:

```text
standards/
```

Modyfikowane są tylko pliki zawierające pole `since:`. Dzięki temu dokumenty pomocnicze bez metadanych wersji pozostają bez zmian.

Inny katalog można wskazać przez:

```bash
bin/creative_process/stamp_standard_metadata \
  --version 1.2.0 \
  --standards-dir path/to/standards
```

## Wybór zmienionych standardów

Skrypt porównuje aktualny stan repozytorium z ostatnim tagiem osiągalnym z gałęzi domyślnej:

```text
origin/$CI_DEFAULT_BRANCH
```

Jeżeli `origin/$CI_DEFAULT_BRANCH` nie jest dostępny lokalnie, używana jest lokalna gałąź `$CI_DEFAULT_BRANCH`. Domyślną wartością jest `main`.

Przetwarzane są tylko pliki:

- znajdujące się w katalogu `standards/`,
- mające rozszerzenie `.md`,
- istniejące w aktualnym checkoutcie,
- zmienione, dodane, skopiowane albo przemianowane względem taga bazowego,
- nieznajdujące się w `standards/template/`.

Nowe, jeszcze nieśledzone pliki Markdown w `standards/` też są brane pod uwagę. To ułatwia lokalne sprawdzenie zmian przed commitem.

Jeżeli w repozytorium nie ma żadnego taga bazowego, skrypt działa w trybie inicjalnym i przegląda wszystkie standardowe pliki Markdown poza `standards/template/`.

Bazę porównania można wymusić ręcznie:

```bash
bin/creative_process/stamp_standard_metadata \
  --version 1.2.0 \
  --base-ref v1.0.0
```

## Modyfikacja frontmatteru

Przed uruchomieniem:

```yaml
---
domain: repozytorium
since: 1.0.0
tags:
  - repozytorium
  - 1.0.0
---
```

Po uruchomieniu z `--version 1.2.0`:

```yaml
---
domain: repozytorium
since: 1.2.0
tags: [repozytorium, 1.2.0]
---
```

Pole `domain:` jest źródłem pierwszego tagu. Jeżeli dokument zawiera `domain:`, ale nie ma `tags:`, skrypt dodaje tagi przed końcem frontmatteru.

Jeżeli `tags:` już istnieje, jego dotychczasowa zawartość jest zastępowana:

```yaml
tags: [domain, version]
```

## Opcje

| Opcja | Domyślnie | Znaczenie |
| --- | --- | --- |
| `-v`, `--version` | `$CI_COMMIT_TAG` albo `$RELEASE_CANDIDATE_VERSION` | wersja zapisywana w `since:` i `tags:` |
| `-s`, `--standards-dir` | `standards` | katalog zawierający standardy |
| `-b`, `--base-ref` | ostatni tag na gałęzi domyślnej | ref używany jako baza porównania |
| `--default-branch` | `$CI_DEFAULT_BRANCH` albo `main` | gałąź używana do znalezienia ostatniego taga |
| `-h`, `--help` | | wyświetla pomoc |

## Wynik

Dla każdego zmodyfikowanego pliku skrypt wypisuje:

```text
Stamping standard metadata: 1.2.0
Diff base: v1.0.0
  updated: standards/repozytorium/STD-REPO-001/README.pl.md
```

Jeżeli żaden zmieniony plik nie zawiera `since:`, skrypt kończy się kodem `0` i wypisuje:

```text
No changed standards metadata to stamp.
```

!!! warning "Istniejące tagi są zastępowane"
    Skrypt nie zachowuje dodatkowych wartości z `tags:`. Docelowa wartość jest zawsze budowana z `domain:` oraz aktualnej wersji dyscypliny.
