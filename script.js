const doctors = [
  {
    id: "valeria",
    name: "Dra. Valeria Montes",
    initials: "VM",
    specialty: "Diagnostico integral y prevencion",
    availability: "Lun, mie, vie",
    summary: "Ideal para primera visita, limpieza, sensibilidad, revision general y planes preventivos.",
    tags: ["revision", "limpieza", "sensibilidad", "rutina"]
  },
  {
    id: "ines",
    name: "Dra. Ines Aranda",
    initials: "IA",
    specialty: "Estetica dental y diseno de sonrisa",
    availability: "Mar, jue, sab",
    summary: "Para blanqueamiento, resinas, carillas, cambios de color o armonia visible de la sonrisa.",
    tags: ["estetica", "blanqueamiento", "carillas", "resinas"]
  },
  {
    id: "camila",
    name: "Dra. Camila Rohe",
    initials: "CR",
    specialty: "Rehabilitacion y restauraciones",
    availability: "Lun a jue",
    summary: "Para dolor al morder, coronas, fracturas, restauraciones profundas o piezas desgastadas.",
    tags: ["dolor", "fractura", "corona", "rehabilitacion"]
  },
  {
    id: "sofia",
    name: "Dra. Sofia Neri",
    initials: "SN",
    specialty: "Odontologia familiar y cuidado suave",
    availability: "Mie a sab",
    summary: "Para ninos, adolescentes, ansiedad dental, seguimiento familiar y consultas de baja urgencia.",
    tags: ["familia", "ninos", "ansiedad", "seguimiento"]
  }
];

const questions = [
  {
    label: "01 / 04",
    text: "¿Qué describe mejor tu motivo de consulta?",
    options: [
      { label: "Revision, limpieza o molestia leve", scores: { valeria: 3, sofia: 1 } },
      { label: "Quiero mejorar mi sonrisa", scores: { ines: 3, valeria: 1 } },
      { label: "Dolor, fractura o restauracion", scores: { camila: 3, valeria: 1 } },
      { label: "Consulta para mi familia o ansiedad dental", scores: { sofia: 3, valeria: 1 } }
    ]
  },
  {
    label: "02 / 04",
    text: "¿Qué tan pronto te gustaría ser atendido?",
    options: [
      { label: "Lo antes posible", scores: { camila: 2, valeria: 1 } },
      { label: "Esta semana", scores: { valeria: 2, sofia: 1 } },
      { label: "Puedo esperar unos dias", scores: { ines: 1, sofia: 1 } },
      { label: "Solo quiero orientacion inicial", scores: { valeria: 2 } }
    ]
  },
  {
    label: "03 / 04",
    text: "¿Qué resultado te importa más en esta visita?",
    options: [
      { label: "Entender qué tengo y prevenir", scores: { valeria: 3 } },
      { label: "Verme mejor sin perder naturalidad", scores: { ines: 3 } },
      { label: "Recuperar funcion y comodidad", scores: { camila: 3 } },
      { label: "Sentirme en confianza durante la cita", scores: { sofia: 3 } }
    ]
  },
  {
    label: "04 / 04",
    text: "¿Quién asistirá a la consulta?",
    options: [
      { label: "Yo", scores: { valeria: 1, ines: 1, camila: 1 } },
      { label: "Un adulto mayor", scores: { camila: 2, valeria: 1 } },
      { label: "Un niño o adolescente", scores: { sofia: 3 } },
      { label: "Aun no estoy seguro", scores: { valeria: 2 } }
    ]
  }
];

const state = {
  step: 0,
  scores: Object.fromEntries(doctors.map((doctor) => [doctor.id, 0])),
  history: [],
  selectedDoctor: doctors[0]
};

const optionsEl = document.querySelector("#triage-options");
const questionEl = document.querySelector("#triage-question");
const stepEl = document.querySelector("#triage-step");
const backButton = document.querySelector("#triage-back");
const resetButton = document.querySelector("#triage-reset");
const resultEl = document.querySelector("#triage-result");
const resultDoctorEl = document.querySelector("#result-doctor");
const resultCopyEl = document.querySelector("#result-copy");
const doctorGridEl = document.querySelector("#doctor-grid");
const doctorSelectEl = document.querySelector("#doctor-select");
const bookingForm = document.querySelector("#booking-form");
const formNote = document.querySelector("#form-note");

function renderDoctors() {
  doctorGridEl.innerHTML = doctors
    .map(
      (doctor) => `
        <article class="doctor-card">
          <div class="doctor-portrait"><span>${doctor.initials}</span></div>
          <div class="doctor-meta">${doctor.specialty}</div>
          <h3>${doctor.name}</h3>
          <p>${doctor.summary}</p>
          <p><strong>Agenda:</strong> ${doctor.availability}</p>
          <button class="ghost-button" type="button" data-doctor="${doctor.id}">Elegir doctora</button>
        </article>
      `
    )
    .join("");

  doctorSelectEl.innerHTML = [
    '<option value="">Selecciona</option>',
    ...doctors.map((doctor) => `<option value="${doctor.id}">${doctor.name}</option>`)
  ].join("");
}

function renderQuestion() {
  const current = questions[state.step];
  stepEl.textContent = current.label;
  questionEl.textContent = current.text;
  resultEl.hidden = true;
  optionsEl.hidden = false;
  backButton.disabled = state.step === 0;
  optionsEl.innerHTML = current.options
    .map((option, index) => `<button class="option-button" type="button" data-option="${index}">${option.label}</button>`)
    .join("");
}

function applyScores(scores) {
  Object.entries(scores).forEach(([id, value]) => {
    state.scores[id] += value;
  });
}

function showResult() {
  const winner = doctors.reduce((best, doctor) => {
    return state.scores[doctor.id] > state.scores[best.id] ? doctor : best;
  }, doctors[0]);

  state.selectedDoctor = winner;
  doctorSelectEl.value = winner.id;
  resultDoctorEl.textContent = winner.name;
  resultCopyEl.textContent = `${winner.specialty}. ${winner.summary}`;
  optionsEl.hidden = true;
  resultEl.hidden = false;
  stepEl.textContent = "Listo";
  questionEl.textContent = "Con base en tus respuestas, esta es la mejor ruta inicial.";
}

function resetTriage() {
  state.step = 0;
  state.scores = Object.fromEntries(doctors.map((doctor) => [doctor.id, 0]));
  state.history = [];
  state.selectedDoctor = doctors[0];
  renderQuestion();
}

optionsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-option]");
  if (!button) return;

  const option = questions[state.step].options[Number(button.dataset.option)];
  state.history[state.step] = option.scores;
  applyScores(option.scores);

  if (state.step === questions.length - 1) {
    showResult();
    return;
  }

  state.step += 1;
  renderQuestion();
});

backButton.addEventListener("click", () => {
  if (state.step === 0) return;
  state.step -= 1;
  state.history = state.history.slice(0, state.step);
  state.scores = Object.fromEntries(doctors.map((doctor) => [doctor.id, 0]));
  state.history.forEach(applyScores);
  renderQuestion();
});

resetButton.addEventListener("click", resetTriage);

doctorGridEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-doctor]");
  if (!button) return;

  doctorSelectEl.value = button.dataset.doctor;
  document.querySelector("#agenda").scrollIntoView({ behavior: "smooth" });
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const doctor = doctors.find((item) => item.id === data.get("doctor"));
  const name = data.get("name");
  formNote.textContent = `Gracias, ${name}. Preparamos tu solicitud con ${doctor.name}; el consultorio te contactara para confirmar.`;
  bookingForm.reset();
});

renderDoctors();
renderQuestion();
