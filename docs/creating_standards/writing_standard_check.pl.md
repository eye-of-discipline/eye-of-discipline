---
tags:
  - documentation
  - standards writing
  - checks
---

# Pisanie checka standardu

Check standardu to skrypt, który odpowiada na jedno pytanie:

```text
Czy repozytorium spełnia wymaganie opisane w standardzie?
```

Nie trzeba pisać idealnego frameworka. Wystarczy prosty, czytelny skrypt, który sprawdza wymaganie, wypisuje zrozumiały komunikat i kończy się właściwym kodem.

## Zanim zaczniesz

Najpierw musi istnieć dokumentacja standardu. Check nie powinien wymyślać normy w kodzie. Ma mierzyć to, co jest zapisane w `README.md`.

Przed implementacją odpowiedz na trzy pytania:

| Pytanie | Przykład odpowiedzi |
| --- | --- |
| Co sprawdzam? | Czy główna gałąź jest chroniona |
| Skąd biorę dane? | Z pliku w repozytorium, GitLab API albo `discipline.yaml` |
| Co oznacza błąd? | Brak ochrony gałęzi oznacza `fail` |

Jeżeli nie potrafisz odpowiedzieć na te pytania, wróć do dokumentacji standardu.

## Gdzie jest check

Check standardu znajduje się w katalogu standardu:

```text
standards/{domena}/{STD_ID}/bin/checks
```

Przykład:

```text
standards/repozytorium/STD-REPO-001/bin/checks
```

Job weryfikujący uruchamia ten plik przez zmienną:

```text
STD_CHECK_SCRIPT=/tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
```

## Kontrakt kodów wyjścia

Check powinien używać prostych kodów:

| Kod | Znaczenie |
| --- | --- |
| `0` | standard jest spełniony |
| `1` | standard nie jest spełniony |
| `120` | check nie jest zaimplementowany albo nie ma warunków do wykonania pomiaru |

Kod `101` jest zarezerwowany dla template'u `.dyscypline`, który obsługuje aktywne odstępstwa. Check standardu zwykle nie powinien sam zwracać `101`.

## Minimalny check

Najprostszy check w Bash:

```bash
#!/usr/bin/env bash
set -euo pipefail

if [[ -f README.md ]]; then
    echo "OK: README.md exists"
    exit 0
fi

echo "FAIL: README.md does not exist"
exit 1
```

Ten przykład sprawdza lokalny plik. W realnym standardzie komunikat powinien mówić dokładnie, co trzeba poprawić.

## Struktura skryptu

Dla większości checków wystarczy taka struktura:

```bash
#!/usr/bin/env bash
set -euo pipefail

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

pass() {
    printf 'OK: %s\n' "$*"
    exit 0
}

command -v yq >/dev/null 2>&1 || fail "required command not found: yq"

if [[ ! -f discipline.yaml ]]; then
    fail "discipline.yaml not found"
fi

value="$(yq -r '.metadata.name // ""' discipline.yaml)"

if [[ -z "$value" ]]; then
    fail "metadata.name is empty in discipline.yaml"
fi

pass "metadata.name is set: $value"
```

Taki układ daje:

- jasne miejsce na błędy,
- jeden pozytywny koniec,
- czytelne komunikaty w logu joba,
- przewidywalne zachowanie w CI.

## Czytanie `discipline.yaml`

Jeżeli standard wymaga atestacji manualnej, check może czytać `spec.attest`.

Przykład:

```bash
#!/usr/bin/env bash
set -euo pipefail

STD_ID="${STD_ID:-STD-REPO-002}"
DISCIPLINE_FILE="${DISCIPLINE_FILE:-discipline.yaml}"

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

pass() {
    printf 'OK: %s\n' "$*"
    exit 0
}

command -v yq >/dev/null 2>&1 || fail "required command not found: yq"
[[ -f "$DISCIPLINE_FILE" ]] || fail "missing file: $DISCIPLINE_FILE"

attested="$(STD_ID="$STD_ID" yq -r '.spec.attest[env.STD_ID].r6 // false' "$DISCIPLINE_FILE")"

if [[ "$attested" != "true" ]]; then
    fail "requirement r6 is not attested for $STD_ID"
fi

pass "requirement r6 is attested for $STD_ID"
```

Dokumentacja standardu musi wtedy wyjaśnić, czym jest `r6` i co zespół potwierdza wartością `true`.

## Sprawdzanie plików w repozytorium

Jeżeli check sprawdza plik w repozytorium aplikacji, pamiętaj, że uruchamia się w katalogu roboczym projektu aplikacji, a nie w katalogu standardu.

Przykład:

```bash
required_file=".gitlab-ci.yml"

if [[ ! -f "$required_file" ]]; then
    echo "FAIL: missing required file: $required_file" >&2
    exit 1
fi

echo "OK: required file exists: $required_file"
exit 0
```

Jeżeli check potrzebuje własnych plików standardu, odwołuj się do ścieżki w `/tmp/discipline/standards/...` albo ustaw taką ścieżkę w jobie.

## Sprawdzanie GitLab API

Jeżeli standard wymaga danych z GitLaba, check powinien jasno walidować wymagane zmienne środowiskowe.

Przykład szkieletu:

```bash
#!/usr/bin/env bash
set -euo pipefail

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

require_env() {
    local name="$1"
    [[ -n "${!name:-}" ]] || fail "required environment variable is empty: $name"
}

require_env CI_API_V4_URL
require_env CI_PROJECT_ID
require_env CI_JOB_TOKEN

project_url="${CI_API_V4_URL}/projects/${CI_PROJECT_ID}"

response="$(
    curl -fsSL \
        --header "JOB-TOKEN: ${CI_JOB_TOKEN}" \
        "$project_url"
)"

visibility="$(printf '%s' "$response" | jq -r '.visibility')"

if [[ "$visibility" == "private" ]]; then
    echo "OK: project visibility is private"
    exit 0
fi

fail "project visibility is $visibility, expected private"
```

Taki check wymaga obrazu z `curl` i `jq`. Jeżeli standard potrzebuje tych narzędzi, wpisz odpowiedni obraz w `.gitlab-ci.yml` standardu.

## Komunikaty w logu

Komunikat błędu powinien być pisany dla zespołu, który ma naprawić repozytorium.

Słaby komunikat:

```text
FAIL
```

Lepszy komunikat:

```text
FAIL: main branch is not protected. Enable branch protection for the default branch.
```

Dobry komunikat mówi:

- co jest nie tak,
- czego oczekuje standard,
- gdzie zacząć naprawę.

## Test lokalny

Przed commitem uruchom check lokalnie z katalogu repozytorium:

```bash
bash standards/repozytorium/STD-REPO-001/bin/checks
```

Sprawdź też składnię:

```bash
bash -n standards/repozytorium/STD-REPO-001/bin/checks
```

Jeżeli masz ShellCheck:

```bash
shellcheck -x standards/repozytorium/STD-REPO-001/bin/checks
```

## Najczęstsze błędy

| Błąd | Skutek |
| --- | --- |
| check sprawdza coś innego niż dokumentacja | standard jest niewiarygodny |
| brak czytelnego komunikatu | zespół nie wie, co poprawić |
| ignorowanie brakujących narzędzi | job kończy się przypadkowym błędem |
| zbyt wiele logiki w jednym skrypcie | trudno utrzymać check |
| użycie `exit 0` mimo niepewnego wyniku | pipeline pokazuje fałszywą zgodność |

!!! note "AI może pomóc, ale kontrakt musi być jasny"
    Możesz użyć AI do napisania pierwszej wersji checka. Najpierw opisz wymaganie, źródło danych, oczekiwany wynik `pass`, warunek `fail` i narzędzia dostępne w jobie. Bez tych informacji AI najczęściej napisze skrypt, który wygląda poprawnie, ale mierzy nie to, co trzeba.

