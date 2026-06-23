---
tags:
  - documentation
  - standards writing
---

# Język normatywny BCP 14

BCP 14 to konwencja opisywania wymagań w dokumentach technicznych. Jej celem jest odróżnienie tego, co jest obowiązkowe, od tego, co jest rekomendacją albo możliwością.

W Eye of Discipline używamy tej konwencji po polsku, żeby standardy były jednoznaczne dla zespołów developerskich i możliwe do zmierzenia w pipeline.

## Słowa kluczowe

| Słowo | Znaczenie |
| --- | --- |
| `MUSI` | wymaganie obowiązkowe; niespełnienie oznacza niezgodność |
| `NIE MOŻE` | zakaz; wystąpienie danego stanu oznacza niezgodność |
| `POWINIEN` | silna rekomendacja; odstępstwo wymaga świadomego uzasadnienia |
| `NIE POWINIEN` | silna rekomendacja unikania danego zachowania |
| `MOŻE` | zachowanie dopuszczalne, ale niewymagane |

Słowa kluczowe warto pisać wielkimi literami. Dzięki temu w dokumencie od razu widać, które zdania mają charakter normatywny.

## `MUSI`

Używaj `MUSI`, gdy wymaganie jest obowiązkowe i jego niespełnienie powinno skutkować wynikiem `fail`, chyba że istnieje aktywne odstępstwo.

Przykład:

```markdown
Repozytorium MUSI mieć chronioną główną gałąź.
```

Takie wymaganie powinno mieć jasny pomiar:

- check potwierdza ochronę gałęzi i zwraca `pass`,
- check nie potwierdza ochrony i zwraca `fail`,
- aktywne odstępstwo zmienia wynik joba na `waived`.

## `NIE MOŻE`

Używaj `NIE MOŻE`, gdy standard zakazuje konkretnego stanu.

Przykład:

```markdown
Repozytorium NIE MOŻE przechowywać sekretów w plikach wersjonowanych.
```

Zakaz powinien być tak samo mierzalny jak wymaganie pozytywne. Jeżeli nie da się wykryć wszystkich przypadków automatycznie, dokumentacja musi opisać ograniczenia pomiaru.

## `POWINIEN`

Używaj `POWINIEN`, gdy wymaganie jest rekomendowane, ale mogą istnieć uzasadnione wyjątki.

Przykład:

```markdown
Merge Request POWINIEN być zatwierdzony przez osobę inną niż autor zmiany.
```

`POWINIEN` nie oznacza dowolności. Jeżeli zespół nie spełnia takiego wymagania, powinien umieć wyjaśnić powód. Standard musi powiedzieć, czy brak spełnienia daje `fail`, wymaga atestacji, czy jest traktowany jako zalecenie bez blokady.

## `MOŻE`

Używaj `MOŻE`, gdy standard dopuszcza dane zachowanie, ale go nie wymaga.

Przykład:

```markdown
Projekt MOŻE utrzymywać dodatkowe pliki dokumentacji w katalogu `docs/`.
```

`MOŻE` zwykle nie powinno być podstawą checka blokującego. Jest przydatne do opisania wariantów dopuszczalnej implementacji.

## Czego unikać

Unikaj słów, które brzmią normatywnie, ale nie mają jasnego znaczenia operacyjnego:

| Sformułowanie | Problem |
| --- | --- |
| „dobrze zabezpieczony” | nie wiadomo, jaki stan ma zostać sprawdzony |
| „w miarę możliwości” | nie wiadomo, kto ocenia możliwość |
| „zaleca się” | nie wiadomo, czy to `POWINIEN`, czy luźna sugestia |
| „najlepiej” | nie wiadomo, czy istnieje wymaganie |
| „odpowiedni” | nie wiadomo, według jakiego kryterium |

Zamiast pisać:

```markdown
Repozytorium powinno być odpowiednio zabezpieczone.
```

napisz:

```markdown
Główna gałąź repozytorium MUSI być chroniona przed bezpośrednim pushem.
```

## Relacja z pomiarem

Każde wymaganie normatywne powinno mieć znany sposób interpretacji:

| Typ wymagania | Oczekiwana decyzja |
| --- | --- |
| `MUSI` / `NIE MOŻE` | zwykle mierzone automatycznie albo przez atestację |
| `POWINIEN` / `NIE POWINIEN` | mierzone, atestowane albo opisane jako rekomendacja |
| `MOŻE` | opisuje dopuszczalne warianty, zwykle bez blokady |

Jeżeli wymaganie nie ma żadnego sposobu sprawdzenia, standard powinien wyraźnie powiedzieć, dlaczego jest opisowe, a nie egzekwowane.

!!! note "Norma musi być możliwa do rozmowy"
    Dobre wymaganie pozwala zespołowi developerskiemu, reviewerowi i zespołowi dyscypliny rozmawiać o tym samym stanie. Jeżeli nie wiadomo, co oznacza spełnienie wymagania, check nie naprawi problemu.

