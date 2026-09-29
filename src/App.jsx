import React, { useMemo, useState, useRef, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";
import { createRequest, createOrder, getOrder, getServiceRequest, sendContact, sendMessage, sendStatus } from "./api";
import {
  BatteryCharging,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Clock3,
  Cpu,
  Headphones,
  Laptop,
  HardDrive,
  MemoryStick,
  Cable,
  Fan,
  Keyboard,
  Mouse,
  Webcam,
  Monitor,
  Wifi,
  Usb,
  BriefcaseBusiness,
  Gamepad2,
  Router,
  Plug,
  SprayCan,
  Wrench,
  Mic,
  PanelTop,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";

const services = [
  { id: 1, title: "تغيير شاشة اللابتوب", description: "شاشات أصلية ومتوافقة بجودة مضمونة.", price: 1200, icon: Monitor },
  { id: 2, title: "تغيير البطارية", description: "بطارية آمنة ومتوافقة مع موديل جهازك.", price: 850, icon: BatteryCharging },
  { id: 3, title: "ترقية RAM و SSD", description: "أداء أسرع ومساحة أكبر لجهازك.", price: 650, icon: Cpu },
  { id: 4, title: "إصلاح الكيبورد", description: "إصلاح أو استبدال لوحة المفاتيح.", price: 550, icon: Laptop },
  { id: 5, title: "تنظيف وتبريد", description: "تنظيف داخلي وتغيير المعجون الحراري.", price: 350, icon: Wrench },
  { id: 6, title: "سوفت وير وفيروسات", description: "تثبيت نظام وتعريفات وإزالة فيروسات.", price: 250, icon: ShieldCheck },
];

const products = [
{ id: 1, name: "شاحن USB-C أصلي 65W", category: "شواحن", price: 1450, oldPrice: 1750, rating: 4.8, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" },
  // ... keep original product list shortened for brevity in this file, unchanged in functionality
{ id: 2, name: "SSD NVMe سعة 512GB", category: "SSD", price: 2900, oldPrice: 3500, rating: 4.7, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" },
{ id: 3, name: "رام DDR4 سعة 16GB", category: "رامات", price: 1200, oldPrice: 1500, rating: 4.6, image: "https://images.unsplash.com/photo-1612832021061-5f8c9e2b1f7c?w=800" },
{ id: 4, name: "مروحة تبريد للابتوب", category: "تبريد", price: 350, oldPrice: 450, rating: 4.5, image: "https://images.unsplash.com/photo-1612832021061-5f8c9e2b1f7c?w=800" },
{ id: 5, name: "كيبورد ميكانيكي RGB", category: "إكسسوارات", price: 1250, oldPrice: 1500, rating: 4.7, image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800" },
{ id: 6, name: "ماوس Gaming RGB", category: "إكسسوارات", price: 999, oldPrice: 1200, rating: 4.6, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800" },
{ id: 7, name: "سماعة Gaming احترافية", category: "صوتيات", price: 500, oldPrice: 650, rating: 4.8, image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=800" },
{ id: 8, name: "Webcam HD", category: "كاميرات", price: 850, oldPrice: 1050, rating: 4.5, image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800" },
{ id: 9, name: "SSD 1TB", category: "تخزين", price: 3900, oldPrice: 4500, rating: 4.9, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" },
{ id: 10, name: "RAM DDR4 16GB", category: "قطع كمبيوتر", price: 1800, oldPrice: 2100, rating: 4.8, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800" },
{ id: 11, name: "شاحن لابتوب Universal", category: "شواحن", price: 750, oldPrice: 900, rating: 4.4, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" },
{ id: 12, name: "USB Hub متعدد المنافذ", category: "إكسسوارات", price: 550, oldPrice: 700, rating: 4.5, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" },
{ id: 13, name: "حامل لابتوب معدني", category: "إكسسوارات", price: 600, oldPrice: 750, rating: 4.6, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800" },
{ id: 14, name: "كيبورد لاسلكي", category: "إكسسوارات", price: 600, oldPrice: 750, rating: 4.5, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800" },
{ id: 15, name: "ماوس لاسلكي", category: "إكسسوارات", price: 250, oldPrice: 350, rating: 4.4, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800" },
{ id: 16, name: "كابل USB-C سريع", category: "كابلات", price: 250, oldPrice: 350, rating: 4.7, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800" },
{ id: 17, name: "Power Bank 20000mAh", category: "شحن", price: 1100, oldPrice: 1350, rating: 4.7, image: "https://images.unsplash.com/photo-1609592424814-8c0c4b5d5d3c?w=800" },
{ id: 18, name: "شاحن سريع USB-C", category: "شواحن", price: 500, oldPrice: 650, rating: 4.6, image: "https://images.unsplash.com/photo-1591290619762-c588c8a3f9b1?w=800" },
{ id: 19, name: "هارد خارجي 2TB", category: "تخزين", price: 2900, oldPrice: 3300, rating: 4.8, image: "https://images.unsplash.com/photo-1531492746076-161ca9b7b5c7?w=800" },
{ id: 20, name: "مروحة تبريد RGB للكمبيوتر", category: "تبريد", price: 450, oldPrice: 550, rating: 4.6, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800" },
{ id: 21, name: "معجون حراري للمعالج", category: "تبريد", price: 300, oldPrice: 400, rating: 4.8, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800" },
{ id: 22, name: "Laptop Stand RGB", category: "إكسسوارات", price: 850, oldPrice: 1000, rating: 4.6, image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800" },
{ id: 23, name: "شاشة 24 بوصة Full HD", category: "شاشات", price: 5200, oldPrice: 5800, rating: 4.8, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800" },
{ id: 24, name: "كارت Wi-Fi USB", category: "شبكات", price: 400, oldPrice: 500, rating: 4.3, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800" },
{ id: 25, name: "شاحن MacBook USB-C", category: "شواحن", price: 1200, oldPrice: 1450, rating: 4.8, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" },
{ id: 26, name: "كيبورد ميكانيكي أبيض RGB", category: "إكسسوارات", price: 1450, oldPrice: 1700, rating: 4.8, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800" },
{ id: 27, name: "ماوس Gaming احترافي", category: "Gaming", price: 900, oldPrice: 1100, rating: 4.9, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800" },
{ id: 28, name: "سماعة Bluetooth", category: "صوتيات", price: 1100, oldPrice: 1350, rating: 4.7, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
{ id: 29, name: "ميكروفون USB", category: "صوتيات", price: 1600, oldPrice: 1900, rating: 4.8, image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800" },
{ id: 30, name: "SSD NVMe 512GB", category: "تخزين", price: 2600, oldPrice: 3000, rating: 4.8, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" },
{ id: 31, name: "SSD NVMe 2TB", category: "تخزين", price: 5200, oldPrice: 5900, rating: 4.9, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" },
{ id: 32, name: "RAM DDR5 16GB", category: "قطع كمبيوتر", price: 2300, oldPrice: 2700, rating: 4.9, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800" },
{ id: 33, name: "RAM DDR5 32GB", category: "قطع كمبيوتر", price: 3900, oldPrice: 4500, rating: 4.9, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800" },
{ id: 34, name: "مروحة RGB للكمبيوتر", category: "تبريد", price: 350, oldPrice: 450, rating: 4.6, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800" },
{ id: 35, name: "Cooler للمعالج", category: "تبريد", price: 950, oldPrice: 1150, rating: 4.7, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800" },
{ id: 36, name: "كابل HDMI 2.1", category: "كابلات", price: 300, oldPrice: 400, rating: 4.6, image: "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800" },
{ id: 37, name: "كابل DisplayPort", category: "كابلات", price: 350, oldPrice: 450, rating: 4.5, image: "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800" },
{ id: 38, name: "USB Flash Drive 128GB", category: "تخزين", price: 450, oldPrice: 550, rating: 4.6, image: "https://images.unsplash.com/photo-1610465299996-5c9b8c4e7e0e?w=800" },
{ id: 39, name: "قارئ كروت USB", category: "إكسسوارات", price: 250, oldPrice: 350, rating: 4.4, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" },
{ id: 40, name: "حقيبة لابتوب 15.6 بوصة", category: "إكسسوارات", price: 700, oldPrice: 900, rating: 4.7, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800" },
{ id: 41, name: "شاشة Gaming 27 بوصة", category: "شاشات", price: 7200, oldPrice: 8200, rating: 4.9, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800" },
{ id: 42, name: "كيبورد رقمي NumPad", category: "إكسسوارات", price: 500, oldPrice: 650, rating: 4.4, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800" },
{ id: 43, name: "Gamepad لاسلكي", category: "Gaming", price: 1200, oldPrice: 1450, rating: 4.7, image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800" },
{ id: 44, name: "Mouse Pad XXL RGB", category: "Gaming", price: 650, oldPrice: 800, rating: 4.8, image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800" },
{ id: 45, name: "راوتر Wi-Fi 6", category: "شبكات", price: 2200, oldPrice: 2600, rating: 4.8, image: "https://images.unsplash.com/photo-1606904825846-647eb07b5be3?w=800" },
{ id: 46, name: "USB Wi-Fi Adapter", category: "شبكات", price: 450, oldPrice: 600, rating: 4.5, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800" },
{ id: 47, name: "Power Strip USB", category: "كهرباء", price: 750, oldPrice: 950, rating: 4.6, image: "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800" },
{ id: 48, name: "منظف شاشات وأجهزة", category: "صيانة", price: 200, oldPrice: 300, rating: 4.5, image: "https://images.unsplash.com/photo-1585079542156-2755d9c8a094?w=800" },
{ id: 49, name: "عدة صيانة إلكترونيات", category: "صيانة", price: 950, oldPrice: 1200, rating: 4.8, image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800" },
{ id: 50, name: "مفك كهربائي دقيق", category: "صيانة", price: 800, oldPrice: 1000, rating: 4.7, image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800" }
,{ id: 51, name: "طقم كيبورد وماوس لاسلكي عربي", category: "إكسسوارات", price: 650, oldPrice: 800, rating: 4.6, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800" }
,{ id: 52, name: "ماوس سلكي للاستخدام اليومي", category: "إكسسوارات", price: 250, oldPrice: 320, rating: 4.5, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800" }
,{ id: 53, name: "ماوس ألعاب RGB", category: "Gaming", price: 999, oldPrice: 1200, rating: 4.8, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800" }
,{ id: 54, name: "سماعة ألعاب سلكية بميكروفون", category: "صوتيات", price: 700, oldPrice: 850, rating: 4.6, image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=800" }
,{ id: 55, name: "حامل لابتوب قابل للطي", category: "إكسسوارات", price: 450, oldPrice: 600, rating: 4.6, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800" }
,{ id: 56, name: "ماوس باد كبير للألعاب", category: "Gaming", price: 320, oldPrice: 420, rating: 4.5, image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800" }
,{ id: 57, name: "وصلة USB-C إلى HDMI", category: "كابلات", price: 550, oldPrice: 700, rating: 4.5, image: "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800" }
,{ id: 58, name: "وصلة USB-C متعددة المنافذ", category: "إكسسوارات", price: 850, oldPrice: 1050, rating: 4.6, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" }
,{ id: 59, name: "فلاشة USB 64GB", category: "تخزين", price: 250, oldPrice: 330, rating: 4.5, image: "https://images.unsplash.com/photo-1610465299996-5c9b8c4e7e0e?w=800" }
,{ id: 60, name: "فلاشة USB 256GB", category: "تخزين", price: 650, oldPrice: 800, rating: 4.6, image: "https://images.unsplash.com/photo-1610465299996-5c9b8c4e7e0e?w=800" }
,{ id: 61, name: "SSD SATA 480GB", category: "SSD", price: 2200, oldPrice: 2600, rating: 4.7, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" }
,{ id: 62, name: "SSD NVMe 1TB", category: "SSD", price: 3900, oldPrice: 4500, rating: 4.8, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" }
,{ id: 63, name: "رام لابتوب DDR4 سعة 8GB", category: "رامات", price: 850, oldPrice: 1050, rating: 4.6, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800" }
,{ id: 64, name: "رام لابتوب DDR5 سعة 16GB", category: "رامات", price: 2600, oldPrice: 3000, rating: 4.8, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800" }
,{ id: 65, name: "شاحن USB-C PD 45W", category: "شواحن", price: 750, oldPrice: 950, rating: 4.6, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" }
,{ id: 66, name: "شاحن USB-C PD 100W", category: "شواحن", price: 2200, oldPrice: 2600, rating: 4.8, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800" }
,{ id: 67, name: "كابل USB-C بطول مترين", category: "كابلات", price: 250, oldPrice: 320, rating: 4.6, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800" }
,{ id: 68, name: "مروحة تبريد USB للابتوب", category: "تبريد", price: 500, oldPrice: 650, rating: 4.5, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800" }
,{ id: 69, name: "منظف شاشة مع قطعة مايكروفايبر", category: "صيانة", price: 180, oldPrice: 250, rating: 4.5, image: "https://images.unsplash.com/photo-1585079542156-2755d9c8a094?w=800" }
,{ id: 70, name: "حقيبة لابتوب مبطنة 15.6 بوصة", category: "إكسسوارات", price: 850, oldPrice: 1050, rating: 4.7, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800" }
];

const steps = ["تم استلام الطلب", "الجهاز في الطريق للفرع", "جاري الفحص", "بانتظار الموافقة", "جاري الإصلاح", "جاهز للتسليم"];
const paymentLogos = {
  instapay: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/INSTA-PAY_logo.png/240px-INSTA-PAY_logo.png",
  vodafone: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Vodafone_2017_logo.svg/240px-Vodafone_2017_logo.svg.png",
};
const money = (value) => `${value.toLocaleString("ar-EG")} ج.م`;
const receiptAsDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file || !file.type.startsWith("image/")) return reject(new Error("receipt_image_required"));
  if (file.size > 5 * 1024 * 1024) return reject(new Error("receipt_image_too_large"));
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("receipt_image_read_failed"));
  reader.readAsDataURL(file);
});

export default function App() {
  const [page, setPage] = useState(() => window.location.pathname === "/admin" ? "admin" : "home");
  const [menu, setMenu] = useState(false);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [notice, setNotice] = useState("");
  const [booking, setBooking] = useState({ step: 1, done: false, id: "" });
  const [tracking, setTracking] = useState(false);

  const navigate = (target) => {
    setPage(target); setMenu(false);
    const nextPath = target === "admin" ? "/admin" : "/";
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const onPopState = () => setPage(window.location.pathname === "/admin" ? "admin" : "home");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const add = (product) => { setCart(old => { const found = old.find(x => x.id === product.id); return found ? old.map(x => x.id === product.id ? { ...x, quantity: x.quantity + 1 } : x) : [...old, { ...product, quantity: 1 }]; }); setNotice("تمت إضافة المنتج إلى السلة"); };
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => products.filter(p => (category === "الكل" || p.category === category) && p.name.toLowerCase().includes(normalizedQuery)), [normalizedQuery, category]);
  const count = cart.reduce((sum, x) => sum + x.quantity, 0);
  const total = cart.reduce((sum, x) => sum + x.price * x.quantity, 0);

  if (page === "admin") return <AdminDashboard onExit={() => navigate("home")} />;

  return (
    <div dir="rtl">
      <Header page={page} navigate={navigate} count={count} menu={menu} setMenu={setMenu} />
      {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}<button onClick={() => setNotice("")}><X size={17}/></button></div>}
      <main>
        {page === "home" && <Home navigate={navigate} onBook={() => navigate("booking")} add={add} />}
        {page === "services" && <Services onBook={() => navigate("booking")} />}
        {page === "booking" && <Booking data={booking} setData={setBooking} navigate={navigate} />}
        {page === "shipping" && <Shipping notify={setNotice} />}
        {page === "store" && <Store items={filtered} add={add} query={query} setQuery={setQuery} category={category} setCategory={setCategory} />}
        {page === "track" && <Track show={tracking} setShow={setTracking} />}
        {page === "cart" && <Cart cart={cart} total={total} update={(id, quantity) => setCart(old => quantity < 1 ? old.filter(x => x.id !== id) : old.map(x => x.id === id ? { ...x, quantity } : x))} navigate={navigate} notify={setNotice} />}
        {page === "contact" && <Contact notify={setNotice} />}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

function Header({ page, navigate, count, menu, setMenu }) {
  const links = [["home","الرئيسية"],["services","خدمات الصيانة"],["booking","احجز صيانة"],["shipping","طلب شحن"],["store","المتجر"],["track","تتبع الطلب"],["contact","تواصل معنا"]];
  return (
    <header>
      <div className="container nav">
        <button className="brand" onClick={() => navigate("home")}><Laptop/><span>Lap<b>GPT</b></span></button>
        <nav className={menu ? "open" : ""}>{links.map(([id, text]) => <button className={page === id ? "active" : ""} key={id} onClick={() => navigate(id)}>{text}</button>)}</nav>
        <div className="nav-actions">
          <button className="admin-entry" onClick={() => navigate("admin")}><ShieldCheck size={16}/> لوحة الإدارة</button>
          <button className="icon" aria-label="السلة" onClick={() => navigate("cart")}><ShoppingCart/>{count > 0 && <i>{count}</i>}</button>
          <button className="icon menu" aria-label="القائمة" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
        </div>
      </div>
    </header>
  );
}

function Home({ navigate, onBook, add }) {
  return (
    <>
      <section className="hero"><div className="container hero-grid"><div><span className="eyebrow"><Zap size={16}/> خبرة تثق بها منذ أكثر من 10 سنوات</span><h1>صيانة لابتوبك <em>أسهل وأسرع</em></h1><p>احجز صيانة، اطلب استلام جهازك من المنزل، أو تسوّق قطع الغيار والإكسسوارات في مكان واحد.</p><div className="actions"><button className="primary" onClick={onBook}>احجز صيانة الآن <ChevronLeft/></button><button className="outline" onClick={() => navigate("shipping")}>اطلب شحن جهازك <Truck/></button><button className="admin-home-link" onClick={() => navigate("admin")}><ShieldCheck size={17}/> دخول الإدارة ومتابعة الطلبات</button></div><div className="trust"><span><CheckCircle2/> ضمان على الصيانة</span><span><CheckCircle2/> قطع غيار مضمونة</span></div></div><div className="laptop-art"><Laptop size={160}/><b><ShieldCheck/> ضمان موثوق</b><b><Clock3/> خدمة سريعة</b></div></div></section>
      <Features />
      <section className="section container"><Title eyebrow="خدماتنا" title="كل ما يحتاجه جهازك في مكان واحد" text="فريق متخصص وقطع غيار عالية الجودة لضمان أفضل أداء."/><div className="grid services">{services.slice(0,3).map(s => <ServiceCard key={s.id} service={s} onBook={onBook}/>)}</div><div className="center"><button className="secondary" onClick={() => navigate("services")}>عرض جميع الخدمات <ChevronLeft/></button></div></section>
    </>
  );
}

function Features() { const data=[[Wrench,"فنيون متخصصون"],[ShieldCheck,"قطع غيار مضمونة"],[Truck,"استلام وتسليم"],[Clock3,"خدمة سريعة"]]; return <section className="features"><div className="container grid four">{data.map(([Icon,text]) => <div key={text}><Icon/><span><b>{text}</b><small>خدمة موثوقة وآمنة</small></span></div>)}</div></section>; }

function Services({ onBook }) { return <Page title="خدمات صيانة احترافية" text="حلول متكاملة لصيانة وترقية أجهزة اللابتوب والكمبيوتر."><div className="grid services">{services.map(s => <ServiceCard key={s.id} service={s} onBook={onBook}/>)}</div><div className="warranty"><ShieldCheck size={38}/><div><b>ضمان حقيقي على خدمات الصيانة</b><p>ضمان يبدأ من 90 يومًا ويصل إلى سنة حسب نوع الخدمة والقطعة المستخدمة.</p></div></div></Page>; }

function ServiceCard({ service, onBook }) { const Icon = service.icon; return <article className="card service"><div className="service-icon"><Icon/></div><h3>{service.title}</h3><p>{service.description}</p><footer><span>يبدأ من <b>{money(service.price)}</b></span><button onClick={onBook}>احجز الخدمة <ChevronLeft size={16}/></button></footer></article>; }

function Booking({ data, setData, navigate }) {
  const [step, setStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('زيارة الفرع');
  const [paymentMethod, setPaymentMethod] = useState('instapay');
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [formData, setFormData] = useState({});
  const formRef = useRef(null);
  const needsShippingReceipt = deliveryType !== 'زيارة الفرع';
  const handleReceipt = (e) => setReceipt(e.target.files?.[0] || null);
  const collectCurrentStep = () => {
    const values = {};
    formRef.current?.querySelectorAll('input, textarea, select').forEach((input) => {
      if (!input.name || input.type === 'file' || ((input.type === 'radio' || input.type === 'checkbox') && !input.checked)) return;
      values[input.name] = input.value;
    });
    return values;
  };
  const goToNextStep = () => {
    const invalid = [...(formRef.current?.querySelectorAll('input[required], textarea[required], select[required]') || [])].find((input) => !input.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    setFormData((current) => ({ ...current, ...collectCurrentStep() }));
    setFeedback('');
    setStep((current) => current + 1);
  };

  const finish = async () => {
    try {
      if (needsShippingReceipt && !receipt) {
        setFeedback('لا يمكن إرسال طلب الشحن أو الاستلام من المنزل قبل رفع صورة تحويل رسوم الشحن.');
        return;
      }
      setSubmitting(true);
      setFeedback('جارٍ إرسال طلب الصيانة...');
      const payload = { ...formData, ...collectCurrentStep(), delivery: deliveryType };
      if (needsShippingReceipt) payload.payment_method = paymentMethod;
      if (receipt) payload.payment_receipt = await receiptAsDataUrl(receipt);
      const res = await createRequest(payload);
      const rid = res?.id || '';
      setData({ step: 4, done: true, id: rid });
      setFeedback('');
    } catch (err) {
      console.error(err);
      const message = String(err?.message || '');
      if (/receipt|إيصال|تحويل/i.test(message)) setFeedback('لا يمكن إرسال طلب الاستلام أو الشحن قبل رفع صورة تحويل رسوم الشحن.');
      else if (/failed to fetch|network|fetch/i.test(message)) setFeedback('تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.');
      else setFeedback(message || 'تعذر إرسال الطلب الآن. جرّب مرة أخرى أو تواصل معنا مباشرة.');
    } finally {
      setSubmitting(false);
    }
  };

  if (data.done) return (<Page title="تم استلام طلبك بنجاح"><div className="success"><CheckCircle2/><h2>شكرًا لك، تم تسجيل طلب الصيانة</h2><p>رقم طلبك هو</p><strong>{data.id}</strong><p>احتفظ بالرقم لمتابعة حالة جهازك.</p><button className="primary" onClick={() => navigate("track")}>متابعة الطلب</button></div></Page>);

  return (
    <Page title="احجز صيانة جهازك" text="املأ البيانات وسنتواصل معك لتأكيد الموعد.">
      <div id="booking-card" className="form-card" ref={formRef}>
        <div className="steps">{["بيانات العميل","بيانات الجهاز","طريقة التسليم","التأكيد"].map((x,i) => <div className={step >= i+1 ? "current" : ""} key={x}><span>{i+1}</span><small>{x}</small></div>)}</div>
        <div className="form-grid">
          {step===1 && <>
            <Field label="الاسم" defaultValue={formData.name} required />
            <Field label="رقم الهاتف" name="رقم_الهاتف" type="tel" defaultValue={formData["رقم_الهاتف"]} required />
            <Field label="البريد_الإلكتروني" type="email" defaultValue={formData["البريد_الإلكتروني"]} />
            <Field label="المحافظة_المنطقة" defaultValue={formData["المحافظة_المنطقة"]} required />
          </>}
          {step===2 && <>
            <Field label="ماركة_الجهاز" placeholder="Dell / HP / Lenovo" defaultValue={formData["ماركة_الجهاز"]} required />
            <Field label="موديل_الجهاز" defaultValue={formData["موديل_الجهاز"]} required />
            <Field label="نوع_الجهاز" placeholder="لابتوب / كمبيوتر مكتبي" defaultValue={formData["نوع_الجهاز"]} />
            <Field label="العمر_التقريبي" defaultValue={formData["العمر_التقريبي"]} />
            <label className="field full">وصف المشكلة<textarea name="وصف_المشكلة" defaultValue={formData["وصف_المشكلة"]} required placeholder="اكتب تفاصيل العطل أو المشكلة..."/></label>
          </>}
          {step===3 && <>
            <label className="field full">طريقة التسليم<div className="radios"><label><input type="radio" checked={deliveryType === 'زيارة الفرع'} onChange={() => setDeliveryType('زيارة الفرع')} name="delivery" value="زيارة الفرع"/> زيارة الفرع</label><label><input type="radio" checked={deliveryType === 'استلام من المنزل'} onChange={() => setDeliveryType('استلام من المنزل')} name="delivery" value="استلام من المنزل"/> استلام من المنزل</label><label><input type="radio" checked={deliveryType === 'زيارة منزلية'} onChange={() => setDeliveryType('زيارة منزلية')} name="delivery" value="زيارة منزلية"/> زيارة منزلية</label><label><input type="radio" checked={deliveryType === 'شحن'} onChange={() => setDeliveryType('شحن')} name="delivery" value="شحن"/> شحن عبر شركة شحن</label></div></label>
            <Field label="الموعد_المفضل" type="date" defaultValue={formData["الموعد_المفضل"]} required />
            <Field label="الفترة_المناسبة" placeholder="من 10 صباحًا إلى 2 ظهرًا" defaultValue={formData["الفترة_المناسبة"]} />
          </>}
          {step===4 && <>
            {needsShippingReceipt ? <div className="payment-panel"><p><b>رسوم الاستلام والشحن — اختر وسيلة التحويل وارفع الإيصال</b></p><div className="payment-methods"><button type="button" className={paymentMethod === "instapay" ? "payment-card selected" : "payment-card"} onClick={() => setPaymentMethod("instapay")}><img src={paymentLogos.instapay} alt="Instapay" className="payment-logo"/><span><small>انستا باي</small><strong>01068111576</strong></span></button><button type="button" className={paymentMethod === "vodafone" ? "payment-card selected" : "payment-card"} onClick={() => setPaymentMethod("vodafone")}> <img src={paymentLogos.vodafone} alt="Vodafone Cash" className="payment-logo"/><span><small>فودافون كاش</small><strong>01068111576</strong></span></button></div><label className="field full">صورة تحويل مصاريف الشحن (مطلوبة)<input type="file" accept="image/*" required onChange={handleReceipt}/></label>{receipt && <small>الصورة المرفوعة: {receipt.name}</small>}</div> : <div className="payment-panel"><p><b>زيارة الفرع لا تحتاج إلى تحويل رسوم شحن أو رفع إيصال.</b></p></div>}
            <div className="confirm"><p>راجع البيانات ثم اضغط إنهاء لإرسال الطلب.</p></div>
          </>}
        </div>
        {feedback && <p className={`feedback-message ${/تعذر|لا يمكن/.test(feedback) ? 'error' : 'success'}`}>{feedback}</p>}
        <div className="form-actions">
          {step > 1 && <button type="button" className="secondary" onClick={() => setStep(s => s-1)}>السابق</button>}
          {step < 4 && <button type="button" className="primary" onClick={goToNextStep}>التالي <ChevronLeft/></button>}
          {step === 4 && <button type="button" className="primary" onClick={finish} disabled={submitting}>{submitting ? 'جارٍ الإرسال...' : 'إنهاء وارسال الطلب'} <ChevronLeft/></button>}
        </div>
      </div>
    </Page>
  );
}

function Shipping({ notify }) {
  const [deliveryType, setDeliveryType] = useState('زيارة الفرع');
  const [paymentMethod, setPaymentMethod] = useState('instapay');
  const [receipt, setReceipt] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const handleReceipt = (e) => {
    const file = e.target.files[0] || null;
    setReceipt(file);
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!receipt) {
      setValidationError('ارفع صورة تحويل رسوم الشحن لإرسال طلب الشحن.');
      return;
    }
    setSubmitting(true);
    setFeedback('جارٍ إرسال الطلب...');
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.type = 'shipping';
      payload.delivery = deliveryType;
      payload.payment_method = paymentMethod;
      payload.payment_receipt = await receiptAsDataUrl(receipt);
      const res = await createRequest(payload);
      if (res?.ok !== false) {
        notify("تم إرسال طلب الاستلام بنجاح، سنتواصل معك للتأكيد.");
        setFeedback('تم إرسال الطلب بنجاح.');
        form.reset();
        setReceipt(null);
        setPaymentMethod('instapay');
      } else {
        setFeedback('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى لاحقًا.');
      }
    } catch (err) {
      console.error(err);
      setFeedback('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى لاحقًا.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="اطلب شحن جهازك للصيانة" text="اطلب استلام جهازك من المنزل وسنرسل لك تفاصيل الدفع فورًا.">
      <div className="split">
        <aside><h2>كيف تجهز جهازك للشحن؟</h2>{["خذ نسخة احتياطية من ملفاتك المهمة.","سجل كلمة مرور الجهاز عند الحاجة للفحص.","ضع الجهاز داخل علبة مناسبة مع حماية جيدة.","لا ترسل الشاحن إلا إن كان متعلقًا بالعطل."].map((x,i)=><p key={x}><span>{i+1}</span>{x}</p>)}<small>تكلفة الشحن التقديرية تبدأ من 75 ج.م، والاستلام خلال يوم إلى يومين عمل.</small></aside>
        <form className="form-card" onSubmit={handleSubmit}>
          <h2>بيانات الاستلام</h2>
          <div className="form-grid">
            <Field label="الاسم" name="name" required />
            <Field label="رقم الهاتف" name="phone" type="tel" required />
            <Field label="المحافظة" name="city" required />
            <Field label="العنوان_بالتفصيل" name="address" required />
            <Field label="نوع_الجهاز" name="device_type" required />
            <Field label="وصف_العطل" name="problem_description" required />
          </div>
          <label className="field full">طريقة الاستلام<div className="radios"><label><input type="radio" checked={deliveryType === 'استلام من المنزل'} onChange={() => setDeliveryType('استلام من المنزل')} /> استلام من المنزل</label><label><input type="radio" checked={deliveryType === 'شحن'} onChange={() => setDeliveryType('شحن')} /> شحن عبر شركة شحن</label></div></label>
          <div className="payment-panel"><p><b>رسوم الشحن 75 ج.م — التحويل عبر</b></p><div className="payment-methods"><button type="button" className={paymentMethod === "instapay" ? "payment-card selected" : "payment-card"} onClick={() => setPaymentMethod("instapay")}><img src={paymentLogos.instapay} alt="Instapay" className="payment-logo"/><span><small>انستا باي</small><strong>01068111576</strong></span></button><button type="button" className={paymentMethod === "vodafone" ? "payment-card selected" : "payment-card"} onClick={() => setPaymentMethod("vodafone")}> <img src={paymentLogos.vodafone} alt="Vodafone Cash" className="payment-logo"/><span><small>فودافون كاش</small><strong>01068111576</strong></span></button></div><label className="field full">صورة تحويل رسوم الشحن (مطلوبة)<input type="file" accept="image/*" onChange={handleReceipt} required/></label>{receipt && <small>الصورة المرفوعة: {receipt.name}</small>}{validationError && <p className="validation-error">{validationError}</p>}{feedback && <p className={`feedback-message ${feedback.includes('خطأ') ? 'error' : 'success'}`}>{feedback}</p>}</div>
          <button className="primary full" disabled={submitting}>{submitting ? 'جارٍ الإرسال...' : 'طلب مندوب الاستلام'} <Truck/></button>
        </form>
      </div>
    </Page>
  );
}

function Store({ items, add, query, setQuery, category, setCategory }) { const cats=["الكل",...new Set(products.map(p=>p.category))]; return <Page title="متجر LapGPT" text="قطع غيار وإكسسوارات أصلية ومتوافقة بجودة مضمونة. الأسعار استرشادية بالجنيه المصري، ومراجعتها الأخيرة 27 سبتمبر 2026."><div className="toolbar"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن منتج..."/></label><div>{cats.map(x=><button key={x} className={category===x?"selected":""} onClick={()=>setCategory(x)}>{x}</button>)}</div></div>{items.length?<div className="grid products">{items.map(p=><ProductCard key={p.id} product={p} add={add}/>)}</div>:<div className="empty"><Search/><h3>لا توجد منتجات</h3><p>جرّب البحث بكلمات مختلفة.</p></div>}</Page>; }

function ProductArtwork({ name }) {
  const rules = [
    [/ssd|هارد|فلاشة|flash|تخزين/i, HardDrive], [/ram|رام/i, MemoryStick], [/كابل|وصلة|hdmi|displayport/i, Cable], [/مروحة|تبريد|cooler|معجون/i, Fan], [/كيبورد|keyboard/i, Keyboard], [/ماوس|mouse|pad/i, Mouse], [/سماعة|headphone|bluetooth/i, Headphones], [/webcam|كاميرا/i, Webcam], [/شاشة|monitor/i, Monitor], [/wifi|واي.?فاي/i, Wifi], [/usb|hub|قارئ/i, Usb], [/حقيبة|شنطة/i, BriefcaseBusiness], [/gamepad|ألعاب|gaming/i, Gamepad2], [/راوتر|router/i, Router], [/شاحن|power bank|باور بنك/i, BatteryCharging], [/كهرباء|power strip/i, Plug], [/منظف|spray/i, SprayCan], [/عدة صيانة|مفك/i, Wrench], [/ميكروفون|microphone/i, Mic], [/حامل لابتوب|stand/i, PanelTop],
  ];
  const Icon = rules.find(([pattern]) => pattern.test(name))?.[1] || Laptop;
  return <div className="product-art" role="img" aria-label={`رسم توضيحي: ${name}`}><span className="art-glow"/><Icon aria-hidden="true" strokeWidth={1.35}/><small>LAPGPT</small></div>;
}
function ProductCard({ product, add }) { return <article className="card product"><div className="product-image"><ProductArtwork name={product.name}/></div><div><small>{product.category}</small><h3>{product.name}</h3><p className="rating"><Star size={15} fill="currentColor"/>{product.rating}</p><b>{money(product.price)}</b><button className="primary full" onClick={() => add(product)}><Plus/> أضف للسلة</button></div></article>; }

function Track({ show, setShow }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lookup = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      try { const response = await getOrder(orderNumber.trim(), phone.trim()); setOrder({ ...response.order, kind: "store" }); }
      catch {
        const response = await getServiceRequest(orderNumber.trim(), phone.trim());
        setOrder({ orderNumber: response.request.id, status: response.request.status, total: 0, paymentReceipt: false, createdAt: response.request.createdAt, kind: "service" });
      }
      setShow(true);
    }
    catch { setOrder(null); setShow(false); setError("لم نعثر على طلب مطابق. راجع رقم الطلب ورقم الهاتف."); }
    finally { setLoading(false); }
  };
  return <Page title="متابعة الطلب" text="أدخل رقم الطلب ورقم الهاتف المسجل به."><div className="form-card track"><form onSubmit={lookup}><div className="form-grid"><label className="field">رقم الطلب<input value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} placeholder="ORD-20260927-000001 أو LC-20260927-000001" required/></label><label className="field">رقم الهاتف<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required/></label></div><button className="primary full" disabled={loading}>{loading?'جارٍ البحث...':'تتبع الطلب'} <Search/></button></form>{error&&<p className="feedback-message error">{error}</p>}{show&&order&&<><div className="track-head"><div><small>{order.kind === "service"?"رقم طلب الصيانة":"رقم الطلب"}</small><h2>{order.orderNumber}</h2></div><span>{order.status === "awaiting_payment_review" ? "بانتظار مراجعة التحويل" : order.status === "pending" ? "تم استلام الطلب" : order.status}</span></div><div className="summary">{order.kind !== "service"&&<div><small>الإجمالي</small><b>{money(Number(order.total))}</b></div>}{order.kind !== "service"&&<div><small>حالة التحويل</small><b>{order.paymentReceipt?"تم استلام الصورة — قيد المراجعة":"لم يتم رفع الإثبات"}</b></div>}<div><small>تاريخ الطلب</small><b>{new Date(order.createdAt).toLocaleDateString("ar-EG")}</b></div></div></>}</div></Page>;
}

function Cart({ cart, total, update, navigate, notify }) {
  const [paymentMethod, setPaymentMethod] = useState("instapay");
  const [receipt, setReceipt] = useState(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const handleReceipt = (e) => setReceipt(e.target.files[0]);
  if (!cart.length) return <Page title="سلة المشتريات"><div className="empty"><ShoppingCart/><h3>السلة فارغة</h3><button className="primary" onClick={()=>navigate("store")}>تصفح المتجر</button></div></Page>;

  const checkout = async () => {
    if (!customer.name || !customer.phone || !customer.email || !customer.address) {
      setFeedback('أكمل الاسم ورقم الهاتف والبريد الإلكتروني والعنوان أولًا.');
      return;
    }
    if (!receipt) {
      setFeedback('ارفع صورة تحويل رسوم الشحن 75 ج.م قبل إرسال الطلب.');
      return;
    }
    setSubmitting(true);
    setFeedback('جارٍ تأكيد الطلب...');
    try {
      const payload = {
        items: cart,
        total: String(total + 75),
        payment_method: paymentMethod,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        deliveryType: "shipping",
      };
      payload.payment_receipt = await receiptAsDataUrl(receipt);
      
      const response = await createOrder(payload);
      
      if (response.ok && response.order) {
        const orderNumber = response.order.orderNumber;
        notify(`تم استلام طلبك للمراجعة. رقم الطلب: ${orderNumber}`);
        setFeedback(`تم استلام طلبك وصورة التحويل للمراجعة. رقم الطلب: ${orderNumber}`);
        setTimeout(() => navigate('home'), 2000);
      } else {
        throw new Error(response.error || "Order failed");
      }
    } catch (err) {
      console.error(err);
      setFeedback('تعذر تأكيد الطلب الآن. جرّب مرة أخرى أو تواصل معنا مباشرة.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="سلة المشتريات" text="راجع منتجاتك قبل إتمام الطلب.">
      <div className="cart">
        <div>{cart.map(x => <article className="cart-item" key={x.id}><div className="cart-art"><ProductArtwork name={x.name}/></div><div><h3>{x.name}</h3><b>{money(x.price)}</b><p><button onClick={()=>update(x.id,x.quantity+1)}>+</button>{x.quantity}<button onClick={()=>update(x.id,x.quantity-1)}>-</button></p></div><button className="remove" onClick={()=>update(x.id,0)}><X/></button></article>)}</div>
        <aside className="order"><h2>بيانات التوصيل</h2><label className="field">الاسم<input required value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label><label className="field">رقم الهاتف<input required type="tel" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label><label className="field">البريد الإلكتروني<input required type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label><label className="field">العنوان بالتفصيل<input required value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label><h2>ملخص الطلب</h2><p><span>الإجمالي الفرعي</span><b>{money(total)}</b></p><p><span>رسوم الشحن</span><b>75 ج.م</b></p><hr/><p><span>الإجمالي</span><b>{money(total+75)}</b></p><div className="payment-step"><p><b>حوّل رسوم الشحن 75 ج.م، ثم ارفع صورة التحويل</b></p><div className="payment-methods"><button type="button" className={paymentMethod === "instapay" ? "payment-card selected" : "payment-card"} onClick={() => setPaymentMethod("instapay")}><img src={paymentLogos.instapay} alt="Instapay" className="payment-logo"/><span><small>انستا باي</small><strong>01068111576</strong></span></button><button type="button" className={paymentMethod === "vodafone" ? "payment-card selected" : "payment-card"} onClick={() => setPaymentMethod("vodafone")}> <img src={paymentLogos.vodafone} alt="Vodafone Cash" className="payment-logo"/><span><small>فودافون كاش</small><strong>01068111576</strong></span></button></div><label className="field full">صورة تحويل الشحن (مطلوبة)<input type="file" accept="image/*" required onChange={handleReceipt}/></label>{receipt && <small>الصورة المرفوعة: {receipt.name}</small>}{feedback && <p className="feedback-message error">{feedback}</p>}</div><button className="primary full" onClick={checkout} disabled={submitting}>{submitting?'جارٍ إرسال الطلب...':'إرسال الطلب للمراجعة'}</button></aside>
      </div>
    </Page>
  );
}

function Contact({ notify }) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const handle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('جارٍ إرسال رسالتك...');
    try {
      const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
      await sendContact(payload);
      notify("تم إرسال رسالتك، سنتواصل معك قريبًا");
      setFeedback('تم إرسال الرسالة بنجاح.');
      e.currentTarget.reset();
    } catch (err) {
      console.error(err);
      setFeedback('تعذر إرسال الرسالة الآن. جرّب مرة أخرى أو اتصل بنا مباشرة.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Page title="تواصل معنا" text="المهندس محمد ناصر معجزه هنا لمساعدتك والإجابة عن استفساراتك.">
      <div className="split">
        <div className="contact-list"><Info icon={Phone} title="اتصل بنا" text="01068111576"/><Info icon={MessageCircle} title="واتساب" text="تحدث معنا مباشرة"/><Info icon={MapPin} title="زرنا" text="6 أكتوبر، الجيزة"/><Info icon={CircleUserRound} title="المسؤول الفني" text="المهندس محمد ناصر معجزه"/><Info icon={Clock3} title="ساعات العمل" text="يوميًا من 10 ص إلى 10 م"/><div className="payment-panel"><h3>طرق الدفع</h3><div className="payment-methods contact"><article className="payment-card instapay"><span className="payment-icon instapay">IN</span><div><strong>انستا باي</strong><p>01068111576</p></div></article><article className="payment-card vodafone"><span className="payment-icon vodafone">VF</span><div><strong>فودافون كاش</strong><p>01068111576</p></div></article></div></div></div>
        <form className="form-card" onSubmit={handle}>
          <h2>أرسل رسالة</h2>
          <Field label="الاسم" name="name" required />
          <Field label="رقم الهاتف" name="phone" type="tel" required />
          <Field label="البريد الإلكتروني" name="email" type="email" />
          <label className="field">رسالتك<textarea name="message" required/></label>
          {feedback && <p className={`feedback-message ${feedback.includes('تعذر') ? 'error' : 'success'}`}>{feedback}</p>}
          <button className="primary full" disabled={submitting}>{submitting ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}</button>
        </form>
      </div>
    </Page>
  );
}

function Info({icon:Icon,title,text}){return <div className="info"><Icon/><div><b>{title}</b><small>{text}</small></div></div>}
function Page({title,text,children}){return <section className="page section"><div className="container"><Title title={title} text={text}/>{children}</div></section>}
function Title({eyebrow,title,text}){return <div className="title">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{text&&<p>{text}</p>}</div>}
function Field({label,type="text",placeholder,required,name,defaultValue}){
  const fieldName = name || String(label).replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g,'_');
  return <label className="field">{label}<input name={fieldName} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue || ""}/></label>
}
function Footer({navigate}){return <footer className="footer"><div className="container"><div><button className="brand" onClick={()=>navigate("home")}><Laptop/><span>Lap<b>GPT</b></span></button><p>صيانة وبيع مستلزمات اللابتوب في مكان واحد، بإشراف المهندس محمد ناصر معجزه.</p></div><div><b>روابط سريعة</b><button onClick={()=>navigate("services")}>الخدمات</button><button onClick={()=>navigate("store")}>المتجر</button><button onClick={()=>navigate("contact")}>تواصل معنا</button><button onClick={()=>navigate("admin")}>لوحة الإدارة</button></div><div><b>تواصل</b><p>01068111576<br/>6 أكتوبر، الجيزة<br/>الدفع: انستا باي، فودافون كاش</p></div></div><small>© 2026 LapGPT — جميع الحقوق محفوظة</small></footer>}
