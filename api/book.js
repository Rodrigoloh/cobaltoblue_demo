const CLINIC_WHATSAPP = process.env.CLINIC_WHATSAPP_TO || "528182085411";
const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "hola@tudd.mx";

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

async function sendWhatsApp(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || !to) {
    return { skipped: true };
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

  return data;
}

async function sendEmail(booking) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from || !booking.email) {
    return { skipped: true };
  }

  const subject = "Solicitud de cita recibida en tüdd";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#2e2318;line-height:1.55">
      <h1 style="font-family:Georgia,serif;font-weight:400">Solicitud de cita recibida</h1>
      <p>Hola ${booking.name}, recibimos tu solicitud en tüdd.</p>
      <p><strong>Doctora:</strong> ${booking.doctor}<br>
      <strong>Especialidad:</strong> ${booking.role}<br>
      <strong>Dia:</strong> ${booking.date}<br>
      <strong>Hora:</strong> ${booking.time}</p>
      <p>Te contactaremos para confirmar disponibilidad final.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [booking.email],
      bcc: [CLINIC_EMAIL],
      subject,
      html
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo enviar correo");
  }

  return data;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { ok: false, error: "Metodo no permitido" });
  }

  try {
    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return sendJson(response, 503, {
        ok: false,
        error: "Faltan variables de entorno de WhatsApp en Vercel"
      });
    }

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

    const results = await Promise.allSettled([
      sendWhatsApp(patientPhone, patientMessage),
      sendWhatsApp(CLINIC_WHATSAPP, clinicMessage),
      sendEmail({ ...booking, phone: patientPhone })
    ]);

    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason.message);

    if (errors.length) {
      return sendJson(response, 502, { ok: false, error: errors.join(" | ") });
    }

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error.message || "Error inesperado" });
  }
};
