# Ocena zgodności z dyscypliną

Skrypt `bin/verification_process/discipline_verify` sprawdza, czy repozytorium spełnia wymagania zadeklarowanej dyscypliny. Skrypt czyta raporty `results/*.json` przygotowane przez joby standardów, buduje końcowy raport `conformance.json` i zwraca kod wyjścia używany przez bramkę jakości pipeline'u.

To jest końcowy etap procesu weryfikacji. Wynik skryptu mówi, czy wymagane standardy zostały spełnione, czy istnieją tylko zaakceptowane odstępstwa, albo czy pipeline powinien zostać zablokowany.

## Użycie

Domyślnie skrypt czyta raporty z katalogu `results/` i zapisuje `conformance.json`:

```bash
bin/verification_process/discipline_verify
```

Wskazanie katalogu z raportami:

```bash
bin/verification_process/discipline_verify --results-dir results
```

Wskazanie pliku wyjściowego:

```bash
bin/verification_process/discipline_verify --output conformance.json
```

Wskazanie pliku deklaracji dyscypliny:

```bash
bin/verification_process/discipline_verify --discipline-file discipline.yaml
```

Pełny przykład:

```bash
bin/verification_process/discipline_verify \
  --results-dir results \
  --discipline-file discipline.yaml \
  --output conformance.json
```

Pomoc:

```bash
bin/verification_process/discipline_verify --help
```

## Wymagania

Skrypt wymaga:

- Python 3,
- raportów JSON wygenerowanych przez joby standardów.

Skrypt nie wymaga `yq`. Nie waliduje kontraktu `discipline.yaml`; za ten krok odpowiada `bin/verification_process/discipline_validate`.

## Zmienne środowiskowe

Jeżeli argumenty nie zostaną podane, skrypt korzysta z wartości domyślnych i zmiennych środowiskowych:

| Zmienna | Znaczenie | Domyślna wartość |
| --- | --- | --- |
| `CONFORMANCE_FILE` | plik wyjściowy raportu QA dyscypliny | `conformance.json` |
| `DISCIPLINE_FILE` | ścieżka do deklaracji zespołu | `discipline.yaml` |
| `CI_PIPELINE_ID` | identyfikator pipeline'u GitLab | puste |
| `CI_PIPELINE_SOURCE` | źródło pipeline'u GitLab | puste |
| `CI_COMMIT_REF_NAME` | ref pipeline'u | puste |
| `CI_COMMIT_SHA` | SHA commita | puste |
| `CI_PIPELINE_URL` | URL pipeline'u | puste |

Zmienne `CI_*` są wpisywane do sekcji `pipeline` w `conformance.json`.

## Wejście

Skrypt czyta wszystkie pliki:

```text
results/*.json
```

Minimalny raport standardu:

```json
{"key":"STD-REPO-001","status":"pass"}
```

Raport standardu z błędem:

```json
{"key":"STD-REPO-003","status":"fail"}
```

Raport standardu z aktywnym odstępstwem:

```json
{"key":"STD-REPO-002","status":"waived","exception":{"check":"STD-REPO-002","reason":"repozytorium jest w trakcie migracji","owner":"platform-team","expires":"2026-09-30"}}
```

Wymagane pola raportu standardu:

| Pole | Znaczenie |
| --- | --- |
| `key` | identyfikator standardu albo checka |
| `status` | wynik standardu: `pass`, `fail` albo `waived` |

Pole `exception` jest opcjonalne. Powinno istnieć dla statusu `waived`.

## Wyjście

Skrypt zapisuje plik:

```text
conformance.json
```

Ten sam JSON jest wypisywany również na standardowe wyjście, żeby wynik był widoczny w logu joba.

Przykładowa struktura:

```json
{
  "apiVersion": "eye-of-discipline.rachuna.dev/v1",
  "kind": "DisciplineConformance",
  "status": "pass_with_waivers",
  "generatedAt": "2026-06-22T08:00:00+00:00",
  "disciplineFile": "discipline.yaml",
  "pipeline": {
    "id": "123",
    "source": "merge_request_event",
    "ref": "feature/example",
    "sha": "abc123",
    "url": "https://gitlab.example/pipelines/123"
  },
  "summary": {
    "total": 2,
    "passed": 1,
    "waived": 1,
    "failed": 0,
    "errors": 0
  },
  "waivers": [
    {
      "key": "STD-REPO-002",
      "exception": {
        "check": "STD-REPO-002",
        "reason": "repozytorium jest w trakcie migracji",
        "owner": "platform-team",
        "expires": "2026-09-30"
      },
      "source": "results/STD-REPO-002.json"
    }
  ],
  "checks": [
    {
      "key": "STD-REPO-001",
      "status": "pass",
      "source": "results/STD-REPO-001.json"
    },
    {
      "key": "STD-REPO-002",
      "status": "waived",
      "source": "results/STD-REPO-002.json"
    }
  ],
  "errors": []
}
```

## Status całej weryfikacji

Skrypt wylicza status końcowy na podstawie raportów standardów:

| Status | Warunek |
| --- | --- |
| `pass` | istnieją raporty i wszystkie checki mają status `pass` |
| `pass_with_waivers` | nie ma `fail`, ale co najmniej jeden check ma status `waived` |
| `fail` | co najmniej jeden check ma status `fail` |
| `error` | co najmniej jednego raportu nie da się odczytać albo nie ma pól `key` / `status` |
| `no_checks` | katalog wyników nie zawiera żadnego pliku `*.json` |

Status `fail` ma pierwszeństwo przed `waived`. Jeżeli istnieje choć jeden fail bez aktywnego odstępstwa, bramka jakości blokuje pipeline.

## Kody wyjścia

| Kod | Status | Znaczenie |
| --- | --- | --- |
| `0` | `pass` | wszystkie standardy przeszły |
| `101` | `pass_with_waivers` | są niezgodności, ale są objęte aktywnym odstępstwem |
| `1` | `fail`, `error`, `no_checks` | pipeline powinien zostać zablokowany |

W GitLab CI job agregacji powinien dopuścić kod `101`:

```yaml
allow_failure:
  exit_codes:
    - 101
```

Dzięki temu odstępstwo jest widoczne jako dług, ale nie blokuje pipeline'u.

## Komunikaty dla klienta

Po zapisaniu `conformance.json` skrypt wypisuje werdykt czytelny w logu joba.

Sukces:

```text
✅ Bramka jakości dyscypliny: OK. Wszystkie wymagane standardy przeszły.
```

Sukces z odstępstwem:

```text
⚠️ Bramka jakości dyscypliny: OK z odstępstwem. Niezgodności są objęte ważnym odstępstwem.
- STD-REPO-002: odstępstwo do 2026-09-30; właściciel: platform-team; powód: repozytorium jest w trakcie migracji
```

Blokada:

```text
❌ Bramka jakości dyscypliny: BLOKADA. Wykryto niezgodności bez ważnego odstępstwa.
- STD-REPO-003: results/STD-REPO-003.json
```

Błąd agregacji:

```text
❌ Bramka jakości dyscypliny: BŁĄD AGREGACJI. Nie udało się odczytać części raportów.
```

Brak checków:

```text
❌ Bramka jakości dyscypliny: BRAK CHECKÓW. Nie znaleziono raportów results/*.json.
```

## Miejsce w procesie

`bin/verification_process/discipline_verify` powinien być uruchamiany po zakończeniu jobów standardów:

1. `bin/verification_process/discipline_validate` waliduje `discipline.yaml`.
2. Joby standardów zapisują `results/{STD_ID}.json`.
3. `bin/verification_process/discipline_verify` agreguje wyniki do `conformance.json`.
4. Kod wyjścia skryptu steruje bramką jakości pipeline'u.

W przykładowym pipeline GitLab skrypt jest pobierany z centralnego repozytorium dyscypliny:

```bash
curl -fsSL "$verify_url" -o .discipline_verify
chmod +x .discipline_verify
set +e
./.discipline_verify \
  --results-dir results \
  --discipline-file "$DISCIPLINE_FILE" \
  --output "$CONFORMANCE_FILE"
verify_rc=$?
set -e

echo "discipline_verify exit code: ${verify_rc}"
exit "$verify_rc"
```

`conformance.json` jest artefaktem CI. Nie powinien być commitowany do repozytorium aplikacji.
