---
tags:
  - documentation
  - standards writing
  - creative process
---

# Tworzenie domeny dokumentacji

Domena dokumentacji porządkuje standardy według obszaru odpowiedzialności. Nie jest kategorią wizualną w MkDocs, tylko częścią modelu dyscypliny: wpływa na katalog standardów, identyfikatory `STD-{GID}-{NNN}` i strukturę nawigacji.

Przykład domeny:

```json
{
  "path": "repozytorium",
  "gid": "REPO"
}
```

Taka domena oznacza, że standardy trafiają do:

```text
standards/repozytorium/
```

a ich identyfikatory mają postać:

```text
STD-REPO-001
STD-REPO-002
STD-REPO-003
```

## Kiedy tworzyć domenę

Nową domenę warto utworzyć wtedy, gdy standard dotyczy innego obszaru odpowiedzialności niż istniejące standardy.

Dobra domena:

- grupuje kilka potencjalnych standardów,
- ma jasną odpowiedzialność,
- nie miesza poziomów abstrakcji,
- ma nazwę zrozumiałą dla zespołów developerskich.

Przykłady sensownych domen:

| Domena | Zakres |
| --- | --- |
| `repozytorium` | struktura repozytorium, branch protection, code review, pliki wymagane |
| `release` | wersjonowanie, changelog, publikacja artefaktów |
| `security` | sekrety, zależności, skanowanie, polityki bezpieczeństwa |
| `observability` | logi, metryki, alerty i śledzenie działania usług |

Nie twórz domeny dla pojedynczego narzędzia, jeżeli standard dotyczy szerszego problemu. Na przykład `gitlab` jest zwykle gorszą domeną niż `repozytorium`, jeżeli wymaganie opisuje sposób pracy z repozytorium, a nie samo API GitLaba.

## Nazewnictwo

Każda domena ma dwa pola:

| Pole | Reguła | Przykład |
| --- | --- | --- |
| `path` | mały slug używany jako katalog | `repozytorium` |
| `gid` | krótki identyfikator używany w ID standardu | `REPO` |

`path` powinien być stabilny. Zmiana ścieżki domeny oznacza zmianę linków w dokumentacji i przeniesienie standardów.

`gid` powinien być krótki i jednoznaczny. Po opublikowaniu standardów nie powinien się zmieniać, bo jest częścią trwałych identyfikatorów.

## Utworzenie domeny

Domenę tworzy narzędzie:

```bash
bin/tools/discipline_create_domain repozytorium REPO
```

Skrypt:

1. waliduje `path` i `gid`,
2. tworzy katalog `standards/{path}`,
3. dopisuje domenę do `standards/domain.json`,
4. blokuje duplikaty ścieżek i identyfikatorów.

Po utworzeniu domeny można tworzyć w niej standardy:

```bash
bin/tools/discipline_create_standard \
  repozytorium \
  "Ochrona głównej gałęzi"
```

## Nawigacja

Standardy domeny są publikowane w MkDocs w sekcji:

```yaml
Zasady dyscypliny:
  Repozytorium:
    - standards/repozytorium/STD-REPO-001/README.md
```

Generator standardu dopisuje nowy dokument do `mkdocs.yml`. Po zmianie warto uruchomić build dokumentacji, żeby wykryć błędne linki albo niepoprawną strukturę:

```bash
mkdocs build --strict
```

## Review domeny

Review nowej domeny powinien odpowiedzieć na pytania:

| Pytanie | Dlaczego jest ważne |
| --- | --- |
| Czy domena opisuje obszar odpowiedzialności, a nie narzędzie? | domeny mają porządkować standardy długoterminowo |
| Czy `gid` jest jednoznaczny? | identyfikator trafi do wszystkich standardów domeny |
| Czy domena może pomieścić więcej niż jeden standard? | domena dla jednego wymagania zwykle jest zbyt szczegółowa |
| Czy nazwa będzie zrozumiała dla zespołu developerskiego? | odbiorcy czytają portal po domenach |

!!! warning "Nie zmieniaj domeny bez powodu"
    Przeniesienie opublikowanego standardu między domenami zmienia jego ścieżkę dokumentacji. Jeżeli standard ma już identyfikator i jest używany w `discipline.yaml`, decyzja o zmianie domeny powinna być traktowana jak zmiana produktu, nie kosmetyka.

