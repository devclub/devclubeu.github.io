# devclub.eu

Проект - альтернативный сайт-визитка сообщества DevClub. Здесь собрана вся основная информация о встречах в удобной база всех выступлений. Основные критерии работы сайта: современно и кратко о главном. Проект доступен по адресу [devclubeu.github.io](http://devclubeu.github.io).

## Докладчикам

При желании вы можете дополнить данные о себе и своих докладах. Для этого обратите внимание на данные в файлах speeches.json (например, добавить ссылку на слайды или сами слайды в assets/slides) и speakers.json (добавить ссылку на свой сайт или linkedin, а также поменять или добавить фотографию в assets/speakers).

## Запустить проект локально

Предварительно установить [git], [npm], [bower], [grunt].
Выкачать, проинициализировать зависимости npm и bower, запустить сервер:
```
git clone https://github.com/devclubeu/devclubeu.github.io.git devclubeu
cd devclubeu
npm install
bower install
grunt serve
```

## Обновление данных на сайте

Для обновления данных на сайте достаточно обновлять JSON-файлы в папке data. На их основе обновляются данные о следующей встрече, а также разделы "Последние встречи" и "Архив". Менее важно, но обновить можно и разделы "Спонсоры", "Организаторы" и "Мы благодарны".

Встроенный календарь Google *"devclub-public-eu"* управляется в *Google Calendar*.
Форма регистрации выступления ведёт на форму *Google Docs*, которая интерирована с *Trello*.

## База данных в JSON-файлах

Управлять файлами проще через web-интерфейс *github.com*. Описание здесь выглядит сложнее, чем если просто посмотреть файлы, где всё понятно интуитивно. Всего 6 файлов:

#### sponsors.json
Cписок спонсоров (с возможностью спрятать в блоке спонсоров).
```json
[
  {
    "code": "sponsor1",
    "hidden": true
  },
  {
    "code": "sponsor2",
    "hidden": false
  }
]
```
* [{code, hidden}]
* должен существовать файл с лого фирмы по ссылке */assets/sponsors/{code}.png*
* hidden: false прячет фирму со страницы

#### places.json
Ссылка на место, где будет проходить встреча.
```json
{
  "Super hotel": "https://www.google.ee/maps...",
  "The best place on the Earth": "https://www.google.ee/maps/..."
}
```
* {place_name: place_url}
* **foreign key** на *meetings.json*: places.place_name - meetings.place

#### members.json
Список организаторов и тех, кому DevClub благодарен за помощь.
```json
[
  {
    "name": "Джеймс Гослинг",
    "userpick": "jgosling.jpg",
    "active": false
  },
  {
    "name": "Антон Архипов",
    "userpick": "aarhipov.jpg",
    "active": true
  }
]
```
* [{name, userpick, active}]
* должен существовать файл с фотографией по ссылке */assets/members/{userpick}*
* active: true показывает в организаторах, false - в "благодарности"

#### speakers.json
Список данных о выступающих.
```json
{
  "Антон Архипов": {
    "url": "https://ee.linkedin.com/in/antonarhipov",
    "image": "assets/speakers/aarhipov.jpg"
  },
  "Андрей Солнцев": {
    "url": "https://ee.linkedin.com/in/asolntsev",
    "image": "assets/speakers/asolntsev.jpg"
  },
  "Джеймс Гослинг": {
    "url": "https://www.linkedin.com/in/jamesgosling",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/00/James_Gosling_2005.jpg"
  }
}
```
* {speaker_name: {image, url}}
* image - может быть полной ссылкой на фото или же релативной на */assets/...*
* url - ссылка на профайл выступающего (в идеале на рабочий, например, в linkedin)
* **foreign key** на *speeches.json*: speakers.speaker_name - speeches.speakers

#### meetings.json
Список данных о встречах.
```json
[
  {
    "date": "25.11.2015",
    "time": "19:00",
    "place": "Von Stackelberg",
    "name": "#87",
    "moderator": "",
    "photoUrls": [],
    "registerUrl": ""
  },
  {
    "date": "28.10.2015",
    "time": "19:00",
    "place": "Tallink SPA & Conference",
    "name": "#86",
    "moderator": "Кирилл Линник",
    "photoUrls": ["https://plus.google.com/photos/105266766340206558621/albums/6210823207533670865"]
  }
]
```
* [{date, time, place, name, moderator, photoUrls[""], registerUrl}]
* date: дата встречи в формате dd.mm.yyyy
* **foreign key** на *speeches.json*: meetings.date - speeches.date - связь между встречей и докладами
* time: время встречи в формате HH:MM
* place: место встречи (ссылка на место может храниться в *places.json*)
* **foreign key** на *places.json*: meetings.place - places.place_name
* name: название встречи, проще всего просто следующий номер выставить
* moderator: модератор встречи
* photoUrls: список ссылок на фотографии с данной встречи
* registerUrl: ссылка на регистрацию на встречу (в eventbrite, например)
* данные могут быть половинчатыми. например, registerUrl нужен до самой встречи, потом его можно даже удалить, а photoUrls появляются уже после встречи, естественно.

#### speeches.json
Список данных о докладах.
```json
[
  {
    "date": "25.11.2014",
    "youtubeIds": ["v0NFb4y6Hkw"],
    "speakers": [
      "Константин Роот",
      "Антон Кекс"
    ],
    "topic": "Jira против Pivotaltracker",
    "labels": ["батл"],
    "top": {"year": 2014, "place": 4}
  },
  {
    "date": "30.07.2015",
    "youtubeIds": ["ME4HqzRjjJs"],
    "speakers": ["Ирина Иванова"],
    "topic": "Ловушки мышления в тестировании",
    "presentations": ["http://www.slideshare.net/iiiirina/devclubeu-30072015"]
  }
]
```
* [{date, youtubeIds[""], speakers[""], topic, presentations[""], top: {year, place}, labels[""]}]
* date: дата встречи в формате dd.mm.yyyy
* **foreign key** на *meetings.json*: speeches.date - meetings.date - связь между докладом и встречей
* youtubeIds: список ID к видео на YouTube-канале DEVCLUB.EU (часто 1 видео в списке)
* speakers: список имен выступающих (часто 1 выступающий в списке)
* **foreign key** на *speakers.json*: speeches.speakers - speakers.speaker_name - связь между выступающим и данными о выступающем
* topic: название доклада
* presentations: список ссылок на презентации (слайды) докладчика
* top: выставляется после оглашений результатов голосования за лучший доклад года
  * year - год (декабрьские встречи обычно попадают в голосование за след.год)
  * place - место в списке лучших
* labels: список меток по формату доклада, а не содержанию (например, "батл")

[git]: http://git-scm.com/
[bower]: http://bower.io
[npm]: https://www.npmjs.org/
[grunt]: http://gruntjs.com/
