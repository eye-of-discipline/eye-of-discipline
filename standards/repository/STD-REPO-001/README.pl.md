---
id: STD-REPO-001
title: Struktura plików w repozytorium
domain: repository
status: active
conformance: mandatory
since: 1.0.0
owner: team-platform
tags: [repository, 1.0.0]
---

# STD-REPO-001 · Struktura plików w repozytorium

## 1. Cel

Zapewnić, że każde repozytorium organizacji zawiera kompletny zestaw plików metadanych umożliwiających orientację nowym współpracownikom, licencjonowanie kodu oraz prowadzenie historii zmian.

## 2. Zakres

Dotyczy wszystkich repozytoriów z kodem lub dokumentacją zarządzanych w grupie `dev.rachuna`. Nie dotyczy repozytoriów archiwizowanych (`archived: true`).

## 3. Wymagania *(normatywne)*

- **R1.** Repozytorium MUSI zawierać plik `README.md` w katalogu głównym.
- **R2.** Repozytorium MUSI zawierać plik `CODEOWNERS` definiujący właścicieli obszarów kodu.
- **R3.** Repozytorium MUSI zawierać plik `CHANGELOG.md` generowany automatycznie przez semantic-release na podstawie commitów (STD-REPO-003).
- **R4.** Repozytorium MUSI zawierać plik `LICENSE` określający warunki licencji.
- **R5.** Repozytorium MUSI zawierać plik `CONTRIBUTING.md` opisujący sposób wnoszenia wkładu.
- **R6.** Repozytorium MUSI zawierać plik `CODE_OF_CONDUCT.md` określający zasady współpracy.
- **R7.** Repozytorium MUSI zawierać plik `.gitlab/footer.md` — stopka interfejsu GitLab.
- **R8.** Repozytorium MUSI zawierać plik `.gitlab/badges.md` — odznaki wyświetlane w README.
- **R9.** Repozytorium MUSI zawierać plik `.gitlab/avatar.png` — avatar projektu.
- **R10.** Repozytorium MUSI zawierać plik `.gitignore`.

## 4. Minimum of Done

- [x] Czy istnieje plik `README.md` w katalogu głównym?
- [x] Czy istnieje plik `CODEOWNERS` w katalogu głównym?
- [x] Czy istnieje plik `CHANGELOG.md` w katalogu głównym?
- [x] Czy istnieje plik `LICENSE` w katalogu głównym?
- [x] Czy istnieje plik `CONTRIBUTING.md` w katalogu głównym?
- [x] Czy istnieje plik `CODE_OF_CONDUCT.md` w katalogu głównym?
- [x] Czy istnieje plik `.gitlab/footer.md`?
- [x] Czy istnieje plik `.gitlab/badges.md`?
- [x] Czy istnieje plik `.gitlab/avatar.png`?
- [x] Czy istnieje plik `.gitignore`?

Weryfikacja: `bash standards/repository/STD-REPO-001/bin/checks.sh`

## 5. Implementacja — dobra praktyka *(informacyjne, niewiążące)*

- **README.md** — opis projektu, quickstart, linki do dokumentacji.
- **CODEOWNERS** — mapowanie ścieżek na zespoły; każdy MR dostaje automatycznych recenzentów.
- **CHANGELOG.md** — generowany przez semantic-release przy każdym tagu; nie edytuj ręcznie. Szczegóły: STD-PROC-004.
- **LICENSE** — dla repozytoriów wewnętrznych: licencja własna organizacji lub CC BY-NC-SA 4.0.
- **CONTRIBUTING.md** — jak zgłaszać bugi, jak tworzyć MR, standardy commitów (link do STD-PROC-003).
- **CODE_OF_CONDUCT.md** — zalecany [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
- **`.gitlab/`** — pliki konfiguracyjne interfejsu GitLab; skopiuj z repozytorium dyscypliny (STD-PROC-006).
