const doctors = [
  {
    id: "elena",
    name: "Dra. Elena Vidal",
    initials: "EV",
    role: "Ortodoncia",
    site: "elena.html",
    bio: "Alineación dental, mordida y seguimiento con alineadores o brackets estéticos.",
    position: "12.5%",
    keywords: ["ortodoncia", "bracket", "brackets", "alineador", "alinear", "mordida", "chueco", "chuecos", "invisalign"]
  },
  {
    id: "camila",
    name: "Dra. Camila Rousseau",
    initials: "CR",
    role: "Estética dental",
    site: "camila.html",
    bio: "Diseño de sonrisa, blanqueamiento, resinas y carillas con enfoque conservador.",
    position: "37.5%",
    keywords: ["estetica", "estética", "blanque", "carilla", "resina", "sonrisa", "mancha", "color", "amarillo"]
  },
  {
    id: "naomi",
    name: "Dra. Naomi Serrano",
    initials: "NS",
    role: "Endodoncia",
    site: "naomi.html",
    bio: "Dolor, urgencias, sensibilidad profunda y tratamientos de conducto.",
    position: "62.5%",
    keywords: ["dolor", "duele", "caries", "conducto", "endodoncia", "urgencia", "sensibilidad", "nervio", "absceso"]
  },
  {
    id: "julieta",
    name: "Dra. Julieta Fontán",
    initials: "JF",
    role: "Odontopediatría",
    site: "julieta.html",
    bio: "Primeras visitas, prevención y tratamiento dental para niñas, niños y adolescentes.",
    position: "87.5%",
    keywords: ["hijo", "hija", "niño", "niña", "nino", "nina", "pediatr", "bebé", "bebe", "infantil", "adolescente"]
  }
];

const reviews = [
  {
    name: "Renata M.",
    meta: "Ortodoncia",
    text: "El proceso se sintió acompañado desde el primer día. Me explicaron tiempos, opciones y seguimiento sin prisa."
  },
  {
    name: "Óscar T.",
    meta: "Urgencia",
    text: "Llegué con dolor y me atendieron con muchísima calma. Entendí qué estaba pasando antes de tomar cualquier decisión."
  },
  {
    name: "Paula G.",
    meta: "Odontopediatría",
    text: "Mi hija entró nerviosa y salió tranquila. La doctora supo convertir la consulta en algo amable."
  }
];

const doctorMap = Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor]));
const siteHeader = document.querySelector("#siteHeader");
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");
const heroPhoto = document.querySelector(".hero-photo");
const heroInner = document.querySelector("#heroInner");
const assistantInput = document.querySelector("#assistantInput");
const assistantResponse = document.querySelector("#assistantResponse");
const sendBtn = document.querySelector("#sendBtn");
const doctorTrack = document.querySelector("#doctorTrack");
const reviewGrid = document.querySelector("#reviewGrid");
const modalOverlay = document.querySelector("#modalOverlay");
const modalClose = document.querySelector("#modalClose");
const modalContent = document.querySelector("#modalContent");
const reviewStack = document.querySelector("[data-parallax-reviews]");

let bookingState = {};
let activeReview = 0;

function renderDoctors() {
  doctorTrack.innerHTML = `
    <div class="team-stage" data-active="">
      <img class="team-sheet" src="public/assets/tudd-doctors-sheet.png" alt="Equipo clínico tüdd" />
      ${doctors
        .map(
          (doctor, index) => `
            <a
              class="team-hotspot"
              href="${doctor.site}"
              data-doctor-zone="${doctor.id}"
              style="--zone-left: ${index * 25}%;"
              aria-label="Ver micrositio de ${doctor.name}"
            ></a>
            <span class="team-dim" data-dim-zone="${doctor.id}" style="--zone-left: ${index * 25}%;"></span>
          `
        )
        .join("")}
    </div>
    <div class="team-name-row">
      ${doctors
        .map(
          (doctor) => `
            <a class="team-name" href="${doctor.site}" data-doctor-name="${doctor.id}">
              <span>${doctor.name.replace("Dra. ", "")}</span>
              <small>${doctor.role}</small>
            </a>
          `
        )
        .join("")}
    </div>
  `;

  const stage = doctorTrack.querySelector(".team-stage");
  const interactiveItems = doctorTrack.querySelectorAll("[data-doctor-zone], [data-doctor-name]");

  interactiveItems.forEach((item) => {
    const id = item.dataset.doctorZone || item.dataset.doctorName;
    item.addEventListener("mouseenter", () => setActiveDoctor(id));
    item.addEventListener("focus", () => setActiveDoctor(id));
    item.addEventListener("mouseleave", clearActiveDoctor);
    item.addEventListener("blur", clearActiveDoctor);
  });

  function setActiveDoctor(id) {
    stage.dataset.active = id;
    doctorTrack.querySelectorAll("[data-doctor-name]").forEach((item) => {
      item.classList.toggle("active", item.dataset.doctorName === id);
    });
    doctorTrack.querySelectorAll("[data-dim-zone]").forEach((item) => {
      item.classList.toggle("dimmed", item.dataset.dimZone !== id);
    });
  }

  function clearActiveDoctor() {
    stage.dataset.active = "";
    doctorTrack.querySelectorAll("[data-doctor-name]").forEach((item) => item.classList.remove("active"));
    doctorTrack.querySelectorAll("[data-dim-zone]").forEach((item) => item.classList.remove("dimmed"));
  }
}

function renderReviews() {
  const review = reviews[activeReview];
  reviewGrid.innerHTML = `
    <article class="review-card">
      <div class="review-stars">★★★★★</div>
      <p>${review.text}</p>
      <span>${review.name} · ${review.meta}</span>
    </article>
  `;
}

function matchDoctor(text) {
  const normalized = text.toLowerCase();
  return doctors.find((doctor) => doctor.keywords.some((keyword) => normalized.includes(keyword))) || doctors[0];
}

function handleTriage(value) {
  const text = value.trim();
  if (!text) return;

  const doctor = matchDoctor(text);
  assistantResponse.innerHTML = `
    Te sugerimos empezar con <strong>${doctor.name}</strong>, ${doctor.role.toLowerCase()}.
    <button type="button" data-open-booking="${doctor.id}">Agendar →</button>
  `;
  assistantInput.value = "";
}

function nextDays(count) {
  const names = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const days = [];
  const date = new Date();

  while (days.length < count) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) {
      days.push({
        key: date.toISOString().slice(0, 10),
        label: `${names[date.getDay()]} ${date.getDate()}`
      });
    }
  }

  return days;
}

function openBooking(doctorId) {
  const doctor = doctorMap[doctorId] || doctors[0];
  const days = nextDays(5);
  const times = ["9:00", "10:30", "12:00", "15:00", "16:30"];
  bookingState = { doctor, date: "", time: "" };

  modalContent.innerHTML = `
    <div class="modal-doctor">
      <div class="modal-avatar">${doctor.initials}</div>
      <div>
        <h3 id="modalTitle">${doctor.name}</h3>
        <p>${doctor.role}</p>
      </div>
    </div>
    <span class="modal-label">elige un día</span>
    <div class="pill-row">${days.map((day) => `<button class="pill-option" type="button" data-date="${day.label}">${day.label}</button>`).join("")}</div>
    <span class="modal-label">elige un horario</span>
    <div class="pill-row">${times.map((time) => `<button class="pill-option" type="button" data-time="${time}">${time}</button>`).join("")}</div>
    <div class="form-field"><input id="bookName" type="text" placeholder="Nombre completo" /></div>
    <div class="form-field"><input id="bookEmail" type="email" placeholder="Correo electrónico" /></div>
    <div class="form-field"><input id="bookPhone" type="tel" placeholder="Teléfono o WhatsApp" /></div>
    <button class="modal-submit" id="bookSubmit" type="button">confirmar cita</button>
  `;

  modalContent.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      modalContent.querySelectorAll("[data-date]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      bookingState.date = button.dataset.date;
    });
  });

  modalContent.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      modalContent.querySelectorAll("[data-time]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      bookingState.time = button.dataset.time;
    });
  });

  document.querySelector("#bookSubmit").addEventListener("click", submitBooking);
  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeBooking() {
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function shake(selector) {
  modalContent.querySelectorAll(selector).forEach((element) => {
    element.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 220 }
    );
  });
}

function submitBooking() {
  const name = document.querySelector("#bookName").value.trim();
  const email = document.querySelector("#bookEmail").value.trim();

  if (!bookingState.date || !bookingState.time) {
    shake(".pill-row");
    return;
  }

  if (!name || !email) {
    shake(".form-field input");
    return;
  }

  modalContent.innerHTML = `
    <div class="confirm-state">
      <div class="confirm-icon">✓</div>
      <h3>Cita solicitada</h3>
      <p>Te enviaremos la confirmación a ${email}. La doctora recibirá tu solicitud antes de tu llegada.</p>
      <div class="confirm-detail">
        <div><span>doctora</span><strong>${bookingState.doctor.name}</strong></div>
        <div><span>día</span><strong>${bookingState.date}</strong></div>
        <div><span>hora</span><strong>${bookingState.time}</strong></div>
      </div>
      <button class="btn btn-outline" type="button" onclick="closeBooking()">listo</button>
    </div>
  `;
}

function onScroll() {
  const y = window.scrollY;
  const factor = Math.min(y / window.innerHeight, 1);
  siteHeader.classList.toggle("scrolled", y > 30);
  heroPhoto.style.transform = `translateY(${y * 0.28}px) scale(${1 + factor * 0.1})`;
  heroInner.style.transform = `translateY(${factor * 86}px) scale(${1 - factor * 0.05})`;
  heroInner.style.opacity = `${1 - factor * 0.88}`;

  if (reviewStack) {
    const rect = reviewStack.getBoundingClientRect();
    const offset = (rect.top - window.innerHeight * 0.5) * -0.08;
    reviewStack.style.transform = `translateY(${Math.max(-34, Math.min(34, offset))}px)`;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("open");
  mainNav.classList.toggle("open");
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("open");
    mainNav.classList.remove("open");
  });
});

sendBtn.addEventListener("click", () => handleTriage(assistantInput.value));
assistantInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleTriage(assistantInput.value);
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-booking]");
  if (!trigger) return;
  openBooking(trigger.dataset.openBooking);
});

modalClose.addEventListener("click", closeBooking);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeBooking();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeBooking();
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

renderDoctors();
renderReviews();

window.setInterval(() => {
  activeReview = (activeReview + 1) % reviews.length;
  renderReviews();
}, 4200);
