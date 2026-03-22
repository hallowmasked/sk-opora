# SK-Opora Frontend

Статический сайт строительной компании на HTML/CSS/JS.

## Структура

- `index.html` - главная страница
- `projects.html` - каталог проектов
- `project-detail.html` - шаблон страницы проекта, данные подгружаются из JSON
- `portfolio.html` - портфолио
- `privacy.html` - политика конфиденциальности
- `css/base.css` - переменные, типографика, базовые формы и кнопки
- `css/components.css` - компоненты интерфейса
- `css/layout.css` - сетки, page spacing, responsive-правила
- `js/main.js` - формы, модалки, mobile behavior, cookie, базовая интерактивность
- `js/libs.js` - инициализация внешних библиотек
- `js/site-config.js` - будущие подключения форм и аналитики
- `data/projects.json` - данные для страницы проекта

## Как менять контент

### Контакты

Искать и обновлять:

- телефон: `+7 (000) 000-00-00` или `+7 (949) 123-45-67`
- email: `info@sk-opora.ru`
- адрес: `[Адрес офиса]`
- домен: `sk-opora.ru`

После получения финальных данных клиента обязательно обновить:

- `index.html`
- `projects.html`
- `project-detail.html`
- `portfolio.html`
- `privacy.html`
- `robots.txt`
- `sitemap.xml`

### Проекты

Основной источник данных: `data/projects.json`.

Для каждого проекта можно менять:

- `id`
- `name`
- `subtitle`
- `area`
- `floors`
- `material`
- `dimensions`
- `ceilingHeight`
- `bedrooms`
- `bathrooms`
- `constructionTime`
- `price`
- `image`
- `images`
- `description`
- `features`
- `included`

`project-detail.html` использует эти данные автоматически по `?id=...`.

Пример:

- `project-detail.html?id=sever`
- `project-detail.html?id=vega`

### Формы

Все формы обрабатываются в `js/main.js`.

Сейчас сайт уже подготовлен под реальную интеграцию:

- автоматически добавляется `source`
- для проекта добавляются `project_id` и `project_name`
- для модалки услуги добавляется `service_name`

Комментарии:

- на главной: поле `name="comment"` уже добавлено
- на странице проекта: поле `name="comment"` уже добавлено

## Как подключить отправку заявок

Открыть `js/site-config.js` и заполнить:

```js
window.siteConfig = window.siteConfig || {
  forms: {
    endpoint: 'https://your-endpoint.example/api/leads'
  },
  analytics: {
    yandexMetrikaId: ''
  }
};
```

После этого `js/main.js` начнёт отправлять JSON `POST`-запросом на `endpoint`.

Формат отправки:

- `name`
- `phone`
- `comment`
- `source`
- `project_id`
- `project_name`
- `service_name`

Если endpoint пустой, сайт работает в demo-режиме без реальной отправки.

## Как подключить Яндекс Метрику

Открыть `js/site-config.js` и задать:

```js
analytics: {
  yandexMetrikaId: '12345678'
}
```

После этого `js/main.js` сам подгрузит тег Метрики на всех страницах.

## Стили и UI

Проект сейчас собран по такому принципу:

- базовые токены и цвета лежат в `css/base.css`
- визуальные компоненты лежат в `css/components.css`
- responsive и page spacing лежат в `css/layout.css`

Если нужно изменить внешний вид сайта, сначала меняйте:

- цвета в `:root`
- `--header-height`
- тени, радиусы, отступы

## Mobile-first замечания

Сайт оптимизирован в первую очередь под телефон.

При правках обязательно проверять:

- hero на ширине 320px-430px
- меню в мобильной шапке
- формы
- карточки проектов
- `project-detail.html`, потому что у fixed header раньше был конфликт с заголовком

## Что не завершено без клиента

Эти пункты нужно закрыть только после получения финальных данных:

- боевой домен
- финальные контакты
- реальный адрес
- реальный endpoint форм
- финальный email
- канонические ссылки
- `robots.txt`
- `sitemap.xml`
- schema.org с реальными данными

## Рекомендации следующему разработчику

- не менять структуру форм без обновления `js/main.js`
- не удалять `js/site-config.js`, он нужен для форм и аналитики
- не плодить inline-стили, лучше выносить в `css/components.css` или `css/layout.css`
- для новых проектов сначала добавлять данные в `data/projects.json`, потом ссылки на карточки
- перед релизом проверить все `href`, `tel`, `mailto`, изображения и финальные доменные ссылки
