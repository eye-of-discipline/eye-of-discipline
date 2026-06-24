# `bin/logger`

`bin/logger` to prosty helper Bash do formatowania komunikatów w skryptach CI i checkach standardów. Udostępnia funkcje do wypisywania nagłówków, banerów oraz komunikatów informacyjnych, ostrzegawczych i krytycznych.

Plik nie jest samodzielnym programem. Należy go dołączyć w skrypcie przez `source`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=bin/logger disable=SC1091
source bin/logger
```

## Zmienna `term_width`

Logger ustawia domyślną szerokość terminala:

```bash
declare -i term_width=130
```

Wartość jest używana przez funkcje, które centrują tekst albo rysują separatory. Dzięki temu output w pipeline ma przewidywalną szerokość.

## Dostępne funkcje

| Funkcja | Cel |
| --- | --- |
| `h1` | wypisuje duży nagłówek z separatorem |
| `h2` | wypisuje nagłówek drugiego poziomu |
| `h3` | wypisuje krótki komunikat pomocniczy |
| `banner` | wypisuje kolorowy baner |
| `info` | wypisuje niebieski baner informacyjny |
| `warn` | wypisuje żółty baner ostrzegawczy |
| `critical` | wypisuje czerwony baner i kończy skrypt kodem `1` |

## `h1`

Wypisuje nagłówek pierwszego poziomu wyśrodkowany między liniami separatora.

```bash
h1 "Etap wdrożenia"
```

Stosuj do oznaczania dużych etapów skryptu.

## `h2`

Wypisuje nagłówek drugiego poziomu:

```bash
h2 "Pobieranie zależności"
```

Funkcja korzysta z systemowego polecenia `logger "INFO"` jako warunku wypisania komunikatu. W środowiskach, w których `logger` nie jest dostępny albo zwraca błąd, komunikat może nie zostać wypisany.

## `h3`

Wypisuje krótki niebieski komunikat pomocniczy:

```bash
h3 "Sprawdzam plik README.md"
```

Ta funkcja jest używana w checkach standardów do raportowania pojedynczych warunków.

## `banner`

Wypisuje tekst wyśrodkowany między kolorowymi liniami:

```bash
banner green "Operacja zakończona powodzeniem"
```

Obsługiwane kolory:

| Kolor | Zastosowanie |
| --- | --- |
| `blue` | informacja |
| `green` | sukces |
| `yellow` | ostrzeżenie |
| `red` | błąd krytyczny |

Nieznany kolor użyje domyślnego koloru terminala.

## `info`

Skrót dla niebieskiego banera:

```bash
info "Rozpoczęto przetwarzanie"
```

Wewnętrznie wywołuje:

```bash
banner blue "$1"
```

## `warn`

Skrót dla żółtego banera:

```bash
warn "Brak opcjonalnej konfiguracji"
```

Wewnętrznie wywołuje:

```bash
banner yellow "$1"
```

## `critical`

Wypisuje czerwony baner i kończy skrypt kodem `1`:

```bash
critical "Nie można kontynuować"
```

Stosuj do błędów, po których dalsze wykonywanie skryptu nie ma sensu.

## Przykład użycia w checku

```bash
#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=bin/logger disable=SC1091
source bin/logger

info "STD-REPO-001 - Struktura plików w repozytorium"

if [[ -f README.md ]]; then
    h3 "README.md istnieje"
else
    critical "README.md nie istnieje"
fi
```

## Uwagi dla ShellCheck

Jeżeli ShellCheck jest uruchamiany bez `-x`, może zgłaszać `SC1091` dla `source bin/logger`. W takim przypadku użyj lokalnej dyrektywy:

```bash
# shellcheck source=bin/logger disable=SC1091
source bin/logger
```
