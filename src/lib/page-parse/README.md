# Разбор страницы → конспект

Лекторий сохраняет заметки. Он **не** поставляет алгоритм чтения чужих учебных
площадок. Такой код легко спутать с выгрузкой чужого материала — его нет в git.

Свою реализацию клади в `impl.local/` (каталог игнорируется git). Если папки нет,
`npm install` запишет туда реэкспорт заглушки `stub.ts`.

## Вход

| Функция | Аргументы |
| --- | --- |
| `parseFromUrl` | `url: string` — адрес `http`/`https` |
| `parseFromHtmlBundle` | `{ htmlFiles, images?, source? }` — HTML (и при необходимости картинки) сохранённой страницы; `source` — исходный URL |

`htmlFiles[].name` — имя или относительный путь файла (`урок_files/iframe.html`).
`htmlFiles[].html` — текст HTML.
`images[].name` — имя файла картинки, `images[].bytes` — содержимое.

## Выход

Объект `ParsePageResult`:

| Поле | Смысл |
| --- | --- |
| `title` | Заголовок черновика |
| `markdown` | Текст конспекта |
| `excerpt` | Короткое описание |
| `source` | URL источника |
| `stub` | `true`, если текста нет |
| `captureId` | UUID временной папки с картинками |
| `images` | Имена файлов картинок |
| `stagedImages` | Байты картинок, если ещё не записаны на диск |
| `error` | Сообщение для формы |

После «Сохранить» приложение копирует файлы из `captureId` в `Вложения/` лекции.
В markdown удобны вставки вида `![[Вложения/схема.png]]`.

Экспорт модуля: как в `stub.ts` (`pageParseAvailable`, `parseFromUrl`,
`parseFromHtmlBundle`, `wikiEmbedsFromImages`, `fetchAuthorizedImages`).
