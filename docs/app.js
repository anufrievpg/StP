const TICKETS = [
  ["Юсуповский дворец", "https://yusupov-palace.ru/ru/programs", "yusupov-palace.ru", "3 сен"],
  ["Эрмитаж — Главный штаб (выставка)", "https://tickets.hermitagemuseum.org/", "tickets.hermitagemuseum.org", "4 сен днём"],
  ["Променад-концерт «Чудесный источник»", "https://tickets.hermitagemuseum.org/", "tickets.hermitagemuseum.org", "4 сен 20:30 (проверить сентябрь)"],
  ["Эрмитаж — Манеж Малого Эрмитажа (вход)", "https://tickets.hermitagemuseum.org/", "tickets.hermitagemuseum.org", "4 сен утро · онлайн-билет обязателен"],
  ["Русский музей", "https://ticket.rusmuseum.ru", "ticket.rusmuseum.ru", "5 сен"],
  ["Спас на Крови / Исаакий / колоннада", "https://isaak.ticketnet.ru", "isaak.ticketnet.ru", "3, 5, 6 сен"],
  ["Музей Фаберже", "https://fabergemuseum.ru/posetitelyam/biletyi-v-muzej", "fabergemuseum.ru", "6 сен"],
  ["Китайский дворец", "https://peterhofmuseum.ru/objects/oranienbaum/kitayskiy_dvorets/info", "peterhofmuseum.ru", "8 сен"],
  ["Новая Голландия — Сообщество", "https://www.newhollandsp.ru/community/", "newhollandsp.ru", "9 сен"],
  ["Кронштадт / Остров фортов", "https://ostrivfortov.ru/", "ostrivfortov.ru", "10 сен"],
  ["Севкабель Порт — выставки", "https://sevcableport.ru/", "sevcableport.ru", "11 сен"],
  ["Музей «Мистериум»", "https://mysterium.ru/", "mysterium.ru", "11 сен, опц."],
  ["Императорский фарфор", "https://ipm.ru/", "ipm.ru", "9 сен, опц."],
  ["Лахта Центр (смотровая)", "https://lakhta.center/", "lakhta.center", "7 сен, опционально"],
];

function yandexMapsUrl(query) {
  const needsCity =
    !/Санкт-Петербург|Петербург|Кронштадт|Ломоносов|Ораниенбаум|Лахта/i.test(query);
  const text = needsCity ? `${query}, Санкт-Петербург` : query;
  return `https://yandex.ru/maps/?text=${encodeURIComponent(text)}`;
}

function mealMapQuery(meal) {
  return meal.mapQuery ?? meal.addr.replace(/\s*\([^)]*\)/g, "").trim();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function link(href, text, extra = {}) {
  return el("a", { href, target: "_blank", rel: "noopener", ...extra }, text);
}

function mapsLink(query, label) {
  return link(yandexMapsUrl(query), label);
}

function renderSlot(label, slot) {
  const box = el("div", { className: "slot" }, [
    el("p", { className: "slot__label", text: label }),
    el("p", { className: "slot__place" }, [mapsLink(slot.mapQuery, slot.place)]),
  ]);

  if (slot.maps?.length) {
    box.append(
      el(
        "div",
        { className: "slot__maps" },
        slot.maps.map((m) => mapsLink(m.query, m.label))
      )
    );
  }

  box.append(el("p", { className: "slot__hours", text: slot.hours }));
  if (slot.note) box.append(el("p", { className: "slot__note", text: slot.note }));

  if (slot.ticketUrl) {
    const ticket = el("p", { className: "slot__ticket" }, [
      link(slot.ticketUrl, "Купить билет онлайн"),
    ]);
    if (slot.ticketNote) {
      ticket.append(document.createTextNode(` (${slot.ticketNote})`));
    }
    box.append(ticket);
  }

  return box;
}

function mealBookLine(label, meal) {
  if (meal.bookUrl) {
    const row = el("div", {}, [
      `${label}: `,
      link(meal.bookUrl, "Забронировать стол"),
    ]);
    if (meal.bookNote) row.append(document.createTextNode(` (${meal.bookNote})`));
    return row;
  }
  return el(
    "div",
    {
      text: `${label}: бронь не требуется${meal.bookNote ? ` — ${meal.bookNote}` : ""}`,
    }
  );
}

function renderDay(day) {
  const root = el("div", { className: "day-view" });

  root.append(
    el("div", { className: "day-head" }, [
      el("h3", { text: `${day.date}, ${day.weekday}` }),
      el("span", { className: "pill", text: day.theme }),
    ])
  );

  if (day.transport) {
    root.append(
      el("div", { className: "transport" }, [
        el("strong", { text: "Транспорт (>5 км): " }),
        day.transport,
      ])
    );
  }

  root.append(
    el("div", { className: "slots" }, [
      renderSlot("Утро", day.morning),
      renderSlot("День", day.afternoon),
      renderSlot("Вечер", day.evening),
    ])
  );

  const meals = el("div", { className: "meals" }, [el("h4", { text: "Где поесть" })]);
  const mealList = el("div", { className: "meal-list" });
  const rows = [
    [
      "Завтрак",
      day.breakfast,
      `${day.breakfast.breakfastFrom}–${day.breakfast.breakfastUntil}${
        day.breakfast.breakfastNote ? ` (${day.breakfast.breakfastNote})` : ""
      }`,
    ],
    ["Обед", day.lunch, null],
    ["Ужин", day.dinner, null],
  ];
  for (const [label, meal, bf] of rows) {
    const meta = [meal.hours, bf, meal.cost].filter(Boolean).join(" · ");
    mealList.append(
      el("article", { className: "meal-card" }, [
        el("p", { className: "meal-card__kind", text: label }),
        el("p", { className: "meal-card__name" }, [mapsLink(mealMapQuery(meal), meal.name)]),
        el("p", { className: "meal-card__meta", text: meta }),
        meal.vibe ? el("p", { className: "meal-card__vibe", text: meal.vibe }) : null,
      ])
    );
  }
  meals.append(mealList);
  root.append(meals);

  root.append(
    el("div", { className: "booking" }, [
      el("h4", { text: "Бронирование столиков" }),
      mealBookLine("Завтрак", day.breakfast),
      mealBookLine("Обед", day.lunch),
      mealBookLine("Ужин", day.dinner),
    ])
  );

  if (day.tips?.length) {
    root.append(
      el("div", { className: "tips" }, [
        el("h4", { text: "Советы" }),
        el(
          "ul",
          {},
          day.tips.map((tip) => el("li", { text: tip }))
        ),
      ])
    );
  }

  return root;
}

function fillTable(tableId, rows, labels = []) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  if (labels.length) table.dataset.labels = labels.join("|");
  tbody.replaceChildren();
  for (const cells of rows) {
    tbody.append(
      el(
        "tr",
        {},
        cells.map((cell, i) =>
          el("td", labels[i] ? { "data-label": labels[i] } : {}, [cell])
        )
      )
    );
  }
}

function setupCollapse() {
  document.querySelectorAll(".collapse-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-target");
      const body = document.getElementById(id);
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      body.hidden = open;
    });
  });
}

function parseFoodMin(cost) {
  const digits = cost.replace(/\D/g, "");
  return parseInt(digits.slice(0, 4), 10) || 0;
}

async function main() {
  const res = await fetch("./data.json");
  const data = await res.json();
  const { BASE, BASE_MAP, DAYS, CLOSED_DAYS, HIDDEN_SPOTS, VO_WALK, EXTRA_MUSEUMS, TEMPLES, LONG_TRIPS } = data;

  document.getElementById("base-link").href = yandexMapsUrl(BASE_MAP);
  document.getElementById("base-link").textContent = BASE;

  const foodMin = DAYS.reduce(
    (sum, d) =>
      sum + parseFoodMin(d.breakfast.cost) + parseFoodMin(d.lunch.cost) + parseFoodMin(d.dinner.cost),
    0
  );
  document.getElementById("stat-food").textContent = `~${Math.round(foodMin / 1000)}k ₽`;

  const select = document.getElementById("day-select");
  select.replaceChildren(
    ...DAYS.map((d) =>
      el("option", { value: d.id, text: `${d.date} (${d.weekday}) — ${d.theme}` })
    )
  );

  const dayView = document.getElementById("day-view");
  const showDay = (id) => {
    const day = DAYS.find((d) => d.id === id) ?? DAYS[0];
    dayView.replaceChildren(renderDay(day));
  };
  select.addEventListener("change", () => showDay(select.value));
  showDay(DAYS[0].id);

  document.getElementById("hidden-count").textContent = String(HIDDEN_SPOTS.length);
  fillTable(
    "hidden-table",
    HIDDEN_SPOTS.map((s) => [
      mapsLink(`${s.addr}, Санкт-Петербург`, s.addr),
      s.what,
      s.day,
    ]),
    ["Адрес", "Что смотреть", "День"]
  );

  document.getElementById("vo-count").textContent = String(VO_WALK.length);
  fillTable(
    "vo-table",
    VO_WALK.map((s) => [
      s.step,
      mapsLink(`${s.place}, Санкт-Петербург`, s.place),
      s.detail,
    ]),
    ["№", "Точка", "Что искать"]
  );

  document.getElementById("museums-count").textContent = String(EXTRA_MUSEUMS.length);
  fillTable(
    "museums-table",
    EXTRA_MUSEUMS.map((m) => [
      m.name,
      mapsLink(`${m.addr}, Санкт-Петербург`, m.addr),
      m.when,
      m.ticketUrl
        ? el("span", {}, [m.note, " · ", link(m.ticketUrl, "сайт")])
        : m.note,
    ]),
    ["Музей", "Адрес", "Когда", "Примечание"]
  );

  document.getElementById("temples-count").textContent = String(TEMPLES.length);
  fillTable(
    "temples-table",
    TEMPLES.map((t) => [
      t.name,
      mapsLink(`${t.addr}, Санкт-Петербург`, t.addr),
      t.note,
    ]),
    ["Храм", "Адрес", "Интересный факт"]
  );

  fillTable(
    "breakfast-table",
    DAYS.map((d) => [
      `${d.date} (${d.weekday})`,
      mapsLink(mealMapQuery(d.breakfast), d.breakfast.name),
      d.breakfast.breakfastFrom,
      d.breakfast.breakfastUntil,
      d.breakfast.breakfastNote ?? "—",
    ]),
    ["Дата", "Заведение", "С", "До", "Примечание"]
  );

  fillTable(
    "tickets-table",
    TICKETS.map(([place, href, label, when]) => [place, link(href, label), when]),
    ["Место", "Ссылка", "Когда"]
  );

  document.getElementById("closed-count").textContent = String(CLOSED_DAYS.length);
  fillTable(
    "closed-table",
    CLOSED_DAYS.map((r) => [r.place, r.closed]),
    ["Место", "Выходной"]
  );

  document.getElementById("trips-count").textContent = String(LONG_TRIPS.length);
  fillTable(
    "trips-table",
    LONG_TRIPS.map((r) => {
      const query = /Кронштадт|Ораниенбаум|Лахта|Севкабель|Probka|Il Lago/i.test(r.to)
        ? r.to.replace(/\(.*?\)/g, "").trim()
        : `${r.to}, Санкт-Петербург`;
      return [mapsLink(query, r.to), r.km, r.how, r.cost];
    }),
    ["Куда", "км", "Как", "Стоимость"]
  );

  fillTable(
    "overview-table",
    DAYS.map((d) => [
      d.date,
      d.weekday,
      d.morning.place.split("—")[0].split("(")[0].trim(),
      d.afternoon.place.split("(")[0].trim(),
      d.evening.place.split("(")[0].trim(),
      d.dinner.name,
    ]),
    ["Дата", "День", "Утро", "День", "Вечер", "Ужин"]
  );

  setupCollapse();
}

main().catch((err) => {
  console.error(err);
  document.getElementById("day-view").textContent =
    "Не удалось загрузить data.json. Откройте сайт через GitHub Pages или локальный сервер.";
});
