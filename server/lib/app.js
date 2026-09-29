import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { sendNewRequest, sendContactMessage, sendCustomerMessage, sendStatusUpdate, sendOrderConfirmation, sendAdminOrderNotification, sendAdminCustomerEmail, isEmailConfigured } from "./emailService.js";
import { createOrder, getOrderById, getAllOrders, createServiceRequest, getServiceRequestById, getAllServiceRequests, getAllContactMessages, createContactRecord, updateOrderStatus, updateServiceRequestStatus, addAdminReply, checkStorageHealth } from "./orderDatabase.js";
import { adminCredentialsConfigured, createAdminToken, requireAdmin, verifyAdminPassword } from "./adminAuth.js";
import { sendSms } from "./smsService.js";

dotenv.config();

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 50,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  const adminLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false });

  app.post("/api/admin/login", adminLoginLimiter, (req, res) => {
    if (!adminCredentialsConfigured()) return res.status(503).json({ error: "إعداد ADMIN_USERNAME وADMIN_PASSWORD وADMIN_SESSION_SECRET في .env أولًا." });
    if (!verifyAdminPassword(req.body?.username, req.body?.password)) return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
    return res.json({ token: createAdminToken(req.body.username), expiresIn: 8 * 60 * 60 });
  });

  app.use("/api/admin", requireAdmin);

  app.get("/api/admin/dashboard", async (_req, res) => {
    try {
      const [orders, requests, contacts] = await Promise.all([getAllOrders(), getAllServiceRequests(), getAllContactMessages()]);
      res.json({
        orders: orders.map(({ paymentReceipt, ...order }) => ({ ...order, paymentReceipt: Boolean(paymentReceipt) })),
        requests: requests.map(({ fields = {}, ...request }) => {
          const { payment_receipt, ...safeFields } = fields;
          return { ...request, fields: safeFields, hasReceipt: Boolean(payment_receipt), customerName: fields.name || fields["الاسم"] || "—", customerPhone: fields.phone || fields["رقم_الهاتف"] || "—", customerEmail: fields.email || fields["البريد_الإلكتروني"] || "" };
        }),
        contacts: contacts.map(({ fields = {}, ...contact }) => ({ ...contact, fields })),
      });
    } catch (err) {
      console.error("Admin dashboard error", err);
      res.status(500).json({ error: "تعذر تحميل بيانات لوحة الإدارة." });
    }
  });

  app.post("/api/admin/status", async (req, res) => {
    const { kind, id, status, notifyVia = "none" } = req.body || {};
    const allowedStatuses = ["awaiting_payment_review", "pending", "processing", "awaiting_customer", "ready", "shipped", "completed", "cancelled"];
    if (!["order", "request"].includes(kind) || !id || !allowedStatuses.includes(status) || !["none", "email", "sms", "both"].includes(notifyVia)) {
      return res.status(400).json({ error: "بيانات تحديث الحالة غير صحيحة." });
    }
    try {
      const updated = kind === "order" ? await updateOrderStatus(id, status) : await updateServiceRequestStatus(id, status);
      const customer = getCustomerContact(kind, updated);
      const message = `تم تحديث حالة طلبك ${id} إلى: ${statusLabel(status)}.`;
      const notifications = [];
      if (notifyVia === "email" || notifyVia === "both") notifications.push(sendAdminCustomerEmail({ to: customer.email, customerName: customer.name, subject: `تحديث حالة الطلب ${id} - LapGPT`, message }));
      if (notifyVia === "sms" || notifyVia === "both") notifications.push(sendSms({ to: customer.phone, message: `LapGPT: ${message}` }));
      const results = await Promise.allSettled(notifications);
      const failures = results.filter((result) => result.status === "rejected").map((result) => result.reason.message);
      res.json({ ok: true, order: { id, status: updated.status }, notificationErrors: failures });
    } catch (err) {
      console.error("Admin status update error", err);
      res.status(500).json({ error: err.message || "تعذر تحديث حالة الطلب." });
    }
  });

  app.post("/api/admin/reply", async (req, res) => {
    const { kind, id, channel, message, subject } = req.body || {};
    if (!["order", "request", "contact"].includes(kind) || !id || !["email", "sms"].includes(channel) || typeof message !== "string" || !message.trim() || message.length > 2000) {
      return res.status(400).json({ error: "اكتب ردًا واختر قناة إرسال صحيحة." });
    }
    try {
      const record = await getAdminRecord(kind, id);
      if (!record) return res.status(404).json({ error: "لم يتم العثور على السجل." });
      const customer = getCustomerContact(kind, record);
      if (channel === "email") await sendAdminCustomerEmail({ to: customer.email, customerName: customer.name, subject, message: message.trim() });
      else await sendSms({ to: customer.phone, message: `LapGPT: ${message.trim()}` });
      await addAdminReply(kind, id, { channel, message: message.trim(), admin: req.admin.username });
      res.json({ ok: true });
    } catch (err) {
      console.error("Admin customer reply error", err);
      res.status(400).json({ error: err.message || "تعذر إرسال الرد." });
    }
  });

  app.post("/api/admin/test-email", async (_req, res) => {
    try {
      await sendContactMessage({ fields: { name: "LapGPT", message: "رسالة اختبار: إعداد إرسال البريد يعمل من لوحة الإدارة." } });
      res.json({ ok: true });
    } catch (err) {
      console.error("Admin email test failed", err);
      res.status(400).json({ error: err.message || "تعذر إرسال رسالة الاختبار." });
    }
  });
  app.post("/api/requests", async (req, res) => {
    try {
      const fields = req.body || {};
      const delivery = String(fields.delivery || "").trim().toLowerCase();
      const needsShippingReceipt = fields.type === "shipping" || /شحن|منزل|منزلي|home|shipping/.test(delivery);
      if (needsShippingReceipt && !isValidReceipt(fields.payment_receipt)) {
        return res.status(400).json({ ok: false, error: "A valid shipping payment receipt image is required" });
      }
      const { requestId: _clientRequestId, ...requestFields } = fields;
      const request = await createServiceRequest(requestFields);
      try {
        await sendNewRequest({ id: request.id, fields: requestFields, receipt: requestFields.payment_receipt });
      } catch (emailErr) {
        console.error("Request notification failed", request.id, emailErr);
      }
      res.status(201).json({ ok: true, id: request.id });
    } catch (err) {
      console.error("Request submission error", err);
      res.status(500).json({ ok: false, error: err.message || "server_error" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const fields = req.body || {};
      const contact = await createContactRecord(fields);
      try { await sendContactMessage({ fields }); }
      catch (emailErr) { console.error("Contact notification failed", contact.id, emailErr); }
      res.status(201).json({ ok: true, id: contact.id });
    } catch (err) {
      console.error("Contact submission error", err);
      res.status(500).json({ ok: false, error: err.message || "server_error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { message, customerName, requestId, date } = req.body || {};
      await sendCustomerMessage({ message, customerName, requestId, date });
      res.json({ ok: true });
    } catch (err) {
      console.error("Customer message error", err);
      res.status(500).json({ ok: false, error: err.message || "server_error" });
    }
  });

  app.post("/api/status", async (req, res) => {
    try {
      const { requestId, previousStatus, newStatus, customerName, changedAt } = req.body || {};
      await sendStatusUpdate({ requestId, previousStatus, newStatus, customerName, changedAt });
      res.json({ ok: true });
    } catch (err) {
      console.error("Status update error", err);
      res.status(500).json({ ok: false, error: err.message || "server_error" });
    }
  });

  // ========== ORDER ENDPOINT ==========
  app.post("/api/orders", async (req, res) => {
    try {
      const { items, total, payment_method, customerName, customerEmail, customerPhone, shippingAddress, deliveryType, payment_receipt } = req.body || {};

      if (!isValidReceipt(payment_receipt)) {
        return res.status(400).json({ ok: false, error: "A valid shipping payment receipt image is required" });
      }

      // Validation
      if (!customerName || !customerEmail) {
        return res.status(400).json({ 
          ok: false, 
          error: "customerName and customerEmail are required" 
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          ok: false, 
          error: "items must be a non-empty array" 
        });
      }

      // Create order in database FIRST
      const order = await createOrder({
        items,
        total,
        payment_method,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        deliveryType,
        payment_receipt,
      });

      console.log("✅ Order created:", order.orderNumber);

      // Send emails (non-blocking - don't fail order if email fails)
      try {
        await Promise.all([
          sendOrderConfirmation({ order }),
          sendAdminOrderNotification({ order }),
        ]);
        console.log("✅ Emails sent for order:", order.orderNumber);
      } catch (emailErr) {
        console.error("⚠️ Email sending failed for order", order.orderNumber, emailErr);
        // Email failure doesn't fail the order creation
      }

      // Return success with order details
      res.status(201).json({
        ok: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
        },
      });
    } catch (err) {
      console.error("Order creation error", err);
      res.status(500).json({ 
        ok: false, 
        error: err.message || "server_error" 
      });
    }
  });

  // Get order details
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await getOrderById(orderId);

      if (!order || !samePhone(order.customerPhone, req.query.phone)) {
        return res.status(404).json({ ok: false, error: "Order not found" });
      }

      const { paymentReceipt, customerEmail, ...publicOrder } = order;
      res.json({ ok: true, order: { ...publicOrder, paymentReceipt: Boolean(paymentReceipt) } });
    } catch (err) {
      console.error("Get order error", err);
      res.status(500).json({ ok: false, error: err.message || "server_error" });
    }
  });

  app.get("/api/requests/:requestId", async (req, res) => {
    try {
      const request = await getServiceRequestById(req.params.requestId);
      const fields = request?.fields || {};
      const storedPhone = fields["رقم_الهاتف"] || fields.phone || "";
      if (!request || !samePhone(storedPhone, req.query.phone)) {
        return res.status(404).json({ ok: false, error: "Request not found" });
      }
      res.json({ ok: true, request: { id: request.id, status: request.status, createdAt: request.createdAt, delivery: fields.delivery || "", name: fields.name || fields["الاسم"] || "" } });
    } catch (err) {
      console.error("Get service request error", err);
      res.status(500).json({ ok: false, error: err.message || "server_error" });
    }
  });

  // ========== END ORDER ENDPOINT ==========

  app.get("/api/health", async (req, res) => {
    try {
      const storage = await checkStorageHealth();
      const admin = adminCredentialsConfigured();
      const email = isEmailConfigured();
      const checks = { storage: storage.storage, email, admin };
      const ready = storage.ok && email && admin;
      if (!ready) return res.status(503).json({ ok: false, checks, error: "راجع متغيرات Supabase وSMTP وبيانات دخول الإدارة في إعدادات Vercel." });
      res.json({ ok: true, checks, message: "backend, storage, email, and admin are ready" });
    } catch (error) {
      console.error("Storage health check failed", error);
      res.status(503).json({ ok: false, storage: "unavailable", error: "تعذر الاتصال بقاعدة بيانات Supabase." });
    }
  });

  return app;
}

function isValidReceipt(value) {
  if (typeof value !== "string" || value.length > 7_000_000) return false;
  const match = value.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return false;
  const image = Buffer.from(match[2], "base64");
  if (!image.length || image.length > 5 * 1024 * 1024) return false;
  const type = match[1].toLowerCase();
  if (type === "png") return image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "jpeg" || type === "jpg") return image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
  return image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP";
}

function samePhone(saved, supplied) {
  const normalize = (value) => String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/\D/g, "");
  const expected = normalize(saved);
  const actual = normalize(supplied);
  return expected.length >= 7 && actual.length >= 7 && expected === actual;
}

export default createApp;

async function getAdminRecord(kind, id) {
  if (kind === "order") return getOrderById(id);
  if (kind === "request") return getServiceRequestById(id);
  const contacts = await getAllContactMessages();
  return contacts.find((contact) => contact.id === id);
}

function getCustomerContact(kind, record) {
  if (kind === "order") return { name: record.customerName, email: record.customerEmail, phone: record.customerPhone };
  const fields = kind === "request" ? record.fields || {} : record.fields || {};
  return {
    name: fields.name || fields["الاسم"] || "عميل LapGPT",
    email: fields.email || fields["البريد_الإلكتروني"] || "",
    phone: fields.phone || fields["رقم_الهاتف"] || "",
  };
}

function statusLabel(status) {
  return ({ awaiting_payment_review: "مراجعة إثبات التحويل", pending: "جديد", processing: "قيد التنفيذ", awaiting_customer: "بانتظار العميل", ready: "جاهز للتسليم", shipped: "تم الشحن", completed: "مكتمل", cancelled: "ملغي" })[status] || status;
}
