import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminLogin, getAdminDashboard, replyToCustomer, updateAdminStatus } from "./api";
import { Activity, Bell, Check, ChevronRight, ClipboardList, LogOut, Mail, MessageSquare, Package, RefreshCw, Search, Send, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import "./admin.css";

const STATUS_LABELS = {
  awaiting_payment_review: "مراجعة التحويل", pending: "جديد", processing: "قيد التنفيذ",
  awaiting_customer: "بانتظار العميل", ready: "جاهز للتسليم", shipped: "تم الشحن",
  completed: "مكتمل", cancelled: "ملغي",
};
const STATUS_OPTIONS = ["awaiting_payment_review", "pending", "processing", "awaiting_customer", "ready", "shipped", "completed", "cancelled"];

export default function AdminDashboard({ onExit }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("lapgpt_admin_token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState({ orders: [], requests: [], contacts: [] });
  const [section, setSection] = useState("orders");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [replyChannel, setReplyChannel] = useState("email");
  const [notifyVia, setNotifyVia] = useState("email");
  const [nextStatus, setNextStatus] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setBusy(true);
    try {
      const result = await getAdminDashboard();
      setData(result);
      setNotice("");
    } catch (error) {
      if (/401/.test(error.message)) {
        sessionStorage.removeItem("lapgpt_admin_token");
        setToken("");
      } else setNotice(error.message || "تعذر تحميل البيانات.");
    } finally { if (!quiet) setBusy(false); }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);
  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setInterval(() => refresh(true), 30000);
    return () => window.clearInterval(timer);
  }, [token, refresh]);

  const records = useMemo(() => {
    if (section === "orders") return data.orders.map((item) => ({ ...item, kind: "order", id: item.orderNumber, customerName: item.customerName, customerPhone: item.customerPhone, customerEmail: item.customerEmail, summary: (item.items || []).map((product) => `${product.name} × ${product.quantity}`).join("، ") }));
    if (section === "requests") return data.requests.map((item) => ({ ...item, kind: "request", customerName: item.customerName, customerPhone: item.customerPhone, customerEmail: item.customerEmail, summary: item.fields?.["وصف_المشكلة"] || item.fields?.problem_description || item.fields?.type || "طلب صيانة" }));
    return data.contacts.map((item) => ({ ...item, kind: "contact", customerName: item.fields?.name || "عميل", customerPhone: item.fields?.phone || "", customerEmail: item.fields?.email || "", summary: item.fields?.message || "استفسار" }));
  }, [data, section]);

  const filtered = useMemo(() => records.filter((record) => {
    const value = `${record.id} ${record.customerName} ${record.customerPhone} ${record.customerEmail} ${record.summary}`.toLowerCase();
    return value.includes(query.trim().toLowerCase());
  }), [records, query]);
  const selected = filtered.find((record) => record.id === selectedId) || records.find((record) => record.id === selectedId) || null;
  useEffect(() => { setSelectedId(""); setNextStatus(""); }, [section]);
  useEffect(() => { if (selected) setNextStatus(selected.status || "pending"); }, [selected?.id, selected?.status]);
  useEffect(() => {
    if (replyChannel === "email" && !selected?.customerEmail && selected?.customerPhone) setReplyChannel("sms");
    else if (replyChannel === "sms" && !selected?.customerPhone && selected?.customerEmail) setReplyChannel("email");
  }, [selected?.id, selected?.customerEmail, selected?.customerPhone, replyChannel]);

  const handleLogin = async (event) => {
    event.preventDefault(); setBusy(true); setLoginError("");
    try {
      const result = await adminLogin({ username, password });
      sessionStorage.setItem("lapgpt_admin_token", result.token);
      setToken(result.token);
      setPassword("");
    } catch (error) { setLoginError(error.message || "تعذر تسجيل الدخول."); }
    finally { setBusy(false); }
  };

  const updateStatus = async () => {
    if (!selected || !nextStatus) return;
    setBusy(true); setNotice("");
    try {
      const result = await updateAdminStatus({ kind: selected.kind, id: selected.id, status: nextStatus, notifyVia });
      if (result.notificationErrors?.length) setNotice(`تم تحديث الحالة، لكن تعذر إرسال الإشعار: ${result.notificationErrors.join("، ")}`);
      else setNotice("تم تحديث حالة الطلب.");
      await refresh(true);
    } catch (error) { setNotice(error.message || "تعذر تحديث الحالة."); }
    finally { setBusy(false); }
  };

  const sendReply = async (event) => {
    event.preventDefault(); if (!selected || !reply.trim()) return;
    setBusy(true); setNotice("");
    try {
      await replyToCustomer({ kind: selected.kind, id: selected.id, channel: replyChannel, message: reply, subject: `رد بخصوص ${selected.id} - LapGPT` });
      setReply(""); setNotice("تم إرسال الرد وتسجيله في المحادثة."); await refresh(true);
    } catch (error) { setNotice(error.message || "تعذر إرسال الرد."); }
    finally { setBusy(false); }
  };

  const logout = () => { sessionStorage.removeItem("lapgpt_admin_token"); setToken(""); setData({ orders: [], requests: [], contacts: [] }); };

  if (!token) return <main className="admin-login-page" dir="rtl">
    <form className="admin-login-card" onSubmit={handleLogin}>
      <div className="admin-mark"><ShieldCheck size={28}/></div>
      <span className="admin-kicker">LAPGPT CONTROL CENTER</span>
      <h1>دخول لوحة الإدارة</h1>
      <p>تابع الطلبات وتواصل مع العملاء من مكان واحد.</p>
      <label>اسم المستخدم<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required/></label>
      <label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label>
      {loginError && <div className="admin-alert error">{loginError}</div>}
      <button className="admin-primary" disabled={busy}>{busy ? "جارٍ الدخول..." : "دخول آمن"}<ChevronRight size={18}/></button>
      <button type="button" className="admin-back" onClick={onExit}>العودة للموقع</button>
    </form>
  </main>;

  const activeCount = [...data.orders, ...data.requests].filter((item) => !["completed", "cancelled"].includes(item.status)).length;
  return <main className="admin-shell" dir="rtl">
    <aside className="admin-sidebar">
      <button className="admin-brand" onClick={onExit}><span><Package size={21}/></span><b>LapGPT <small>ADMIN</small></b></button>
      <div className="admin-side-label">إدارة المتجر</div>
      <button className={`admin-nav-item ${section === "orders" ? "active" : ""}`} onClick={() => setSection("orders")}><Package size={18}/>طلبات المتجر <i>{data.orders.length}</i></button>
      <button className={`admin-nav-item ${section === "requests" ? "active" : ""}`} onClick={() => setSection("requests")}><Wrench size={18}/>طلبات الصيانة <i>{data.requests.length}</i></button>
      <button className={`admin-nav-item ${section === "contacts" ? "active" : ""}`} onClick={() => setSection("contacts")}><MessageSquare size={18}/>رسائل العملاء <i>{data.contacts.length}</i></button>
      <div className="admin-sidebar-bottom"><div className="admin-online"><span/>النظام متصل</div><button className="admin-nav-item" onClick={onExit}>عرض الموقع</button><button className="admin-nav-item admin-logout" onClick={logout}><LogOut size={17}/>تسجيل الخروج</button></div>
    </aside>

    <section className="admin-main">
      <header className="admin-topbar"><div><span className="admin-kicker">مساحة العمل / {section === "orders" ? "الطلبات" : section === "requests" ? "الصيانة" : "الرسائل"}</span><h1>{section === "orders" ? "طلبات المتجر" : section === "requests" ? "طلبات الصيانة" : "رسائل العملاء"}</h1></div><div className="admin-top-actions"><span className="admin-date">{new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</span><button className="admin-icon-button" onClick={() => refresh()} title="تحديث"><RefreshCw size={18}/></button><button className="admin-icon-button" onClick={logout} title="تسجيل الخروج"><LogOut size={18}/></button></div></header>
      <div className="admin-stat-grid">
        <article className="admin-stat"><span className="stat-icon blue"><ClipboardList size={20}/></span><small>إجمالي طلبات المتجر</small><strong>{data.orders.length}</strong><em>كل الطلبات المسجلة</em></article>
        <article className="admin-stat"><span className="stat-icon violet"><Wrench size={20}/></span><small>طلبات الصيانة</small><strong>{data.requests.length}</strong><em>طلبات الأجهزة والاستلام</em></article>
        <article className="admin-stat"><span className="stat-icon amber"><Activity size={20}/></span><small>طلبات قيد المتابعة</small><strong>{activeCount}</strong><em>بانتظار الإغلاق أو التسليم</em></article>
        <article className="admin-stat"><span className="stat-icon green"><Bell size={20}/></span><small>رسائل العملاء</small><strong>{data.contacts.length}</strong><em>استفسارات من نموذج التواصل</em></article>
      </div>

      <section className="admin-workspace">
        <div className="admin-list-panel">
          <div className="admin-list-head"><div><h2>الوارد</h2><span>{filtered.length} سجل</span></div><label className="admin-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو رقم الطلب"/></label></div>
          {notice && <div className="admin-alert">{notice}</div>}
          <div className="admin-record-list">
            {filtered.map((record) => <button className={`admin-record ${selectedId === record.id ? "selected" : ""}`} key={`${record.kind}-${record.id}`} onClick={() => setSelectedId(record.id)}>
              <span className="record-avatar">{record.kind === "order" ? <Package size={19}/> : record.kind === "request" ? <Wrench size={19}/> : <MessageSquare size={19}/>}</span>
              <span className="record-copy"><b>{record.customerName || "عميل"}</b><small>{record.id} · {record.summary}</small><small>{record.customerPhone || record.customerEmail || "لا توجد وسيلة تواصل"}</small></span>
              <span className={`status-pill status-${record.status || "new"}`}>{STATUS_LABELS[record.status] || "رسالة جديدة"}</span>
            </button>)}
            {!filtered.length && <div className="admin-empty"><Package size={28}/><b>لا توجد سجلات هنا</b><span>ستظهر الطلبات الجديدة في هذه القائمة.</span></div>}
          </div>
        </div>

        <div className="admin-detail-panel">
          {!selected ? <div className="admin-empty detail-empty"><MessageSquare size={34}/><b>اختر طلبًا لعرض تفاصيله</b><span>يمكنك تحديث الحالة أو إرسال رد للعميل.</span></div> : <>
            <div className="detail-title"><div><span className="admin-kicker">{selected.kind === "order" ? "طلب متجر" : selected.kind === "request" ? "طلب صيانة" : "رسالة واردة"}</span><h2>{selected.id}</h2></div><span className={`status-pill status-${selected.status || "new"}`}>{STATUS_LABELS[selected.status] || "جديد"}</span></div>
            <div className="customer-card"><b>{selected.customerName}</b><span><Smartphone size={15}/>{selected.customerPhone || "لا يوجد رقم"}</span><span><Mail size={15}/>{selected.customerEmail || "لا يوجد بريد مسجل"}</span><small>{selected.createdAt ? new Date(selected.createdAt).toLocaleString("ar-EG") : ""}</small></div>
            <div className="detail-info"><b>تفاصيل</b><p>{selected.summary || selected.fields?.message || "—"}</p>{selected.kind === "order" && <><p>قيمة الطلب: <b>{Number(selected.total || 0).toLocaleString("ar-EG")} ج.م</b></p><p>إثبات الشحن: <b>{selected.paymentReceipt ? "مرفق" : "غير موجود"}</b></p></>}{selected.kind === "request" && selected.hasReceipt && <p>إثبات الشحن: <b>مرفق</b></p>}{selected.kind === "contact" && selected.fields?.message !== selected.summary && <p>{selected.fields?.message}</p>}</div>
            {selected.kind !== "contact" && <div className="admin-status-box"><label>حالة الطلب<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label><label>إشعار العميل<select value={notifyVia} onChange={(event) => setNotifyVia(event.target.value)}><option value="email">البريد الإلكتروني</option><option value="sms">SMS</option><option value="both">البريد وSMS</option><option value="none">بدون إشعار</option></select></label><button className="admin-primary" disabled={busy || nextStatus === selected.status} onClick={updateStatus}>حفظ الحالة <Check size={17}/></button></div>}
            <div className="admin-conversation"><h3><MessageSquare size={17}/> الردود</h3>{(selected.replies || []).map((item, index) => <div className="reply-entry" key={`${item.createdAt}-${index}`}><b>{item.channel === "sms" ? "SMS مرسل" : "بريد مرسل"}</b><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("ar-EG")}</small></div>)}{!(selected.replies || []).length && <small className="muted">لا توجد ردود مسجلة بعد.</small>}
              <form className="admin-reply-form" onSubmit={sendReply}><label>قناة الرد<select value={replyChannel} onChange={(event) => setReplyChannel(event.target.value)}><option value="email" disabled={!selected.customerEmail}>البريد الإلكتروني</option><option value="sms" disabled={!selected.customerPhone}>SMS</option></select></label><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="اكتب ردك للعميل..." maxLength={2000} required/><button className="admin-primary" disabled={busy || !reply.trim()}><Send size={16}/>إرسال الرد</button></form>
            </div>
          </>}
        </div>
      </section>
    </section>
  </main>;
}
