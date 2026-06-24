---
tags:
  - documentation
  - verification process
---

# Walidacja deklaracji dyscypliny

`bin/verification_process/discipline_validate` waliduje kontrakt `discipline.yaml` przygotowany przez zespół developerski. To pierwszy techniczny krok procesu weryfikacji: zanim pipeline pobierze dyscyplinę i uruchomi checki standardów, musi mieć poprawną deklarację wersji, atestacji i odstępstw.

Skrypt nie mierzy zgodności ze standardami. Błąd walidacji oznacza, że deklaracja jest niepoprawna albo niejednoznaczna.

## Użycie

Domyślnie skrypt czyta `discipline.yaml` z bieżącego katalogu:

```bash
bin/verification_process/discipline_validate
```

Wskazanie innego pliku:

```bash
bin/verification_process/discipline_validate --file path/to/discipline.yaml
```

Tryb cichy wypisuje tylko błędy:

```bash
bin/verification_process/discipline_validate --file discipline.yaml --quiet
```

Pomoc:

```bash
bin/verification_process/discipline_validate --help
```

## Wymagania

Skrypt wymaga:

- Bash,
- `yq` zgodnego ze składnią `yq -r '.path' file`.

W pipeline GitLab skrypt może być pobierany z centralnego repozytorium dyscypliny i uruchamiany lokalnie na pliku `discipline.yaml` repozytorium aplikacji.

## Minimalna deklaracja

```yaml
apiVersion: eye-of-discipline.rachuna.dev/v1
kind: Discipline
metadata:
  name: my-service
spec:
  discipline:
    repository: dev.rachuna/eye-of-discipline
    ref: 1.0.0
```

## Walidowany kontrakt

Skrypt sprawdza wymagane pola:

| Pole | Wymaganie |
| --- | --- |
| `apiVersion` | musi mieć wartość `eye-of-discipline.rachuna.dev/v1` |
| `kind` | musi mieć wartość `Discipline` |
| `metadata.name` | musi istnieć i nie może być puste |
| `spec.discipline.repository` | musi istnieć i mieć format `owner/name` |
| `spec.discipline.ref` | musi istnieć i wyglądać jak wersja semver |

Przykładowe poprawne wartości:

```yaml
repository: dev.rachuna/eye-of-discipline
ref: 1.0.0
```

## Atestacje

Jeżeli `spec.attest` istnieje, musi być obiektem YAML:

```yaml
spec:
  attest:
    STD-REPO-002:
      r6: true
      r7: false
```

Walidator nie ocenia, czy dana atestacja jest wymagana ani czy jej wartość jest wystarczająca dla standardu. Na tym etapie sprawdzany jest tylko kształt danych. Interpretacja należy do checka standardu.

## Odstępstwa

Jeżeli `spec.exceptions` istnieje, musi być tablicą:

```yaml
spec:
  exceptions:
    - check: STD-REPO-002
      reason: "repozytorium jest w trakcie migracji"
      owner: platform-team
      expires: 2026-09-30
      ticket: ~
```

Każde odstępstwo musi mieć pola:

| Pole | Znaczenie |
| --- | --- |
| `check` | identyfikator standardu albo checka objętego odstępstwem |
| `reason` | powód odstępstwa |
| `owner` | właściciel długu technicznego |
| `expires` | data wygaśnięcia odstępstwa |

Walidator sprawdza obecność pól. Decyzja, czy odstępstwo jest aktywne, należy do późniejszego kroku procesu weryfikacji.

## Wynik

Dla poprawnej deklaracji skrypt wypisuje:

```text
discipline declaration is valid
  file: discipline.yaml
  repository: dev.rachuna/eye-of-discipline
  ref: 1.0.0-develop.3
```

Kod wyjścia: `0`.

Przykłady błędów:

```text
ERROR: discipline declaration not found: discipline.yaml
ERROR: invalid kind: expected 'Discipline', got 'ConfigMap'
ERROR: missing required field: spec.discipline.ref
ERROR: missing required field: spec.exceptions[0].expires
```

## Miejsce w procesie

`bin/verification_process/discipline_validate` powinien być uruchamiany przed pobraniem dyscypliny i przed jobami standardów:

```bash
bin/verification_process/discipline_validate --file discipline.yaml
```

Dopiero po poprawnej walidacji można uruchomić pomiar i agregację:

```bash
bin/verification_process/discipline_verify --discipline-file discipline.yaml --output conformance.json
```

!!! note "Walidacja nie jest pomiarem"
    Walidator odpowiada na pytanie: **czy deklaracja ma poprawny kontrakt?** Checki standardów odpowiadają na pytanie: **czy projekt spełnia wymagania?** Rozdzielenie tych kroków pozwala odróżnić błąd YAML-a od realnej niezgodności ze standardem.
