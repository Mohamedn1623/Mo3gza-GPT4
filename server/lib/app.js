import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { sendNewRequest, sendContactMessage, sendCustomerMessage, sendStatusUpdate, sendOrderConfirmation, sendAdminOrderNotification } from "./emailService.js";
import { createOrder, getOrderById, getAllOrders, createServiceRequest, getServiceRequestById } from "./orderDatabase.js";

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

  app.post("/api/requests", async (req, res) => {
    try {
      const fields = req.body || {};
      const needsShippingReceipt = fields.type === "shipping" || (fields.delivery && fields.delivery !== "زيارة الفرع");
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
      await sendContactMessage({ fields: req.body || {} });
      res.json({ ok: true });
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

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "backend is running" });
  });

  app.post("/api/test-email", async (req, res) => {
    try {
      await sendContactMessage({ fields: { name: "Test User", phone: "0000000000", message: "This is a test email from the backend." } });
      res.json({ ok: true, message: "test email sent" });
    } catch (err) {
      console.error("Test email error", err);
      res.status(500).json({ ok: false, error: err.message || "test_email_failed" });
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
