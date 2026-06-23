---
tags:
  - documentation
  - standards writing
  - creative process
---

# Pisanie dokumentacji

Dokumentacja standardu jest źródłem znaczenia normy. Check i job weryfikujący są wykonaniem technicznym, ale to `README.md` standardu mówi zespołowi developerskiemu, czego oczekuje dyscyplina.

Standard powinien być pisany tak, żeby dało się go zrozumieć bez czytania skryptu `bin/checks`.

Przed opisaniem wymagań przeczytaj [Język normatywny BCP 14](bcp14_standard_language.md). Ten dokument ustala, co w Eye of Discipline oznaczają słowa `MUSI`, `POWINIEN` i `MOŻE`.

## Struktura standardu

Standard znajduje się w katalogu:

```text
standards/{domena}/{STD_ID}/README.md
```

Dokument powinien zawierać:

| Sekcja | Cel |
| --- | --- |
| tytuł standardu | krótko nazywa wymaganie |
| status i metadane | pokazują domenę, wersję wejścia i tagi |
| cel | wyjaśnia, po co standard istnieje |
| wymagania | opisują, co projekt MUSI, POWINIEN albo MOŻE robić |
| pomiar | opisuje, jak standard jest sprawdzany |
| atestacje | jeżeli standard wymaga deklaracji manualnej |
| odstępstwa | jeżeli standard dopuszcza czasowy dług |
| komunikaty naprawcze | pomagają zespołowi usunąć niezgodność |

Nie każda norma musi mieć wszystkie sekcje, ale wymagania i sposób interpretacji wyniku powinny być zawsze jasne.

## Język normatywny

Wymagania powinny używać słów:

| Słowo | Znaczenie |
| --- | --- |
| `MUSI` | wymaganie obowiązkowe |
| `NIE MOŻE` | zakaz |
| `POWINIEN` | wymaganie rekomendowane, od którego można świadomie odstąpić |
| `MOŻE` | zachowanie dopuszczalne |

Przykład:

```markdown
Repozytorium MUSI mieć chronioną główną gałąź.

Merge Request POWINIEN być zatwierdzony przez osobę inną niż autor zmiany.
```

Unikaj sformułowań nieoperacyjnych:

```markdown
Repozytorium powinno być dobrze zabezpieczone.
```

Taki zapis nie mówi, co dokładnie ma zostać sprawdzone.

## Opis wymagania

Dobre wymaganie ma trzy cechy:

- jest konkretne,
- ma wyraźnego odbiorcę,
- da się je zweryfikować albo świadomie zatwierdzić atestacją.

Zamiast pisać:

```markdown
Projekt powinien mieć porządny proces code review.
```

napisz:

```markdown
Każdy Merge Request do głównej gałęzi MUSI przejść review przed merge'em.
```

Jeżeli standard zawiera kilka wymagań, ponumeruj je albo nazwij. Ułatwi to później atestacje, komunikaty błędów i dyskusję w review.

## Opis pomiaru

Sekcja pomiaru powinna powiedzieć, co robi check, ale nie powinna przepisywać całego kodu skryptu.

Wystarczy opisać:

- jakie źródła danych są używane,
- co oznacza wynik pozytywny,
- co oznacza wynik negatywny,
- jakie ograniczenia ma pomiar,
- czy potrzebna jest atestacja manualna.

Przykład:

```markdown
Check odczytuje konfigurację projektu przez GitLab API i sprawdza, czy główna gałąź jest chroniona.

Wynik `pass` oznacza, że gałąź istnieje i ma aktywną ochronę.
Wynik `fail` oznacza, że gałąź nie jest chroniona albo nie udało się potwierdzić ochrony.
```

## Atestacje manualne

Jeżeli standard wymaga atestacji, dokumentacja musi opisać dokładnie, co zespół potwierdza w `discipline.yaml`.

Przykład:

```yaml
spec:
  attest:
    STD-REPO-002:
      r6: true
      r7: true
      r10: false
```

Dokumentacja standardu powinna wtedy wyjaśnić:

| Klucz | Znaczenie |
| --- | --- |
| `r6` | wymaganie R6 zostało potwierdzone manualnie |
| `r7` | wymaganie R7 zostało potwierdzone manualnie |
| `r10` | wymaganie R10 nie zostało potwierdzone |

!!! warning "Atestacja nie zastępuje odstępstwa"
    Atestacja oznacza: zespół potwierdza, że wymaganie jest spełnione. Odstępstwo oznacza: wymaganie nie jest spełnione, ale czasowo akceptujemy ten stan.

## Odstępstwa

Jeżeli standard może zostać objęty odstępstwem, dokumentacja powinna wskazać typowy powód i oczekiwany plan usunięcia długu.

Minimalny format odstępstwa:

```yaml
spec:
  exceptions:
    - check: STD-REPO-002
      reason: "repozytorium jest w trakcie migracji"
      owner: platform-team
      expires: 2026-09-30
```

Nie opisuj odstępstwa jako sposobu obejścia standardu. Opisuj je jako jawny, czasowy dług.

## Komunikaty dla zespołu

Standard powinien pomagać zespołowi naprawić problem. Jeżeli check kończy się błędem, log powinien prowadzić do dokumentacji standardu, a dokumentacja powinna mówić, co trzeba zmienić.

Dobra dokumentacja odpowiada na pytanie:

```text
Co mam zrobić, żeby następny pipeline przeszedł?
```

Jeżeli odpowiedź wymaga kilku kroków, zapisz je wprost.

## Review dokumentacji

Review standardu powinien sprawdzić:

| Pytanie | Dlaczego jest ważne |
| --- | --- |
| Czy wymaganie jest jednoznaczne? | zespół developerski musi wiedzieć, czego oczekuje dyscyplina |
| Czy pomiar sprawdza to samo, co opisuje dokumentacja? | check nie może mierzyć innego wymagania niż standard |
| Czy dokumentacja mówi, jak naprawić niezgodność? | standard ma pomagać w poprawie, nie tylko blokować pipeline |
| Czy atestacje i odstępstwa są rozróżnione? | te mechanizmy mają inne znaczenie i skutki |
| Czy zmiana wpływa na semver? | nowe wymaganie albo zaostrzenie może wymagać nowej wersji dyscypliny |

!!! note "Standard jest prawem"
    Dokumentacja standardu jest prawem, check jest pomiarem, a job weryfikujący jest sposobem uruchomienia pomiaru. Te trzy elementy muszą opisywać tę samą normę.
