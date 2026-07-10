const CLINIC_WHATSAPP = process.env.CLINIC_WHATSAPP_TO || "528182085411";
const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "";
const WHATSAPP_SENDER_NUMBER = process.env.WHATSAPP_SENDER_NUMBER || "";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  if (digits.length > 10) return digits;

  return "";
}

function samePhone(left, right) {
  return normalizePhone(left) === normalizePhone(right);
}

function buildMessage(booking) {
  return [
    "Hola, tu solicitud de cita en tüdd fue recibida.",
    "",
    `Doctora: ${booking.doctor}`,
    `Especialidad: ${booking.role}`,
    `Dia: ${booking.date}`,
    `Hora: ${booking.time}`,
    "",
    "Te contactaremos para confirmar disponibilidad final."
  ].join("\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendWhatsApp(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || !to) {
    return { channel: "whatsapp", skipped: true };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "No se pudo enviar WhatsApp");
  }

  return { channel: "whatsapp", skipped: false, data };
}

async function sendEmail(booking) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from || !booking.email) {
    return { channel: "email", skipped: true };
  }

  const safeName = escapeHtml(booking.name);
  const safeDoctor = escapeHtml(booking.doctor);
  const safeRole = escapeHtml(booking.role);
  const safeDate = escapeHtml(booking.date);
  const safeTime = escapeHtml(booking.time);
  const subject = `Bienvenida a tüdd, ${booking.name}`;
  const html = `
    <div style="margin:0;background:#fbf5ea;padding:32px 18px;font-family:Inter,Arial,sans-serif;color:#2e2318;line-height:1.6">
      <div style="max-width:620px;margin:0 auto;background:#f3e8d8;border:1px solid rgba(46,35,24,.14);padding:34px">
        <p style="margin:0 0 28px;font-size:26px;letter-spacing:.06em;font-weight:300">tüdd</p>
        <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:400;font-size:34px;line-height:1.08">Hola ${safeName}, bienvenida a tüdd.</h1>
        <p style="margin:0 0 24px;color:#4a3a2a">Tu cita quedó registrada con nuestro equipo. Te esperamos con calma, escucha y el cuidado clínico que tu sonrisa merece.</p>
        <div style="border-top:1px solid rgba(46,35,24,.16);border-bottom:1px solid rgba(46,35,24,.16);padding:18px 0;margin:24px 0">
          <p style="margin:0 0 10px"><strong>Doctora:</strong> ${safeDoctor}</p>
          <p style="margin:0 0 10px"><strong>Especialidad:</strong> ${safeRole}</p>
          <p style="margin:0 0 10px"><strong>Día:</strong> ${safeDate}</p>
          <p style="margin:0"><strong>Hora:</strong> ${safeTime}</p>
        </div>
        <p style="margin:0 0 18px;color:#4a3a2a">Si necesitamos ajustar algún detalle de disponibilidad, nos pondremos en contacto contigo antes de tu visita.</p>
        <p style="margin:0;color:#8c7a63;font-size:13px">Av Paseo de los Leones 2020, Cumbres 3o. Sector, Plaza Altezza piso 1, Monterrey, N.L.</p>
      </div>
    </div>
  `;

  const payload = {
    from,
    to: [booking.email],
    subject,
    html
  };

  if (CLINIC_EMAIL && CLINIC_EMAIL !== booking.email) {
    payload.bcc = [CLINIC_EMAIL];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo enviar correo");
  }

  return { channel: "email", skipped: false, data };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { ok: false, error: "Metodo no permitido" });
  }

  try {
    const booking = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const required = ["doctor", "role", "date", "time", "name", "email", "phone"];
    const missing = required.filter((field) => !String(booking[field] || "").trim());

    if (missing.length) {
      return sendJson(response, 400, { ok: false, error: "Faltan datos de la cita", missing });
    }

    const patientPhone = normalizePhone(booking.phone);

    if (!patientPhone) {
      return sendJson(response, 400, { ok: false, error: "Telefono no valido" });
    }

    const patientMessage = buildMessage(booking);
    const clinicMessage = [
      "Nueva solicitud de cita en tüdd",
      "",
      `Paciente: ${booking.name}`,
      `Telefono: +${patientPhone}`,
      `Correo: ${booking.email}`,
      `Doctora: ${booking.doctor}`,
      `Especialidad: ${booking.role}`,
      `Dia: ${booking.date}`,
      `Hora: ${booking.time}`
    ].join("\n");

    const jobs = [
      ["whatsapp_paciente", sendWhatsApp(patientPhone, patientMessage)],
      ["correo_paciente", sendEmail({ ...booking, phone: patientPhone })]
    ];

    if (CLINIC_WHATSAPP && !samePhone(CLINIC_WHATSAPP, WHATSAPP_SENDER_NUMBER)) {
      jobs.push(["whatsapp_consultorio", sendWhatsApp(CLINIC_WHATSAPP, clinicMessage)]);
    }

    const settled = await Promise.allSettled(jobs.map((job) => job[1]));
    const results = settled.map((result, index) => ({
      name: jobs[index][0],
      status: result.status,
      value: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason.message : null
    }));

    const sent = results.filter((result) => result.status === "fulfilled" && !result.value?.skipped);
    const skipped = results
      .filter((result) => result.status === "fulfilled" && result.value?.skipped)
      .map((result) => result.name);
    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => `${result.name}: ${result.error}`);
    const emailResult = results.find((result) => result.name === "correo_paciente");

    if (!emailResult || emailResult.status !== "fulfilled" || emailResult.value?.skipped) {
      return sendJson(response, 502, {
        ok: false,
        error:
          emailResult?.error ||
          "No se pudo enviar el correo de confirmacion. Revisa RESEND_API_KEY y MAIL_FROM en Vercel.",
        sent: sent.map((result) => result.name),
        skipped,
        warnings: errors
      });
    }

    if (!sent.length) {
      return sendJson(response, 502, {
        ok: false,
        error: errors.length
          ? errors.join(" | ")
          : "No hay canales de confirmacion configurados en Vercel",
        skipped
      });
    }

    return sendJson(response, 200, {
      ok: true,
      sent: sent.map((result) => result.name),
      skipped,
      warnings: errors
    });
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error.message || "Error inesperado" });
  }
};
