---
tags:
  - documentation
  - standards writing
---

# Jak pisać normy?

Ten wątek opisuje, jak tworzyć dokumentację norm w **Eye of Discipline**. Dotyczy pracy zespołu dyscypliny: od uporządkowania standardów w domeny, po napisanie dokumentu standardu tak, żeby dało się go później mierzyć w procesie weryfikującym.

Norma nie jest tylko opisem dobrych praktyk. W tym repozytorium norma jest elementem wersjonowanej dyscypliny:

- ma miejsce w strukturze `standards/`,
- ma trwały identyfikator `STD-{GID}-{NNN}`,
- opisuje wymagania językiem normatywnym,
- może mieć check automatyczny,
- może wymagać atestacji manualnej,
- jest publikowana w portalu MkDocs.

## Cel dokumentacji norm

Dobra dokumentacja standardu powinna odpowiedzieć na trzy pytania:

| Pytanie | Odpowiedź w dokumentacji |
| --- | --- |
| Co jest wymagane? | wymagania normatywne zapisane jasno i jednoznacznie |
| Dlaczego to jest wymagane? | kontekst, ryzyko i uzasadnienie standardu |
| Jak będzie sprawdzane? | opis pomiaru, atestacji albo granicy odpowiedzialności checka |

Dokumentacja nie powinna ukrywać niepewności. Jeżeli wymaganie nie może być w pełni zmierzone automatycznie, standard powinien to powiedzieć i wskazać, czy używa atestacji manualnej.

## Kolejność pracy

Przy tworzeniu nowej normy najpierw ustal domenę, a dopiero potem pisz standard.

1. Sprawdź, czy istnieje właściwa domena w `standards/domain.json`.
2. Jeżeli domeny nie ma, utwórz ją i nazwij tak, żeby grupowała standardy według odpowiedzialności.
3. Utwórz szkielet standardu generatorem.
4. Napisz dokumentację standardu.
5. Dopiero potem dopracuj check i definicję joba weryfikującego.

!!! warning "Najpierw norma, potem check"
    Check powinien mierzyć wymaganie opisane w standardzie. Jeżeli najpierw powstanie skrypt, a dopiero później dokumentacja, łatwo stworzyć standard, który opisuje narzędzie zamiast oczekiwanego stanu.

## Dokumenty w tym wątku

| Dokument | Kiedy używać |
| --- | --- |
| [Tworzenie domeny dokumentacji](standard_domain_documentation.md) | gdy trzeba dodać nowy obszar standardów, na przykład `repozytorium`, `security` albo `release` |
| [Język normatywny BCP 14](bcp14_standard_language.md) | zanim zaczniesz pisać wymagania `MUSI`, `POWINIEN` i `MOŻE` |
| [Pisanie dokumentacji](writing_standard_documentation.md) | gdy tworzysz albo zmieniasz `README.md` konkretnego standardu |
| [Pisanie checka standardu](writing_standard_check.md) | gdy trzeba zamienić wymaganie standardu w skrypt `bin/checks` |
