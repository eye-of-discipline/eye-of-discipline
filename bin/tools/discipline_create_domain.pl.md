---
tags:
  - documentation
  - creative process
---

# Generator domen dyscypliny

`bin/tools/discipline_create_domain` tworzy nową domenę standardów i rejestruje ją w pliku:

```text
standards/domain.json
```

Domena porządkuje standardy według obszaru odpowiedzialności, na przykład `repozytorium`, `security` albo `release`. Każda domena ma:

| Pole | Znaczenie |
| --- | --- |
| `path` | nazwa katalogu w `standards/` |
| `gid` | krótki identyfikator używany w ID standardów |

Przykład wpisu:

```json
{
  "path": "repozytorium",
  "gid": "REPO"
}
```

## Użycie

```bash
bin/tools/discipline_create_domain repozytorium REPO
```

Skrypt:

1. waliduje argumenty,
2. tworzy katalog `standards/{path}`,
3. tworzy `standards/domain.json`, jeżeli plik jeszcze nie istnieje,
4. dopisuje domenę do rejestru,
5. blokuje duplikaty `path` i `gid`.

## Argumenty

| Argument | Przykład | Reguła |
| --- | --- | --- |
| `PATH` | `repozytorium` | mały slug: litery, cyfry, `_` albo `-` |
| `GID` | `REPO` | wielki identyfikator: litery i cyfry |

## Opcje

| Opcja | Domyślnie | Znaczenie |
| --- | --- | --- |
| `-s`, `--standards-dir` | `standards` | katalog standardów |
| `-d`, `--domains-file` | `standards/domain.json` | rejestr domen |
| `-h`, `--help` | | pomoc |

## Format `standards/domain.json`

Rejestr jest listą domen:

```json
[
  {
    "path": "repozytorium",
    "gid": "REPO"
  }
]
```

Lista jest sortowana po `path`, żeby zmiany w pliku były stabilne w review.

## Przykład nowej domeny

```bash
bin/tools/discipline_create_domain security SEC
```

Efekt:

```text
standards/security/
```

oraz wpis w `standards/domain.json`:

```json
{
  "path": "security",
  "gid": "SEC"
}
```

## Błędy

Skrypt kończy się błędem, gdy:

- `PATH` nie jest poprawnym slugiem,
- `GID` nie jest wielkim identyfikatorem,
- domena o tym `path` już istnieje w rejestrze,
- domena o tym `gid` już istnieje w rejestrze,
- katalog domeny już istnieje,
- `standards/domain.json` nie jest listą obiektów `{path, gid}`.
