---
tags:
  - documentation
  - verification process
---

# GitHub Actions jako bramka jakości dyscypliny

Workflow `.github/workflows/verification-process.yml` jest centralnym procesem weryfikacji zgodności z dyscypliną dla GitHub Actions. Repozytorium aplikacji nie powinno kopiować całego procesu do siebie. Powinno wywołać go jako reusable workflow i potraktować jako bramkę jakości.

Najważniejszy element integracji:

```yaml
jobs:
  discipline-verification:
    name: Eye discipline quality gate
    uses: eye-of-discipline/eye-of-discipline/.github/workflows/verification-process.yml@main
    secrets: inherit
```

Takie wywołanie dodaje do pipeline'u aplikacji:

- walidację `discipline.yaml`,
- joby standardów zebrane w `.github/workflows/checks-jobs.yml`,
- raporty `results/{STD_ID}.json`,
- agregację wyników do `conformance.json`,
- decyzję bramki jakości.

## Miejsce w głównym CI

Proces weryfikacji dyscypliny jest częścią głównego CI aplikacji. Nie zastępuje builda, testów jednostkowych ani deploymentu. Działa jako dodatkowa bramka jakości, która odpowiada na pytanie:

```text
czy repozytorium spełnia standardy zadeklarowanej wersji dyscypliny?
```

Minimalny przykład workflow w repozytorium aplikacji:

```yaml
name: Discipline verification

on:
  push:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  discipline-verification:
    name: Eye discipline quality gate
    uses: eye-of-discipline/eye-of-discipline/.github/workflows/verification-process.yml@main
    secrets: inherit
```

GitHub Actions nie ma odpowiednika GitLabowego `include`, który wstrzykuje dowolny fragment YAML do pipeline'u. Odpowiednikiem w tym procesie jest reusable workflow wywoływany przez `jobs.<job>.uses`.

## Wymagane pliki w repozytorium aplikacji

Repozytorium aplikacji musi zawierać:

| Plik | Rola |
| --- | --- |
| `discipline.yaml` | deklaracja wersji dyscypliny, atestacji i odstępstw |

Repozytorium aplikacji nie musi trzymać lokalnej kopii:

- `.github/workflows/verification-process.yml`,
- `.github/workflows/checks-jobs.yml`,
- `bin/verification_process/discipline_validate`,
- `bin/verification_process/discipline_verify`.

Workflow pobiera zadeklarowaną wersję dyscypliny z `discipline.yaml`, a narzędzia procesu z wersji repozytorium, z której uruchomiono reusable workflow.

Minimalna deklaracja:

```yaml
apiVersion: eye-of-discipline.rachuna.dev/v1
kind: Discipline
metadata:
  name: my-service
spec:
  discipline:
    repository: eye-of-discipline/eye-of-discipline
    ref: 1.0.0
```

`spec.discipline.repository` mówi, z którego repozytorium pobrać dyscyplinę. `spec.discipline.ref` mówi, której wersji albo gałęzi dyscypliny użyć do pomiaru.

Dla kompatybilności z deklaracjami GitLab workflow mapuje:

```text
dev.rachuna/eye-of-discipline -> eye-of-discipline/eye-of-discipline
```

## Wejścia workflow

`.github/workflows/verification-process.yml` udostępnia `workflow_call` z następującymi wejściami:

| Input | Domyślna wartość | Znaczenie |
| --- | --- | --- |
| `discipline-file` | `discipline.yaml` | plik deklaracji zespołu |
| `conformance-file` | `conformance.json` | końcowy raport zgodności |
| `discipline-repository` | `eye-of-discipline/eye-of-discipline` | fallback repozytorium dyscypliny |
| `discipline-ref` | `main` | fallback ref dyscypliny |

Workflow może też dostać opcjonalny sekret:

| Secret | Znaczenie |
| --- | --- |
| `GH_TOKEN` | token używany do checkoutu prywatnych repozytoriów dyscypliny |

Jeżeli repozytoria są publiczne, wystarcza domyślny `github.token`.

## Struktura procesu

Proces składa się z trzech części:

| Element | Job / plik | Odpowiedzialność |
| --- | --- | --- |
| walidacja deklaracji | `👁️ Eye discipline:Validate discipline declaration` | sprawdza kontrakt `discipline.yaml` |
| joby standardów | `.github/workflows/checks-jobs.yml` | uruchamia joby standardów i zapisuje `results/{STD_ID}.json` |
| agregacja wyników | `🪬 Eye discipline:Verify discipline standards` | buduje `conformance.json` i zwraca decyzję bramki jakości |

Przepływ:

```text
👁️ Eye discipline:Validate discipline declaration
      |
      v
👁️ Eye discipline:Verify standard jobs
      |
      v
🪬 Eye discipline:Verify discipline standards
```

Job `👁️ Eye discipline:Verify standard jobs` wywołuje drugi reusable workflow:

```yaml
uses: ./.github/workflows/checks-jobs.yml
```

## Dwa źródła kodu

Workflow używa dwóch checkoutów:

| Katalog | Źródło | Zastosowanie |
| --- | --- | --- |
| `.discipline-source` | `spec.discipline.repository` i `spec.discipline.ref` | wersja dyscypliny zadeklarowana przez aplikację, w tym standardy i checki |
| `.discipline-process-source` | repozytorium/ref reusable workflow | aktualne narzędzia procesu weryfikacji |

Rozdzielenie jest potrzebne, ponieważ starszy tag dyscypliny może zawierać standardy, ale nie musi jeszcze zawierać najnowszych skryptów procesu:

```text
bin/verification_process/discipline_validate
bin/verification_process/discipline_verify
```

Jeżeli skrypt istnieje w `.discipline-source`, workflow używa wersji z zadeklarowanej dyscypliny. Jeżeli go tam nie ma, używa wersji z `.discipline-process-source`.

## Walidacja deklaracji

Job:

```text
👁️ Eye discipline:Validate discipline declaration
```

działa w kontenerze:

```text
ghcr.io/eye-of-discipline/image-python:1.0.0
```

Job wykonuje:

1. checkout repozytorium aplikacji,
2. odczyt `spec.discipline.repository` i `spec.discipline.ref`,
3. checkout zadeklarowanej wersji dyscypliny,
4. checkout repozytorium procesu,
5. uruchomienie `discipline_validate`.

Walidator sprawdza:

- obecność pliku,
- `apiVersion`,
- `kind`,
- `metadata.name`,
- `spec.discipline.repository`,
- `spec.discipline.ref`,
- strukturę atestacji,
- strukturę odstępstw.

Błąd walidacji oznacza błąd deklaracji, a nie niezgodność ze standardem.

## Joby standardów

Każdy standard ma własny job źródłowy w katalogu standardu:

```text
standards/{domain}/{STD_ID}/.github-actions.yml
```

Proces wytwórczy skleja te definicje do:

```text
.github/workflows/checks-jobs.yml
```

Obowiązuje zasada:

```text
jeden standard = jeden job = jeden raport results/{STD_ID}.json
```

Przykładowy job:

```yaml
std-repo-001:
  name: 👁️ Eye discipline:STD-REPO-001
  runs-on: ubuntu-latest
  container:
    image: ghcr.io/eye-of-discipline/image-python:1.0.0
  env:
    STD_DOMAIN: repository
    STD_ID: STD-REPO-001
    DOCS_MD_FILE_PATH: standards/repository/STD-REPO-001/README.en.md
    STD_CHECK_SCRIPT: .discipline-source/standards/repository/STD-REPO-001/bin/checks
```

Job standardu:

- checkoutuje repozytorium aplikacji,
- checkoutuje zadeklarowaną wersję dyscypliny,
- checkoutuje repozytorium procesu,
- kopiuje narzędzia `bin/`,
- sprawdza aktywne odstępstwo dla `STD_ID`,
- uruchamia `bin/checks`,
- zapisuje `results/{STD_ID}.json`,
- publikuje raport jako artifact.

## Odstępstwa

Job standardu sprawdza `spec.exceptions[]` w `discipline.yaml`.

Jeżeli istnieje aktywne odstępstwo dla `STD_ID`, job zapisuje raport:

```json
{"key":"STD-REPO-001","status":"waived","exception":{"check":"STD-REPO-001","reason":"migration","owner":"platform-team","expires":"2026-09-30"}}
```

Jeżeli `expires` jest wcześniejsze niż bieżąca data UTC, odstępstwo jest ignorowane i check uruchamia się normalnie.

Aktywne odstępstwo nie oznacza zwykłego sukcesu. Jest raportowane jako `waived`, a agregator kończy wynik jako `pass_with_waivers`.

## Status joba standardu

Job standardu zawsze próbuje najpierw zapisać i wysłać raport:

```yaml
- name: Upload standard report
  if: always()
  uses: actions/upload-artifact@v7
```

Jeżeli check zwrócił `fail` i nie ma aktywnego odstępstwa, ostatni krok oznacza job jako failed:

```yaml
- name: Fail standard job
  if: always() && steps.check.outputs.status == 'fail' && steps.waiver.outputs.status != 'active'
  run: exit 1
```

Dzięki temu wynik pojedynczego standardu jest czerwony w GitHub Actions, ale raport `results/{STD_ID}.json` nadal jest dostępny dla agregatora.

## Agregacja wyników

Job:

```text
🪬 Eye discipline:Verify discipline standards
```

pobiera artefakty `results-*`, scala je do katalogu `results/`, a następnie uruchamia:

```bash
discipline_verify \
  --results-dir results \
  --discipline-file "$DISCIPLINE_FILE" \
  --output "$CONFORMANCE_FILE"
```

Skrypt czyta `results/*.json`, buduje `conformance.json` i wypisuje komunikat dla odbiorcy pipeline'u.

Możliwe statusy końcowe:

| Status | Znaczenie |
| --- | --- |
| `pass` | wszystkie standardy przeszły |
| `pass_with_waivers` | są niezgodności, ale wszystkie są objęte aktywnym odstępstwem |
| `fail` | istnieje niezgodność bez aktywnego odstępstwa |
| `error` | nie udało się odczytać części raportów |
| `no_checks` | nie znaleziono `results/*.json` |

## Bramka jakości

Job agregacji jest bramką jakości dla głównego pipeline'u CI.

Kody wyjścia mają następujące znaczenie:

| Kod | Znaczenie | Skutek |
| --- | --- | --- |
| `0` | wszystko ok | pipeline przechodzi |
| `101` | nie ok, ale wszystkie niezgodności mają aktywne odstępstwo | workflow zamienia ten kod na sukces |
| `1` | nie ok i brak odstępstwa albo błąd agregacji | pipeline jest zablokowany |

W GitHub Actions nie ma `allow_failure` takiego jak w GitLab CI. Dlatego `verification-process.yml` przechwytuje kod `101` i kończy job sukcesem:

```bash
if [ "$verify_rc" -eq 101 ]; then
  exit 0
fi
```

Realna niezgodność bez odstępstwa kończy job kodem `1`.

## Artefakty

Joby standardów zapisują:

```text
results/
```

Artifact ma nazwę:

```text
results-{STD_ID}
```

W aktualnej konfiguracji raporty standardów mają:

```yaml
retention-days: 90
```

GitHub Actions nie wspiera artefaktów z retencją `never`. Retencja nie może przekroczyć limitu ustawionego dla repozytorium, organizacji albo enterprise.

Job agregacji zapisuje:

```text
conformance.json
```

`conformance.json` jest artifactem CI. Nie powinien być commitowany do repozytorium aplikacji, ponieważ opisuje wynik konkretnego uruchomienia workflow.

## Minimalna integracja

Minimalna integracja w repozytorium aplikacji składa się z dwóch elementów:

1. Plik `discipline.yaml`.
2. Workflow wywołujący reusable workflow:

```yaml
jobs:
  discipline-verification:
    name: Eye discipline quality gate
    uses: eye-of-discipline/eye-of-discipline/.github/workflows/verification-process.yml@main
    secrets: inherit
```

Repozytorium aplikacji nie musi przenosić `checks-jobs.yml`, `discipline_validate` ani `discipline_verify`. Są one częścią wersjonowanego procesu w repozytorium dyscypliny.
