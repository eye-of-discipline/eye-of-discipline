---
tags:
  - documentation
  - creative process
---

# Generator standardu

`bin/tools/discipline_create_standard` tworzy szkielet nowego standardu na podstawie `standards/template`.

Generator:

1. sprawdza domenę w `standards/domain.json`,
2. odczytuje jej `gid`,
3. wyznacza kolejny identyfikator `STD-{GID}-{NNN}`,
4. tworzy dokumentację, check i definicję joba weryfikującego,
5. dopisuje standard do odpowiedniej domeny w `mkdocs.yml`.

## Użycie

```bash
bin/tools/discipline_create_standard \
  repozytorium \
  "Ochrona głównej gałęzi"
```

Jeżeli ostatnim standardem domeny jest `STD-REPO-003`, generator utworzy:

```text
standards/repozytorium/STD-REPO-004/
├── .gitlab-ci.yml
├── README.md
└── bin/
    └── checks
```

Do `mkdocs.yml` zostanie dodany link:

```yaml
- standards/repozytorium/STD-REPO-004/README.md
```

## Argumenty

| Argument | Przykład | Znaczenie |
| --- | --- | --- |
| `DOMAIN` | `repozytorium` | `path` domeny z `standards/domain.json` |
| `STANDARD NAME` | `"Ochrona głównej gałęzi"` | tytuł standardu; nazwę ze spacjami należy ująć w cudzysłów |

## Opcje

| Opcja | Domyślnie | Znaczenie |
| --- | --- | --- |
| `-s`, `--standards-dir` | `standards` | katalog standardów |
| `-d`, `--domains-file` | `standards/domain.json` | rejestr domen |
| `-t`, `--template-dir` | `standards/template` | katalog szablonu |
| `-m`, `--mkdocs-file` | `mkdocs.yml` | konfiguracja nawigacji MkDocs |
| `-h`, `--help` | | wyświetla pomoc |

## Nadawanie identyfikatora

Generator pobiera `gid` domeny z `standards/domain.json`:

```json
{
  "path": "repozytorium",
  "gid": "REPO"
}
```

Następnie wyszukuje katalogi pasujące do `STD-REPO-NNN` i zwiększa najwyższy numer o jeden. Usunięty identyfikator nie jest ponownie wykorzystywany, jeżeli w katalogu nadal istnieje standard z wyższym numerem.

## Szablon

`standards/template` zawiera:

| Plik szablonu | Plik wynikowy |
| --- | --- |
| `README.md.tpl` | `README.md` |
| `.gitlab-ci.yml.tpl` | `.gitlab-ci.yml` |
| `bin/checks.tpl` | `bin/checks` |

Obsługiwane placeholdery:

- `{{STD_ID}}`,
- `{{DOMAIN_PATH}}`,
- `{{DOMAIN_GID}}`,
- `{{STANDARD_NAME}}`.

Rozszerzenie `.tpl` zapobiega potraktowaniu szablonu jako aktywnego standardu przez MkDocs i generator jobów.

!!! warning "Nowy check celowo nie przechodzi"
    Wygenerowany `bin/checks` kończy się kodem `120`. Zespół dyscypliny musi zaimplementować właściwy pomiar przed publikacją standardu. Dzięki temu pusty check nie może zostać uznany za zgodność.

## Błędy

Generator kończy się błędem, gdy:

- domena nie istnieje w `standards/domain.json`,
- rejestr domen albo szablon jest niepoprawny,
- katalog wyliczonego standardu już istnieje,
- nie można odnaleźć sekcji nawigacji dyscypliny w `mkdocs.yml`,
- szablon nie utworzył `README.md`, `.gitlab-ci.yml` albo `bin/checks`.
