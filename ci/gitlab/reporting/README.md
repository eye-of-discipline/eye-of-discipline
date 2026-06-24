---
tags:
  - documentation
  - reporting process
  - dashboard
---

# Przykładowe zasilenie dashboardu

Plik `.gitlab-ci.yml` w tym katalogu pokazuje techniczny przykład uruchomienia generatora dashboardu dla projektów GitLab.

W docelowym przepływie dashboard jest częścią portalu MkDocs i jest zasilany przez `bin/prepare_build` w procesie wytwórczym. Ten przykład należy traktować jako techniczne uruchomienie skryptu z wątku raportującego: może służyć do testu, harmonogramu albo ręcznego odświeżenia danych, ale nie jest osobnym procesem decyzyjnym.

Pipeline uruchamia skrypt:

```bash
bin/reporting_process/discipline_generate_dashboard
```

## Założenia

Pipeline zakłada, że:

- raportowana grupa GitLab ma id `132728705`,
- projekty aplikacyjne przechowują deklarację w `discipline.yaml`,
- pipeline aplikacji zapisuje raport `conformance.json` jako artefakt CI,
- token użyty przez job ma dostęp do projektów i artefaktów w grupie.

## Zmienne pipeline'u

| Zmienna | Domyślna wartość | Znaczenie |
| --- | --- | --- |
| `REPORT_GROUP_ID` | `132728705` | grupa GitLab skanowana rekurencyjnie |
| `DISCIPLINE_FILE` | `discipline.yaml` | ścieżka deklaracji w repozytorium aplikacji |
| `CONFORMANCE_FILE` | `conformance.json` | nazwa raportu w artefaktach CI |
| `DASHBOARD_FILE` | `docs/dashboard.md` | plik Markdown generowany dla portalu |
| `DASHBOARD_DETAILS_DIR` | `docs/dashboard` | katalog podstron szczegółowych projektów |
| `DASHBOARD_TEMPLATES_DIR` | `bin/reporting_process/templates` | katalog szablonów Jinja2 używanych do renderowania |
| `GITLAB_TOKEN` | brak | opcjonalny token, jeżeli `CI_JOB_TOKEN` nie ma dostępu |

## Struktura przykładu

| Stage | Job | Odpowiedzialność |
| --- | --- | --- |
| `publish` | `📊 Eye discipline:Generate dashboard` | pobiera projekty z grupy, szuka deklaracji i raportów, generuje pliki dashboardu |

## Job zasilający dashboard

Job uruchamia:

```bash
bin/reporting_process/discipline_generate_dashboard \
  --gitlab-url "$CI_SERVER_URL" \
  --group-id "$REPORT_GROUP_ID" \
  --discipline-file "$DISCIPLINE_FILE" \
  --report-file "$CONFORMANCE_FILE" \
  --output "$DASHBOARD_FILE" \
  --details-dir "$DASHBOARD_DETAILS_DIR" \
  --templates-dir "$DASHBOARD_TEMPLATES_DIR"
```

Skrypt:

1. pobiera projekty z grupy rekurencyjnie,
2. sprawdza obecność `discipline.yaml`,
3. szuka `conformance.json` w artefaktach CI,
4. generuje `docs/dashboard.md`,
5. generuje podstrony `docs/dashboard/{path_with_namespace}/index.md`.

## Artefakty

Job zapisuje:

```text
docs/dashboard.md
docs/dashboard/
```

Dashboard może być następnie commitowany i opublikowany przez pipeline MkDocs razem z resztą dokumentacji. Aktualizacja dashboardu jest zmianą widoku portalu, a nie zmianą wersji standardów.
