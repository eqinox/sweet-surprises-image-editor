# Sweet Surprises — Редактор на ценоразписи

Прост уеб инструмент за създаване на ценоразписи върху фонова снимка. Текстът се описва в JSON файл, визуализира се в браузъра и може да се експортира като PNG.

## Какво прави

1. Зарежда фонова снимка от избрана папка
2. Чете услуги, подзаглавия и цени от `config.json`
3. Рисува 3-колонен layout върху снимката:
   - **Лява колона** — име на услугата
   - **Средна зона** — подзаглавие на секция (напр. „Сешоар“, „Боядисване“)
   - **Дясна колона** — цени (една или повече за различни минути)
4. При няколко цени отдясно, текстът отляво се центрира вертикално спрямо тях
5. Позволява live промяна на позиция, шрифт и цвят от страничния панел
6. Експортира резултата като PNG

## Custom шрифт

**По подразбиране** се зарежда `fonts/MarckScript-Regular.ttf` от папката `fonts/`.

Ред на зареждане (fallback):

1. `fonts/` — файл от `fonts/fonts.json` (по подразбиране `MarckScript-Regular.ttf`)
2. Папка на ценоразписа — ако в `config.json` е зададен `"font.file"`
3. Системен fallback — `"font.family"` от config (напр. `Georgia, serif`)

Можеш да смениш default шрифта в `fonts/fonts.json`:

```json
{
  "file": "MarckScript-Regular.ttf",
  "name": "MarckScript"
}
```

Допълнително:

- **От браузъра** — „Зареди шрифт“ в панела (`.ttf`, `.otf`, `.woff`, `.woff2`)
- **От папката на ценоразписа** — `"font.file"` в `config.json` на конкретния ценоразпис

## Фонова снимка

**По подразбиране** се зарежда `images/шаблон.jpg`.

Ред на зареждане (fallback):

1. `images/` — файл от `images/images.json` (по подразбиране `шаблон.jpg`)
2. Папка на ценоразписа — `"background"` от `config.json` (напр. `background.jpg`)
3. Placeholder — ако и двете липсват

Можеш да смениш default шаблона в `images/images.json`:

```json
{
  "file": "шаблон.jpg"
}
```

Допълнително:

- **От браузъра** — „Зареди друга снимка“ в панела
- С бутона **„Върни снимката по подразбиране“** се връщаш към шаблона от `images/`

Промяната през браузъра е само за преглед — не записва файла автоматично.

## Стартиране

**Най-лесно:** двойно кликване на `start.bat` — стартира сървъра и отваря браузъра автоматично.

За да спрете сървъра, затворете прозореца на `start.bat`.

Алтернативно от терминал:

```bash
python -m http.server 8080
```

Отворете: http://localhost:8080

## Структура на папките

```
price-lists/
  lists.json                    ← списък с налични ценоразписи
  damsko-friziorsstvo/
    config.json                 ← текст и настройки
    background.jpg              ← фонова снимка (вашата)
    font.woff2                  ← по избор: custom шрифт
  drug-cenoraazpis/
    config.json
    background.jpg
```

### Нов ценоразпис

1. Създайте папка в `price-lists/`, напр. `mazhko-friziorsstvo/`
2. Сложете `background.jpg` (или `.png`) и `config.json`
3. Добавете запис в `price-lists/lists.json`:

```json
{
  "lists": [
    { "id": "damsko-friziorsstvo", "name": "Дамско Фризьорство" },
    { "id": "mazhko-friziorsstvo", "name": "Мъжко Фризьорство" }
  ]
}
```

4. Презаредете страницата и изберете новия ценоразпис от падащото меню

Можете също да отворите директно: `http://localhost:8080?list=mazhko-friziorsstvo`

## config.json — формат

```json
{
  "title": "Дамско Фризьорство",
  "background": "background.jpg",
  "font": {
    "family": "Georgia, 'Times New Roman', serif",
    "file": null,
    "name": "MyFont"
  },
  "layout": {
    "startX": 80,
    "startY": 120,
    "titleFontSize": 42,
    "subtitleFontSize": 28,
    "serviceFontSize": 22,
    "priceFontSize": 22,
    "lineHeight": 32,
    "sectionGap": 36,
    "itemGap": 12,
    "titleGap": 50,
    "leftColumnWidth": 420,
    "middleColumnWidth": 0,
    "rightColumnWidth": 280,
    "titleColor": "#2c1810",
    "subtitleColor": "#5c3d2e",
    "serviceColor": "#3d2817",
    "priceColor": "#3d2817"
  },
  "sections": [
    {
      "subtitle": "Сешоар",
      "items": [
        {
          "service": "Сешоар",
          "prices": [
            { "duration": "30 мин", "price": "20€" },
            { "duration": "60 мин", "price": "30€" }
          ]
        },
        {
          "service": "Подстригване на средна коса със стайлинг и сешоар",
          "prices": [{ "duration": "45 мин", "price": "25€" }]
        }
      ]
    }
  ]
}
```

### Полета

| Поле | Описание |
|------|----------|
| `title` | Главно заглавие отгоре |
| `background` | Име на файла с фоновата снимка |
| `font.family` | CSS шрифт (системен или fallback) |
| `font.file` | Име на файл с шрифт в същата папка (`.woff2`, `.ttf`) или `null` |
| `layout.startX`, `startY` | От къде започва текстът (горен ляв ъгъл на блока) |
| `layout.leftColumnWidth` | Ширина на колоната с услуги |
| `layout.rightColumnWidth` | Ширина на колоната с цени |
| `sections[].subtitle` | Подзаглавие на секция |
| `sections[].items[].service` | Име на услуга (лява колона) |
| `sections[].items[].prices[]` | Масив с `{ "duration", "price" }` |

## Настройки в браузъра

Страничният панел позволява временно да промените:

- Позиция (X, Y)
- Ширина на колоните
- Размер на шрифта
- Шрифт и цвят

Промените **не се записват** в `config.json` — полезни са за бързо настройване. Когато намерите подходящи стойности, копирайте ги в `config.json`.

## Експорт

Натиснете **„Експорт PNG“** — изтегля се файл с името на папката (напр. `damsko-friziorsstvo.png`).

## Custom шрифт

1. Сложете файла (напр. `font.woff2`) в папката на ценоразписа
2. В `config.json`:

```json
"font": {
  "family": "Georgia, serif",
  "file": "font.woff2",
  "name": "StudioFont"
}
```

## Бележки

- Ако липсва `background.jpg`, се показва placeholder — сложете снимката и натиснете „Презареди“
- Дългите имена на услуги се пренасят автоматично в рамките на лявата колона
- При една цена — услугата и цената са на един ред; при повече цени — услугата се центрира вертикално
