// ---------- Settings you may want to change ----------
const WHATSAPP_NUMBER = "254722625072"; // international format, no + or spaces
const OPEN_HOUR = 7; // first booking slot: 7:00 AM
const CLOSE_HOUR = 19; // last booking slot: 7:00 PM

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Mobile menu ----------
const nav = document.getElementById("nav");
const menuToggle = document.getElementById("menuToggle");
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.textContent = open ? "✕" : "☰";
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.textContent = "☰";
  }),
);

// ---------- Booking popup ----------
const modal = document.getElementById("modal");
const form = document.getElementById("bookingForm");
const done = document.getElementById("bookingDone");
const timeSelect = document.getElementById("time");
const dateInput = document.getElementById("date");

// Fill the time dropdown (every 30 minutes)
for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) {
  for (const m of [0, 30]) {
    if (h === CLOSE_HOUR && m === 30) continue;
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${hour12}:${m === 0 ? "00" : "30"} ${h < 12 ? "AM" : "PM"}`;
    timeSelect.add(new Option(label, label));
  }
}

// Don't allow past dates
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function openModal(service, location) {
  form.reset();
  form.querySelectorAll("em").forEach((e) => (e.textContent = ""));
  dateInput.min = todayISO();
  if (service) form.elements.service.value = service;
  if (location) form.elements.location.value = location;
  form.hidden = false;
  done.hidden = true;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

// Any element with data-book opens the popup. data-service="..." preselects a service.
document
  .querySelectorAll("[data-book]")
  .forEach((btn) =>
    btn.addEventListener("click", () =>
      openModal(btn.dataset.service, btn.dataset.location),
    ),
  );
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("doneClose").addEventListener("click", closeModal);
modal.addEventListener("mousedown", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

// Turn 0722 625 072 / 722625072 / +254722625072 into +254722625072
function normalizeKenyanPhone(input) {
  let p = input.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "254" + p.slice(1);
  else if (/^[71]\d{8}$/.test(p)) p = "254" + p;
  return /^254[71]\d{8}$/.test(p) ? "+" + p : null;
}

function showError(name, message) {
  const field = form.elements[name];
  const em = field.parentElement.querySelector("em");
  if (em) em.textContent = message;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  form.querySelectorAll("em").forEach((el) => (el.textContent = ""));

  const data = Object.fromEntries(new FormData(form));
  let ok = true;
  const fail = (field, msg) => {
    showError(field, msg);
    ok = false;
  };

  if (!data.service) fail("service", "Choose a service");
  if (!data.location) fail("location", "Choose a branch");
  if (!data.date) fail("date", "Pick a date");
  else if (data.date < todayISO())
    fail("date", "Pick a date from today onwards");
  if (!data.time) fail("time", "Pick a time");
  if (data.name.trim().length < 2) fail("name", "Enter your name");
  const phone = normalizeKenyanPhone(data.phone);
  if (!phone) fail("phone", "Enter a valid number, e.g. 0722 625 072");
  if (!ok) return;

  // TODO (backend step): send this to the server so it is saved in the database.
  const booking = { ...data, name: data.name.trim(), phone };
  console.log("Booking request (not saved anywhere yet):", booking);

  const text =
    `Hello Posh Salon, I'd like to book ${booking.service} at ${booking.location} ` +
    `on ${booking.date} at ${booking.time}. Name: ${booking.name}, Phone: ${booking.phone}.` +
    (booking.notes ? ` Notes: ${booking.notes}` : "");

  document.getElementById("doneText").textContent =
    `Thank you, ${booking.name}. To get an instant confirmation, send your request to us on WhatsApp.`;
  document.getElementById("waConfirm").href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  form.hidden = true;
  done.hidden = false;
});

// ---------- Copy address button ----------
const copyBtn = document.getElementById("copyAddress");
if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    const done = () => {
      copyBtn.classList.add("copied");
      setTimeout(() => copyBtn.classList.remove("copied"), 1500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyBtn.dataset.copy).then(done, () => {});
    }
  });
}