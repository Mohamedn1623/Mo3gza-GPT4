import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

/* =========================
   ENV SAFETY
========================= */
function getEnv(name, required = true, fallback = "") {
  const value = process.env[name]?.trim();

  if (!value && required) {
    if (fallback) {
      return fallback;
    }
    throw new Error(`Missing ENV: ${name}`);
  }

  return value || fallback;
}

/* =========================
   TRANSPORTER
========================= */
function getTransporter() {
  const host = getEnv("SMTP_HOST", true, "smtp.gmail.com");
  const user = getEnv("SMTP_USER", false, process.env.EMAIL_FROM || "");
  const pass = getEnv("SMTP_PASSWORD", false, "");
  const port = Number(getEnv("SMTP_PORT", false, "587") || 587);

  if (!user || !pass) {
    throw new Error("Email configuration is incomplete. Set SMTP_USER and SMTP_PASSWORD in Vercel environment variables.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/* =========================
   SECURITY
========================= */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   TEMPLATE ENGINE (SAFE)
========================= */
async function renderTemplate(name, data = {}) {
  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);

  let template = "";

  try {
    template = await fs.readFile(filePath, "utf8");
  } catch {
    // بدل ما نكسر السيرفر
    return `<p>Email template missing: ${name}</p>`;
  }

  const merged = {
    APP_URL: process.env.APP_URL || "",
    ...data,
  };

  return template.replace(/{{([A-Z0-9_]+)}}/g, (_, key) => {
    return escapeHtml(merged[key] ?? "");
  });
}

/* =========================
   SEND MAIL CORE
========================= */
async function sendMail({ to, subject, html, attachments = [], replyTo }) {
  const recipient = getEnv("EMAIL_TO", false, process.env.SMTP_USER || "");
  const from = getEnv("EMAIL_FROM", false, process.env.SMTP_USER || "");

  const transporter = getTransporter();

  const mail = {
    from,
    to: to || recipient,
    subject,
    html,
    attachments,
  };

  if (replyTo) {
    mail.replyTo = replyTo;
  }

  return transporter.sendMail(mail);
}

/* =========================
   NEW REQUEST
========================= */
export async function sendNewRequest({ id, fields = {}, files = [], receipt }) {
  const displayFields = Object.fromEntries(Object.entries(fields).filter(([key]) => key !== "payment_receipt"));
  const fieldsHtml = Object.entries(displayFields)
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px;border:1px solid #ccc;font-weight:bold;">
          ${escapeHtml(k)}
        </td>
        <td style="padding:8px;border:1px solid #ccc;">
          ${escapeHtml(v)}
        </td>
      </tr>
    `
    )
    .join("");

  const html = await renderTemplate("newRequest", {
    REQUEST_ID: id,
    DATE: new Date().toLocaleString(),
    FIELDS_TABLE: fieldsHtml,
  });

  const attachments = files
    .filter((f) => f?.path)
    .map((f) => ({
      filename: f.originalname || f.filename || "file",
      path: f.path,
    }));
  const receiptAttachment = dataUrlAttachment(receipt);
  if (receiptAttachment) attachments.push(receiptAttachment);

  return sendMail({
    subject: `New Request #${id}`,
    html,
    attachments,
  });
}

/* =========================
   CONTACT
========================= */
export async function sendContactMessage({ fields = {} }) {
  const html = await renderTemplate("contactMessage", {
    DATE: new Date().toLocaleString(),
    ...fields,
  });

  return sendMail({
    subject: `Contact Form - ${fields.name || "User"}`,
    html,
    replyTo: fields.email,
  });
}

/* =========================
   CUSTOMER MESSAGE
========================= */
export async function sendCustomerMessage({
  message,
  customerName,
  requestId,
  date,
}) {
  const html = await renderTemplate("newMessage", {
    DATE: date || new Date().toLocaleString(),
    CUSTOMER: customerName,
    REQUEST_ID: requestId,
    MESSAGE: message,
  });

  return sendMail({
    subject: `Message - #${requestId}`,
    html,
  });
}

/* =========================
   STATUS UPDATE
========================= */
export async function sendStatusUpdate({
  requestId,
  previousStatus,
  newStatus,
  customerName,
  changedAt,
}) {
  const html = await renderTemplate("statusUpdate", {
    REQUEST_ID: requestId,
    PREV: previousStatus,
    NEW: newStatus,
    CUSTOMER: customerName,
    DATE: changedAt || new Date().toLocaleString(),
  });

  return sendMail({
    subject: `Status Updated - #${requestId}`,
    html,
  });
}

/* =========================
   ORDER CONFIRMATION (TO CUSTOMER)
========================= */
export async function sendOrderConfirmation({ order }) {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:center;">${escapeHtml(item.price)} ج.م</td>
        <td style="text-align:center;">${item.quantity * parseFloat(item.price)} ج.م</td>
      </tr>
    `
    )
    .join("");

  const html = await renderTemplate("orderConfirmation", {
    CUSTOMER_NAME: order.customerName,
    ORDER_NUMBER: order.orderNumber,
    ORDER_ITEMS: itemsHtml,
    ORDER_TOTAL: order.total,
    CUSTOMER_ADDRESS: order.shippingAddress || "Not provided",
    CUSTOMER_PHONE: order.customerPhone,
    CUSTOMER_EMAIL: order.customerEmail,
    PAYMENT_METHOD: order.paymentMethod || "Cash",
    EMAIL_TO: process.env.EMAIL_TO || "",
  });

  return sendMail({
    to: order.customerEmail,
    subject: `Order Confirmation #${order.orderNumber}`,
    html,
    attachments: dataUrlAttachment(order.paymentReceipt) ? [dataUrlAttachment(order.paymentReceipt)] : [],
    replyTo: order.customerEmail,
  });
}

/* =========================
   ORDER NOTIFICATION (TO ADMIN)
========================= */
export async function sendAdminOrderNotification({ order }) {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:center;">${escapeHtml(item.price)} EGP</td>
        <td style="text-align:center;">${item.quantity * parseFloat(item.price)} EGP</td>
      </tr>
    `
    )
    .join("");

  const html = await renderTemplate("adminOrderNotification", {
    CUSTOMER_NAME: order.customerName,
    CUSTOMER_EMAIL: order.customerEmail,
    CUSTOMER_PHONE: order.customerPhone,
    ORDER_NUMBER: order.orderNumber,
    ORDER_ITEMS: itemsHtml,
    ORDER_TOTAL: order.total,
    CUSTOMER_ADDRESS: order.shippingAddress || "Not provided",
    PAYMENT_METHOD: order.paymentMethod || "Cash",
    ORDER_DATE: new Date(order.createdAt).toLocaleString(),
    EMAIL_TO: process.env.EMAIL_TO || "",
  });

  const adminEmail = process.env.EMAIL_TO || process.env.SMTP_USER;

  return sendMail({
    to: adminEmail,
    subject: `🔔 New Order #${order.orderNumber}`,
    html,
    attachments: dataUrlAttachment(order.paymentReceipt) ? [dataUrlAttachment(order.paymentReceipt)] : [],
  });
}

function dataUrlAttachment(value) {
  const match = typeof value === "string" && value.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return null;
  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const contentType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
  return { filename: `shipping-payment-receipt.${extension}`, content: Buffer.from(match[2], "base64"), contentType };
}
