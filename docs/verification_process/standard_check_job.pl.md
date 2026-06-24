---
tags:
  - documentation
  - verification process
---

# Definicja joba weryfikującego

Job weryfikujący jest miejscem, w którym konkretny standard zostaje zamieniony na pomiar wykonywany w pipeline aplikacji. To warstwa między walidacją `discipline.yaml` a końcową oceną zgodności z dyscypliną.

Walidator deklaracji odpowiada na pytanie: **czy wiemy, jaką dyscyplinę uruchomić?**

Job weryfikujący odpowiada na pytanie: **czy dany standard został spełniony?**

Ocena zgodności odpowiada na pytanie: **jaki jest łączny wynik dyscypliny?**

## Rola joba

Każdy standard ma własny job, ponieważ każdy standard może wymagać innego zestawu narzędzi, obrazu kontenera, zmiennych, zależności albo sposobu uruchomienia checka.

Obowiązuje zasada:

```text
jeden standard = jeden job = jeden raport results/{STD_ID}.json
```

Dzięki temu proces weryfikujący nie narzuca jednej sztywnej implementacji pomiaru. Standard sam definiuje, jak zostanie sprawdzony, a pipeline wymaga tylko wspólnego kontraktu wyniku.

## Gdzie powstaje definicja

Definicja joba standardu jest utrzymywana przy standardzie:

```text
standards/{domena}/{STD_ID}/.gitlab-ci.yml
```

Proces wytwórczy zbiera te definicje i generuje plik:

```text
ci/gitlab/verify/cheks_jobs.yml
```

Pipeline aplikacji dołącza ten plik:

```yaml
include:
  - local: ci/gitlab/verify/cheks_jobs.yml
```

W efekcie repozytorium aplikacji uruchamia joby standardów opublikowane w wybranej wersji dyscypliny.

## Template `.dyscypline`

Wspólną bazą dla jobów standardów jest template:

```yaml
.dyscypline:
  stage: validate
  extends:
    - .before_script
    - .after_script
  allow_failure:
    exit_codes:
      - 101
      - 120
  artifacts:
    paths:
      - results/
    when: always
    expire_in: 1 day
```

Template zapewnia elementy procesu, które muszą być wspólne dla wszystkich standardów:

- pobranie repozytorium dyscypliny wskazanego w `discipline.yaml`,
- sprawdzenie aktywnego odstępstwa dla `STD_ID`,
- zapis raportu `results/{STD_ID}.json`,
- wystawienie artefaktu `results/`,
- komunikat z linkiem do dokumentacji standardu.

## Pobranie dyscypliny

Przed uruchomieniem checka template odczytuje repozytorium i ref z deklaracji zespołu:

```yaml
before_script:
  - |
    DISCIPLINE_REPOSITORY=$(yq '.spec.discipline.repository' discipline.yaml | tr -d '"')
    DISCIPLINE_REF=$(yq '.spec.discipline.ref' discipline.yaml | tr -d '"')

    glab repo clone "${DISCIPLINE_REPOSITORY}" /tmp/discipline -- --branch "${DISCIPLINE_REF}" --depth 1
    cp /tmp/discipline/bin/* bin/
```

Dzięki temu check standardu jest uruchamiany z tej samej wersji dyscypliny, którą zespół zadeklarował w `discipline.yaml`.

## Odstępstwa

Template sprawdza, czy w `spec.exceptions[]` istnieje odstępstwo dla aktualnego `STD_ID`:

```yaml
before_script:
  - |
    exception_json=$(STD_ID="$STD_ID" yq -r '.spec.exceptions[]? | select(.check == env.STD_ID) | @json' "$DISCIPLINE_FILE" | head -n 1)
    if [ -n "$exception_json" ]; then
      expires=$(printf '%s' "$exception_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("expires", ""))')
      today=$(date -u +%F)

      if [ -n "$expires" ] && [ "$expires" \< "$today" ]; then
        echo "Odstępstwo dla standardu ${STD_ID} wygasło ${expires}; standard zostanie zweryfikowany normalnie."
      else
        mkdir -p .discipline
        printf '%s\n' "$exception_json" > .discipline/exception.json
        echo "Standard ${STD_ID} uzyskał odstępstwo ważne do ${expires:-bez terminu}."
        exit 101
      fi
    fi
```

Kod `101` oznacza, że standard ma aktywne odstępstwo. Job może zakończyć się jako `allow_failure`, ale `after_script` nadal zapisuje raport `waived`, który później trafia do `conformance.json`.

Jeżeli `expires` jest wcześniejsze niż bieżąca data UTC, odstępstwo jest ignorowane i check uruchamia się normalnie.

## Job standardu

Wygenerowany job standardu rozszerza `.dyscypline` i ustawia zmienne wymagane przez template:

```yaml
👁️ Eye discipline:STD-REPO-001:
  image: registry.gitlab.com/dev.rachuna/artifacts/containers/python:1.2.1
  extends:
    - .dyscypline
  variables:
    STD_DOMAIN: repozytorium
    STD_ID: STD-REPO-001
    DOCS_MD_FILE_PATH: standards/repozytorium/STD-REPO-001/README.md
    STD_CHECK_SCRIPT: /tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
  script:
    - |
      if [ ! -f "$STD_CHECK_SCRIPT" ]; then
        echo "Standard check script not found: $STD_CHECK_SCRIPT"
        exit 120
      fi

      bash "$STD_CHECK_SCRIPT"
  allow_failure:
    exit_codes:
      - 101
      - 120
```

Najważniejszym elementem jest `STD_CHECK_SCRIPT`. To on wskazuje właściwy skrypt pomiarowy standardu:

```text
/tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
```

Sam pipeline nie musi wiedzieć, co znajduje się w `bin/checks`. Standard może sprawdzać pliki, konfigurację GitLaba, artefakty, strukturę repozytorium albo dane z `discipline.yaml`.

## Zmienne kontraktu

| Zmienna | Rola |
| --- | --- |
| `STD_DOMAIN` | domena standardu, na przykład `repozytorium` |
| `STD_ID` | identyfikator standardu, na przykład `STD-REPO-001` |
| `DOCS_MD_FILE_PATH` | ścieżka do dokumentacji standardu używana w komunikacie dla zespołu |
| `STD_CHECK_SCRIPT` | ścieżka do skryptu `bin/checks` w pobranej wersji dyscypliny |
| `DISCIPLINE_FILE` | deklaracja zespołu, domyślnie `discipline.yaml` |

`STD_ID` jest kluczowe, bo łączy:

- definicję joba,
- odstępstwo w `spec.exceptions[]`,
- raport `results/{STD_ID}.json`,
- wpis w końcowym `conformance.json`.

## Kody wyjścia

| Kod | Znaczenie | Skutek |
| --- | --- | --- |
| `0` | check standardu przeszedł | raport `pass` |
| `1` | check standardu wykrył niezgodność | raport `fail` |
| `101` | istnieje aktywne odstępstwo | raport `waived` |
| `120` | brak skryptu checka albo niezaimplementowany check | dozwolona porażka techniczna joba |

Kod `120` jest używany po to, żeby pusta albo niegotowa definicja standardu nie została przypadkowo uznana za zgodność.

## Raport standardu

Po zakończeniu joba template zapisuje raport:

```yaml
after_script:
  - |
    mkdir -p results
    if [ -f .discipline/exception.json ]; then
      exception_json=$(tr -d '\n' < .discipline/exception.json)
      printf '{"key":"%s","status":"waived","exception":%s}\n' "$STD_ID" "$exception_json" > "results/${STD_ID}.json"
    else
      STATUS=$([[ "$CI_JOB_STATUS" == "success" ]] && echo "pass" || echo "fail")
      echo "{\"key\":\"${STD_ID}\",\"status\":\"${STATUS}\"}" > "results/${STD_ID}.json"
    fi
```

Minimalny raport pozytywny:

```json
{"key":"STD-REPO-001","status":"pass"}
```

Raport niezgodności:

```json
{"key":"STD-REPO-001","status":"fail"}
```

Raport odstępstwa:

```json
{"key":"STD-REPO-002","status":"waived","exception":{"check":"STD-REPO-002","reason":"repozytorium jest w trakcie migracji","owner":"platform-team","expires":"2026-09-30"}}
```

Ten raport jest wejściem dla `bin/verification_process/discipline_verify`.

## Granica odpowiedzialności

Template `.dyscypline` odpowiada za mechanikę procesu.

Job standardu odpowiada za uruchomienie właściwego checka.

Skrypt `bin/checks` odpowiada za ocenę konkretnej normy.

Agregator `bin/verification_process/discipline_verify` odpowiada za końcową decyzję bramki jakości.
