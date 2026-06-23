---
tags:
  - documentation
---

# Słownik pojęć

Ten dokument porządkuje pojęcia używane w Eye of Discipline. Nie jest słownikiem ogólnym DevOps. Opisuje tylko te hasła, które w procesie dyscypliny mają konkretne znaczenie.

## Pojęcia domenowe

| Pojęcie | Znaczenie |
| --- | --- |
| Dyscyplina | Zestaw wersjonowanych standardów, względem których mierzone są repozytoria aplikacji. |
| Standard | Pojedyncza zasada albo grupa wymagań, na przykład dotycząca repozytorium, code review, bezpieczeństwa albo release'u. |
| Wymaganie normatywne | Wymaganie zapisane językiem `MUSI`, `POWINIEN` albo `MOŻE`. To ono mówi, czego oczekuje standard. |
| Pomiar | Techniczny sposób sprawdzenia, czy standard jest spełniony. Pomiarem może być skrypt, zapytanie do API, sprawdzenie pliku, atestacja albo inny sygnał zdefiniowany przez standard. |
| Check | Uruchamialna część pomiaru dla standardu. W pipeline jeden standard powinien mieć własny job sprawdzający. |
| Zgodność | Stan, w którym repozytorium spełnia wymagania wskazanej wersji dyscypliny. Zgodność nie jest deklaracją, tylko wynikiem pomiaru. |
| Niezgodność | Wynik pomiaru pokazujący, że standard nie został spełniony. Niezgodność może zablokować pipeline, jeżeli nie ma aktywnego odstępstwa. |
| Odstępstwo | Jawne, czasowe dopuszczenie niezgodności. Odstępstwo musi mieć właściciela, powód i datę wygaśnięcia. |
| Atestacja | Deklaracja zespołu developerskiego zapisana w `discipline.yaml`, używana wtedy, gdy standard wymaga jawnego potwierdzenia zamiast pełnego pomiaru automatycznego. |
| Bramka jakości | Decyzja pipeline'u po agregacji wyników. Może przepuścić pipeline, przepuścić go z odstępstwem albo zablokować. |
| Wynik QA dyscypliny | Zagregowany wynik zgodności projektu z dyscypliną zapisany w `conformance.json`. |
| Dashboard | Widok raportowy pokazujący stan dyscypliny w wielu projektach. Dashboard prezentuje wyniki, ale sam nie wykonuje checków. |

## Pliki i artefakty

| Element | Znaczenie |
| --- | --- |
| `discipline.yaml` | Deklaracja zespołu developerskiego. Wskazuje repozytorium dyscypliny, wersję standardów, atestacje i odstępstwa. |
| `spec.discipline.ref` | Pin wersji dyscypliny używanej przez repozytorium aplikacji. |
| `spec.attest` | Sekcja atestacji w `discipline.yaml`. Jej zawartość zależy od wymagań konkretnych standardów. |
| `spec.exceptions` | Lista aktywnych lub historycznych odstępstw od standardów albo checków. |
| `standards/{domena}/STD-XXX-YYY/` | Katalog pojedynczego standardu w repozytorium dyscypliny. |
| `bin/checks` | Skrypt standardu odpowiedzialny za pomiar. To standard decyduje, co i jak sprawdza. |
| `results/{STD_ID}.json` | Wynik pojedynczego joba standardu, na przykład `pass`, `fail` albo `waived`. |
| `conformance.json` | Artefakt agregujący wyniki wszystkich standardów dla konkretnego uruchomienia pipeline'u aplikacji. |
| `docs/dashboard.md` | Strona raportowa generowana z deklaracji i artefaktów projektów. |

## Statusy

| Status | Zakres | Znaczenie |
| --- | --- | --- |
| `pass` | check albo cała dyscyplina | Wymaganie zostało spełnione. |
| `fail` | check albo cała dyscyplina | Wymaganie nie zostało spełnione i nie ma aktywnego odstępstwa. |
| `waived` | check | Wymaganie nie zostało spełnione, ale jest objęte aktywnym odstępstwem. |
| `pass_with_waivers` | cała dyscyplina | Nie ma blokującej niezgodności, ale istnieje co najmniej jedno aktywne odstępstwo. |
| `error` | agregacja | Pipeline nie potrafił poprawnie odczytać części wyników. |
| `no_checks` | agregacja | Pipeline nie dostarczył wyników checków. |
| `no_discipline` | dashboard | Projekt nie ma deklaracji `discipline.yaml`. |
| `no_report` | dashboard | Projekt ma deklarację, ale nie znaleziono raportu `conformance.json`. |

## Zasada interpretacji

`discipline.yaml`, `results/{STD_ID}.json` i `conformance.json` nie oznaczają tego samego.

| Element | Odpowiada na pytanie |
| --- | --- |
| `discipline.yaml` | Z którą wersją dyscypliny projekt chce być zgodny? |
| `results/{STD_ID}.json` | Jak zakończył się pomiar pojedynczego standardu? |
| `conformance.json` | Czy cała dyscyplina przechodzi bramkę jakości? |

Zespół może zadeklarować intencję zgodności, ale zgodność musi zostać zmierzona przez pipeline.
