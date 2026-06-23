---
tags:
  - documentation
---
# Role

| Rola | Odpowiedzialność |
| --- | --- |
| Zespół dyscypliny | Tworzy standardy, opisuje wymagania, utrzymuje logikę pomiaru i publikuje wersje dyscypliny. |
| Zespół developerski | Utrzymuje repozytorium aplikacji, deklaruje używaną wersję dyscypliny i usuwa niezgodności wykryte przez pipeline. |
| Właściciel odstępstwa | Osoba albo zespół odpowiedzialny za czasowe odstępstwo od standardu. Musi pilnować powodu, terminu ważności i planu usunięcia długu. |
| Reviewer | Sprawdza zmianę standardu, deklaracji albo odstępstwa przed merge'em. Potwierdza, że zmiana jest zrozumiała i nie ukrywa ryzyka. |
| Pipeline CI/CD | Wykonuje proces techniczny: waliduje deklarację, uruchamia checki, agreguje wyniki i podejmuje decyzję bramki jakości. |
| Scheduler | Uruchamia cykliczne odświeżenie dashboardu portalu, niezależnie od pracy zespołów developerskich. |
