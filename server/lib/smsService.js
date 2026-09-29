export async function sendSms({ to, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
    throw new Error("إعداد Twilio ناقص. أضف بيانات Twilio إلى .env أولًا.");
  }

  const body = new URLSearchParams({ To: toE164(to), Body: String(message).slice(0, 1400) });
  if (messagingServiceSid) body.set("MessagingServiceSid", messagingServiceSid);
  else body.set("From", from);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `تعذر إرسال SMS (Twilio ${response.status}).`);
  return { sid: result.sid, status: result.status };
}

function toE164(value) {
  const digits = String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `+20${digits.slice(1)}`;
  if (/^201\d{9}$/.test(digits)) return `+${digits}`;
  throw new Error("اكتب رقم موبايل مصري صحيحًا مثل 01012345678.");
}
