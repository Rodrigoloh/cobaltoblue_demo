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
    id: "carlos",
    name: "Dr. Carlos Rousseau",
    initials: "CR",
    role: "Estética dental",
    site: "carlos.html",
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

const serviceSlidesData = [
  {
    name: "Ortodoncia",
    color: "#6B5B50",
    image: "assets/service-ortodoncia.png",
    description: "Alineadores, brackets estéticos y seguimiento de mordida con planeación clara.",
    location: "01 / Diagnóstico y plan"
  },
  {
    name: "Sonrisa",
    color: "#B8A38A",
    image: "assets/service-diseno-sonrisa.png",
    description: "Blanqueamiento, resinas y carillas pensadas para verse naturales desde cerca.",
    location: "02 / Estética conservadora"
  },
  {
    name: "Endodoncia",
    color: "#4E676F",
    image: "assets/service-endodoncia.png",
    description: "Atención precisa para dolor, sensibilidad profunda y tratamientos de conducto.",
    location: "03 / Alivio y precisión"
  },
  {
    name: "Pediatría",
    color: "#8BA08A",
    image: "assets/service-odontopediatria.png",
    description: "Primeras visitas, prevención y tratamiento infantil con una experiencia tranquila.",
    location: "04 / Cuidado infantil"
  }
];

const doctorMap = Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor]));
const siteHeader = document.querySelector("#siteHeader");
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");
const heroPhoto = document.querySelector(".hero-photo");
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

const throttle = (callback, limit) => {
  let waiting = false;
  return function (...args) {
    if (waiting) return;
    callback.apply(this, args);
    waiting = true;
    setTimeout(() => {
      waiting = false;
    }, limit);
  };
};

const debounce = (callback, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback.apply(this, args), wait);
  };
};

class ServiceSlider {
  constructor() {
    this.current = 0;
    this.animating = false;
    this.total = serviceSlidesData.length;
    this.el = document.querySelector("[data-service-slider]");
    this.titleEl = document.querySelector(".slider__title");
    this.imagesEl = document.querySelector(".slider__images");
    this.descriptionEl = document.querySelector("[data-slider-description]");
    this.locationEl = document.querySelector("[data-slider-location]");
    this.slideEls = [];
    this.currentLine = null;
    this.cursorVisible = false;
    this.autoPlayId = null;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!this.el || !this.titleEl || !this.imagesEl) return;

    if (!window.gsap) {
      this.titleEl.textContent = serviceSlidesData[0].name;
      this.setInfo(0);
      this.imagesEl.innerHTML = `<div class="slider__slide" style="opacity:1;transform:translate(-50%,-50%);filter:none;z-index:3;"><img src="${serviceSlidesData[0].image}" alt="${serviceSlidesData[0].name}" /></div>`;
      this.el.style.backgroundColor = serviceSlidesData[0].color;
      return;
    }

    this.preload();
    this.setTitle(serviceSlidesData[0].name);
    this.setInfo(0);
    gsap.set(this.el, { backgroundColor: serviceSlidesData[0].color });
    this.buildCarousel();
    this.buildCursor();
    this.bind();
    this.startAutoPlay();
  }

  preload() {
    serviceSlidesData.forEach((slide) => {
      new Image().src = slide.image;
    });
  }

  mod(n) {
    return ((n % this.total) + this.total) % this.total;
  }

  isInView() {
    const rect = this.el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.74 && rect.bottom > window.innerHeight * 0.26;
  }

  buildCursor() {
    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "slider__cursor";
    this.cursorEl.textContent = "+";
    this.cursorEl.setAttribute("aria-hidden", "true");
    this.el.appendChild(this.cursorEl);
    gsap.set(this.cursorEl, { xPercent: -50, yPercent: -50, opacity: 0 });
    this.cursorMoveX = gsap.quickTo(this.cursorEl, "x", { duration: 0.5, ease: "power3" });
    this.cursorMoveY = gsap.quickTo(this.cursorEl, "y", { duration: 0.5, ease: "power3" });
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayId = setInterval(() => {
      if (!this.animating && this.isInView()) this.go("next");
    }, 4200);
  }

  stopAutoPlay() {
    if (!this.autoPlayId) return;
    clearInterval(this.autoPlayId);
    this.autoPlayId = null;
  }

  setInfo(index) {
    const slide = serviceSlidesData[index];
    if (this.descriptionEl) this.descriptionEl.innerHTML = slide.description;
    if (this.locationEl) this.locationEl.innerHTML = slide.location;
  }

  setTitle(text) {
    this.titleEl.innerHTML = "";
    const line = document.createElement("div");
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      line.appendChild(span);
    });
    this.titleEl.appendChild(line);
    this.currentLine = line;
  }

  animateTitle(newText, direction) {
    const h = this.titleEl.offsetHeight;
    const dir = direction === "next" ? 1 : -1;
    const oldLine = this.currentLine;
    const oldChars = [...oldLine.querySelectorAll("span")];

    this.titleEl.style.height = `${h}px`;
    oldLine.style.cssText = "position:absolute;top:0;left:0;width:100%";

    const newLine = document.createElement("div");
    newLine.style.cssText = "position:absolute;top:0;left:0;width:100%";
    [...newText].forEach((ch) => {
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      newLine.appendChild(span);
    });
    this.titleEl.appendChild(newLine);

    const newChars = [...newLine.querySelectorAll("span")];
    gsap.set(newChars, { y: h * dir });

    const duration = this.reducedMotion ? 0.01 : 1;
    const stagger = this.reducedMotion ? 0 : 0.04;
    const tl = gsap.timeline({
      onComplete: () => {
        oldLine.remove();
        newLine.style.cssText = "";
        gsap.set(newChars, { clearProps: "all" });
        this.titleEl.style.height = "";
        this.currentLine = newLine;
      }
    });

    tl.to(oldChars, { y: -h * dir, stagger, duration, ease: "expo.inOut" }, 0);
    tl.to(newChars, { y: 0, stagger, duration, ease: "expo.inOut" }, 0);
    return tl;
  }

  makeSlide(index) {
    const slide = document.createElement("div");
    slide.className = "slider__slide";
    const img = document.createElement("img");
    img.src = serviceSlidesData[index].image;
    img.alt = serviceSlidesData[index].name;
    img.width = 600;
    img.height = 420;
    slide.appendChild(img);
    return slide;
  }

  getSlideProps(step) {
    const h = this.imagesEl.offsetHeight;
    const absStep = Math.abs(step);
    const positions = [
      { x: -0.35, y: -0.95, rot: -30, s: 1.35, b: 16, o: 0 },
      { x: -0.18, y: -0.5, rot: -15, s: 1.15, b: 8, o: 0.55 },
      { x: 0, y: 0, rot: 0, s: 1, b: 0, o: 1 },
      { x: -0.06, y: 0.5, rot: 15, s: 0.75, b: 6, o: 0.55 },
      { x: -0.12, y: 0.95, rot: 30, s: 0.55, b: 14, o: 0 }
    ];
    const props = positions[Math.max(0, Math.min(4, step + 2))];

    return {
      x: props.x * h,
      y: props.y * h,
      rotation: props.rot,
      scale: props.s,
      blur: props.b,
      opacity: props.o,
      zIndex: absStep === 0 ? 3 : absStep === 1 ? 2 : 1
    };
  }

  positionSlide(slide, step) {
    const props = this.getSlideProps(step);
    gsap.set(slide, {
      xPercent: -50,
      yPercent: -50,
      x: props.x,
      y: props.y,
      rotation: props.rotation,
      scale: props.scale,
      opacity: props.opacity,
      filter: `blur(${props.blur}px)`,
      zIndex: props.zIndex
    });
  }

  buildCarousel() {
    if (!this.imagesEl.offsetHeight) return;
    this.imagesEl.innerHTML = "";
    this.slideEls = [];

    for (let step = -1; step <= 1; step += 1) {
      const index = this.mod(this.current + step);
      const slide = this.makeSlide(index);
      this.imagesEl.appendChild(slide);
      this.positionSlide(slide, step);
      this.slideEls.push({ el: slide, step });
    }
  }

  animateCarousel(direction) {
    if (!this.imagesEl.offsetHeight) return gsap.timeline();

    const shift = direction === "next" ? -1 : 1;
    const enterStep = direction === "next" ? 2 : -2;
    const newIndex = direction === "next" ? this.mod(this.current + 2) : this.mod(this.current - 2);
    const newSlide = this.makeSlide(newIndex);
    this.imagesEl.appendChild(newSlide);
    this.positionSlide(newSlide, enterStep);
    this.slideEls.push({ el: newSlide, step: enterStep });
    this.slideEls.forEach((slide) => {
      slide.step += shift;
    });

    const duration = this.reducedMotion ? 0.01 : 1.2;
    const tl = gsap.timeline({
      onComplete: () => {
        this.slideEls = this.slideEls.filter((slide) => {
          if (Math.abs(slide.step) >= 2) {
            slide.el.remove();
            return false;
          }
          return true;
        });
      }
    });

    this.slideEls.forEach((slide) => {
      const props = this.getSlideProps(slide.step);
      slide.el.style.zIndex = props.zIndex;
      tl.to(
        slide.el,
        {
          x: props.x,
          y: props.y,
          rotation: props.rotation,
          scale: props.scale,
          opacity: props.opacity,
          filter: `blur(${props.blur}px)`,
          duration,
          ease: "power3.inOut"
        },
        0
      );
    });

    return tl;
  }

  go(direction) {
    if (this.animating) return;
    this.animating = true;
    this.startAutoPlay();

    const nextIndex = direction === "next" ? this.mod(this.current + 1) : this.mod(this.current - 1);
    const master = gsap.timeline({
      onComplete: () => {
        this.current = nextIndex;
        this.setInfo(nextIndex);
        this.animating = false;
      }
    });

    master.to(
      this.el,
      {
        backgroundColor: serviceSlidesData[nextIndex].color,
        duration: this.reducedMotion ? 0.01 : 1.2,
        ease: "power2.inOut"
      },
      0
    );
    master.add(this.animateTitle(serviceSlidesData[nextIndex].name, direction), 0);
    master.add(this.animateCarousel(direction), 0);
  }

  bind() {
    const onWheel = throttle((event) => {
      if (this.animating || !this.isInView()) return;
      event.preventDefault();
      this.go(event.deltaY > 0 ? "next" : "prev");
    }, 1300);
    this.el.addEventListener("wheel", onWheel, { passive: false });

    let touchStartY = 0;
    this.el.addEventListener("touchstart", (event) => {
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    const onTouchEnd = throttle((event) => {
      if (this.animating) return;
      const diff = touchStartY - event.changedTouches[0].clientY;
      if (Math.abs(diff) < 40) return;
      this.go(diff > 0 ? "next" : "prev");
    }, 1300);
    this.el.addEventListener("touchend", onTouchEnd, { passive: true });

    window.addEventListener("keydown", (event) => {
      if (this.animating || !this.isInView()) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") this.go("next");
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") this.go("prev");
    });

    this.el.addEventListener("mousemove", (event) => {
      if (!this.cursorVisible) {
        gsap.to(this.cursorEl, { opacity: 1, duration: 0.3 });
        this.cursorVisible = true;
      }
      this.cursorMoveX(event.clientX);
      this.cursorMoveY(event.clientY);
    }, { passive: true });

    this.el.addEventListener("mouseleave", () => {
      gsap.to(this.cursorEl, { opacity: 0, duration: 0.3 });
      this.cursorVisible = false;
    });

    window.addEventListener("resize", debounce(() => {
      if (!this.animating && this.imagesEl.offsetHeight > 0) {
        this.slideEls.forEach((slide) => this.positionSlide(slide.el, slide.step));
      }
    }, 300), { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.animating = false;
        this.stopAutoPlay();
      } else {
        this.startAutoPlay();
      }
    });
  }
}

function renderDoctors() {
  doctorTrack.innerHTML = `
    <div class="team-stage" data-active="">
      <img class="team-sheet" src="assets/tudd-doctors-sheet.png" alt="Equipo clínico Clinica Dental Oris" />
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
              <span>${doctor.name.replace(/^Dr(a)?\\.\\s/, "")}</span>
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

function setSubmitState(isLoading) {
  const button = document.querySelector("#bookSubmit");
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? "enviando..." : "confirmar cita";
}

async function submitBooking() {
  const name = document.querySelector("#bookName").value.trim();
  const email = document.querySelector("#bookEmail").value.trim();
  const phone = document.querySelector("#bookPhone").value.trim();

  if (!bookingState.date || !bookingState.time) {
    shake(".pill-row");
    return;
  }

  if (!name || !email || !phone) {
    shake(".form-field input");
    return;
  }

  setSubmitState(true);

  const payload = {
    doctor: bookingState.doctor.name,
    role: bookingState.doctor.role,
    date: bookingState.date,
    time: bookingState.time,
    name,
    email,
    phone
  };

  try {
    modalContent.querySelector(".form-error")?.remove();
    const response = await fetch("/api/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "No pudimos enviar la confirmacion");
    }

    bookingState.confirmation = data;
  } catch (error) {
    setSubmitState(false);
    modalContent.querySelector(".form-error")?.remove();
    const errorMessage = document.createElement("p");
    errorMessage.className = "form-error";
    errorMessage.textContent = error.message;
    modalContent.append(errorMessage);
    return;
  }

  const confirmationNote = bookingState.confirmation?.sent?.includes("correo_paciente")
    ? `Te enviamos la confirmación a ${email}.`
    : "Recibimos tu solicitud y te contactaremos para confirmar disponibilidad.";

  modalContent.innerHTML = `
    <div class="confirm-state">
      <div class="confirm-icon">✓</div>
      <h3>Cita solicitada</h3>
      <p>${confirmationNote} Tu especialista recibirá la solicitud antes de tu llegada.</p>
      <div class="confirm-detail">
        <div><span>especialista</span><strong>${bookingState.doctor.name}</strong></div>
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

  if (reviewStack) {
    const rect = reviewStack.getBoundingClientRect();
    const offset = (rect.top - window.innerHeight * 0.72) * -0.045;
    reviewStack.style.transform = `translateY(${Math.max(-14, Math.min(42, offset + 24))}px)`;
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

new ServiceSlider();
renderDoctors();
renderReviews();

window.setInterval(() => {
  activeReview = (activeReview + 1) % reviews.length;
  renderReviews();
}, 4200);

