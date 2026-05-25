import { useState, useEffect } from "react";

const KITCHEN_NAME = "The Fry Factory";
const KITCHEN_TAGLINE = "Cloud Kitchen · Fresh · Fast · Delivered";
const ADMIN_PIN = "22041993";
const WHATSAPP_NUMBER = "923208203031";
const DELIVERY_CHARGE = 150;

const Rs = (n) => `Rs. ${Number(n).toLocaleString()}`;

const timeAgo = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
};

const MENU = [
  { id: 1, name: "Classic Smash Burger", cat: "burgers", price: 450, desc: "Double smashed patty, special sauce, pickles & crisp lettuce", popular: true },
  { id: 2, name: "Double Smash Burger", cat: "burgers", price: 650, desc: "Two smashed patties, cheddar cheese, caramelized onions", popular: false },
  { id: 3, name: "Crispy Chicken Burger", cat: "burgers", price: 490, desc: "Crispy fried chicken fillet, coleslaw, sriracha mayo", popular: true },
  { id: 4, name: "BBQ Mushroom Burger", cat: "burgers", price: 520, desc: "Beef patty, smoky BBQ sauce, grilled mushrooms", popular: false },
  { id: 5, name: "Zinger Wrap", cat: "wraps", price: 380, desc: "Spicy zinger fillet, jalapeños, garlic sauce in a soft tortilla", popular: false },
  { id: 6, name: "BBQ Chicken Wrap", cat: "wraps", price: 360, desc: "Grilled chicken, BBQ sauce, fresh crunchy veggies", popular: false },
  { id: 7, name: "Classic Shawarma", cat: "wraps", price: 320, desc: "Marinated chicken, garlic sauce, pickles & fries rolled in", popular: true },
  { id: 8, name: "Chicken Biryani", cat: "rice", price: 350, desc: "Fragrant basmati with tender chicken, served with cooling raita", popular: true },
  { id: 9, name: "Beef Biryani", cat: "rice", price: 420, desc: "Slow-cooked spiced beef on aromatic basmati, raita & salad", popular: false },
  { id: 10, name: "Chicken Fried Rice", cat: "rice", price: 300, desc: "Wok-tossed basmati with chicken, eggs and vegetables", popular: false },
  { id: 11, name: "Family Deal", cat: "deals", price: 1800, desc: "4 Smash Burgers + 4 Crispy Fries + 4 Cold Drinks — feeds 4!", popular: true },
  { id: 12, name: "Couple Deal", cat: "deals", price: 1100, desc: "2 Burgers of choice + 2 Fries + 2 Cold Drinks", popular: false },
  { id: 13, name: "Student Deal", cat: "deals", price: 650, desc: "1 Burger + 1 Fries + 1 Cold Drink — best value!", popular: true },
  { id: 14, name: "Crispy Fries", cat: "sides", price: 180, desc: "Golden crispy fries seasoned perfectly, served with ketchup", popular: false },
  { id: 15, name: "Loaded Fries", cat: "sides", price: 320, desc: "Fries piled with cheese sauce, jalapeños & spring onions", popular: true },
  { id: 16, name: "Cold Drink (Can)", cat: "drinks", price: 80, desc: "Pepsi, 7Up, or Mirinda — your choice", popular: false },
  { id: 17, name: "Fresh Lemon Soda", cat: "drinks", price: 120, desc: "Fresh lemon, mint syrup, chilled soda water", popular: false },
];

const CATS = [
  { id: "all", label: "All Items" },
  { id: "burgers", label: "🍔 Burgers" },
  { id: "wraps", label: "🌯 Wraps" },
  { id: "rice", label: "🍛 Rice" },
  { id: "deals", label: "🎁 Deals" },
  { id: "sides", label: "🍟 Sides" },
  { id: "drinks", label: "🥤 Drinks" },
];

const STATUS = {
  new: { label: "New Order", bg: "#3d0a0a", border: "#7f1d1d", text: "#fca5a5", next: "accepted", nextLabel: "✓ Accept Order", pulse: true },
  accepted: { label: "Accepted", bg: "#2d1e05", border: "#78350f", text: "#fcd34d", next: "preparing", nextLabel: "👨‍🍳 Start Cooking", pulse: false },
  preparing: { label: "Preparing", bg: "#0a1f3d", border: "#1e3a5f", text: "#93c5fd", next: "ready", nextLabel: "🔔 Mark Ready", pulse: false },
  ready: { label: "Ready for Pickup/Delivery", bg: "#0a2d1a", border: "#14532d", text: "#86efac", next: "delivered", nextLabel: "✓ Mark Delivered", pulse: false },
  delivered: { label: "Delivered ✓", bg: "#1a1a1a", border: "#333", text: "#9ca3af", next: null },
  cancelled: { label: "Cancelled", bg: "#1f1f1f", border: "#444", text: "#6b7280", next: null },
};

const SAMPLE_ORDERS = [
  {
    id: "ORD-001", num: 1,
    customer: { name: "Ahmed Khan", phone: "0300-1234567", address: "Block 5, Gulshan-e-Iqbal, Karachi", type: "delivery", notes: "Please ring the doorbell" },
    items: [{ name: "Classic Smash Burger", price: 450, qty: 2 }, { name: "Crispy Fries", price: 180, qty: 2 }],
    total: 1260, deliveryCharge: 150, status: "new", time: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: "ORD-002", num: 2,
    customer: { name: "Sara Malik", phone: "0321-9876543", address: "DHA Phase 4, Karachi", type: "delivery", notes: "" },
    items: [{ name: "Chicken Biryani", price: 350, qty: 2 }, { name: "Cold Drink (Can)", price: 80, qty: 2 }],
    total: 860, deliveryCharge: 150, status: "preparing", time: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: "ORD-003", num: 3,
    customer: { name: "Ali Hassan", phone: "0333-5555555", address: "", type: "pickup", notes: "Call when ready" },
    items: [{ name: "Family Deal", price: 1800, qty: 1 }],
    total: 1800, deliveryCharge: 0, status: "ready", time: new Date(Date.now() - 40 * 60000).toISOString(),
  },
];

let orderCounter = 4;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; background: #0d0a06; }
  ::-webkit-scrollbar-thumb { background: #3a2e20; border-radius: 3px; }
  .cart-slide { animation: slideIn 0.25s ease; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .pulse-ring { animation: pulseRing 1.5s infinite; }
  @keyframes pulseRing { 0%, 100% { box-shadow: 0 0 0 0 rgba(252,165,165,0.4); } 50% { box-shadow: 0 0 0 8px rgba(252,165,165,0); } }
  .hover-card:hover { background: #1e1710 !important; transform: translateY(-1px); transition: all 0.2s; }
  input, textarea, select { background: #1e1710 !important; color: #f0e6d3 !important; border: 1px solid #3a2e20 !important; border-radius: 8px !important; padding: 10px 14px !important; font-family: 'DM Sans', sans-serif !important; font-size: 14px !important; outline: none !important; width: 100% !important; }
  input:focus, textarea:focus, select:focus { border-color: #f0a030 !important; }
  select option { background: #1e1710; }
  .btn-amber { background: #f0a030; color: #0d0a06; border: none; border-radius: 8px; padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .btn-amber:hover { background: #e09020; transform: translateY(-1px); }
  .btn-amber:active { transform: scale(0.98); }
  .btn-ghost { background: transparent; color: #f0e6d3; border: 1px solid #3a2e20; border-radius: 8px; padding: 10px 20px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s; }
  .btn-ghost:hover { border-color: #f0a030; color: #f0a030; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
`;

export default function App() {
  const [view, setView] = useState("customer");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [oFilter, setOFilter] = useState("all");
  const [form, setForm] = useState({ name: "", phone: "", address: "", type: "delivery", notes: "" });
  const [formErr, setFormErr] = useState({});
  const [, tick] = useState(0);

  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(t); }, []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const deliveryFee = form.type === "delivery" ? DELIVERY_CHARGE : 0;
  const grandTotal = cartTotal + deliveryFee;

  const addToCart = (item) => {
    setCart(p => {
      const ex = p.find(c => c.id === item.id);
      return ex ? p.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) : [...p, { ...item, qty: 1 }];
    });
  };

  const updQty = (id, d) => setCart(p => p.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + d) } : c).filter(c => c.qty > 0));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (form.type === "delivery" && !form.address.trim()) e.address = "Required for delivery";
    setFormErr(e);
    return !Object.keys(e).length;
  };

  const placeOrder = () => {
    if (!validate()) return;
    const dc = form.type === "delivery" ? DELIVERY_CHARGE : 0;
    const order = {
      id: `ORD-00${orderCounter}`, num: orderCounter++,
      customer: { ...form },
      items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
      total: cartTotal + dc, deliveryCharge: dc,
      status: "new", time: new Date().toISOString(),
    };
    setOrders(p => [order, ...p]);
    setConfirmed(order);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setForm({ name: "", phone: "", address: "", type: "delivery", notes: "" });
  };

  const buildWA = (order) => {
    const lines = order.items.map(i => `  • ${i.qty}x ${i.name} — ${Rs(i.price * i.qty)}`).join("\n");
    const dc = order.deliveryCharge > 0 ? `\nDelivery: ${Rs(order.deliveryCharge)}` : "";
    const msg = `🔔 NEW ORDER — ${order.id}\n\nCustomer: ${order.customer.name}\nPhone: ${order.customer.phone}\nOrder Type: ${order.customer.type === "delivery" ? "🚴 Delivery" : "🏃 Pickup"}${order.customer.type === "delivery" ? `\nAddress: ${order.customer.address}` : ""}\n\nItems:\n${lines}${dc}\n💰 Total: ${Rs(order.total)}${order.customer.notes ? `\n\n📝 Notes: ${order.customer.notes}` : ""}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const newCount = orders.filter(o => o.status === "new").length;
  const menuItems = cat === "all" ? MENU : MENU.filter(i => i.cat === cat);
  const filtOrders = oFilter === "all" ? orders : orders.filter(o => o.status === oFilter);

  const cartItem = (id) => cart.find(c => c.id === id);

  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#0d0a06", color: "#f0e6d3" }}>

        {/* TOP NAV */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,10,6,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1f1810", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "#f0a030", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔥</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{KITCHEN_NAME}</div>
              <div style={{ fontSize: 10, color: "#8a7a66", letterSpacing: "0.08em", marginTop: 1 }}>CLOUD KITCHEN</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {view === "customer" ? (
              <>
                <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setView("admin")}>
                  Kitchen Dashboard {newCount > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>{newCount}</span>}
                </button>
                {cartCount > 0 && (
                  <button className="btn-amber" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px" }} onClick={() => setCartOpen(true)}>
                    🛒 Cart
                    <span style={{ background: "#0d0a06", borderRadius: 99, padding: "1px 8px", fontSize: 12 }}>{cartCount}</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{Rs(cartTotal)}</span>
                  </button>
                )}
              </>
            ) : (
              <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => { setView("customer"); setAdminAuthed(false); setPin(""); }}>
                ← Customer View
              </button>
            )}
          </div>
        </header>

        {/* CUSTOMER VIEW */}
        {view === "customer" && (
          <div>
            {/* HERO */}
            <div style={{ background: "linear-gradient(135deg, #1a1108 0%, #0d0a06 60%)", borderBottom: "1px solid #1f1810", padding: "60px 20px 50px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(240,160,48,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#f0a030", fontWeight: 600, marginBottom: 12 }}>ORDER ONLINE • DELIVERY & PICKUP</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px,6vw,64px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 14 }}>
                  Food Made<br /><span style={{ color: "#f0a030" }}>Fresh For You</span>
                </h1>
                <p style={{ color: "#9a8870", fontSize: 16, maxWidth: 480, margin: "0 auto 28px" }}>
                  Burgers, wraps, biryani and more — crafted fresh, delivered to your door or ready for pickup.
                </p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                  <div style={{ background: "#1a1510", border: "1px solid #2e2518", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#c8a87a" }}>🚴 Delivery: {Rs(DELIVERY_CHARGE)}</div>
                  <div style={{ background: "#1a1510", border: "1px solid #2e2518", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#c8a87a" }}>⏱ 30–45 min estimate</div>
                  <div style={{ background: "#1a1510", border: "1px solid #2e2518", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#c8a87a" }}>📦 Min order: {Rs(300)}</div>
                </div>
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div style={{ borderBottom: "1px solid #1f1810", overflowX: "auto", position: "sticky", top: 60, zIndex: 90, background: "rgba(13,10,6,0.97)", backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", gap: 4, padding: "12px 20px", minWidth: "max-content" }}>
                {CATS.map(c => (
                  <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: "8px 16px", borderRadius: 99, border: cat === c.id ? "1px solid #f0a030" : "1px solid #2e2518", background: cat === c.id ? "#f0a030" : "transparent", color: cat === c.id ? "#0d0a06" : "#9a8870", cursor: "pointer", fontSize: 13, fontWeight: cat === c.id ? 600 : 400, whiteSpace: "nowrap", transition: "all 0.15s" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MENU GRID */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 20px 100px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {menuItems.map(item => {
                  const inCart = cartItem(item.id);
                  return (
                    <div key={item.id} className="hover-card" style={{ background: "#16110c", border: "1px solid #2e2518", borderRadius: 12, padding: 18, cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                      {item.popular && <span className="tag" style={{ position: "absolute", top: 14, right: 14, background: "#2d1e05", color: "#f0a030", border: "1px solid #78350f" }}>Popular</span>}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.name}</div>
                        <div style={{ color: "#8a7a66", fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#f0a030" }}>{Rs(item.price)}</span>
                        {!inCart ? (
                          <button className="btn-amber" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => addToCart(item)}>+ Add</button>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#2e2518", borderRadius: 8, padding: "4px 8px" }}>
                            <button onClick={() => updQty(item.id, -1)} style={{ background: "none", border: "none", color: "#f0a030", fontSize: 18, cursor: "pointer", lineHeight: 1, width: 24, height: 24 }}>−</button>
                            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 16, textAlign: "center" }}>{inCart.qty}</span>
                            <button onClick={() => addToCart(item)} style={{ background: "none", border: "none", color: "#f0a030", fontSize: 18, cursor: "pointer", lineHeight: 1, width: 24, height: 24 }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FLOATING CART */}
            {cartCount > 0 && !cartOpen && (
              <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200 }}>
                <button className="btn-amber" onClick={() => setCartOpen(true)} style={{ padding: "14px 32px", fontSize: 15, borderRadius: 99, boxShadow: "0 8px 30px rgba(240,160,48,0.4)", display: "flex", gap: 12, alignItems: "center" }}>
                  🛒 View Cart
                  <span style={{ background: "rgba(0,0,0,0.25)", borderRadius: 99, padding: "2px 10px" }}>{cartCount} items · {Rs(cartTotal)}</span>
                </button>
              </div>
            )}

            {/* CART SIDEBAR */}
            {cartOpen && (
              <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setCartOpen(false)} />
                <div className="cart-slide" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)", background: "#13100b", borderLeft: "1px solid #2e2518", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1f1810", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Your Cart</h2>
                    <button onClick={() => setCartOpen(false)} style={{ background: "#2e2518", border: "none", color: "#f0e6d3", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #1f1810" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                          <div style={{ color: "#f0a030", fontSize: 13, marginTop: 2 }}>{Rs(item.price)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#2e2518", borderRadius: 8, padding: "4px 10px" }}>
                          <button onClick={() => updQty(item.id, -1)} style={{ background: "none", border: "none", color: "#f0a030", fontSize: 16, cursor: "pointer" }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 14, textAlign: "center" }}>{item.qty}</span>
                          <button onClick={() => updQty(item.id, 1)} style={{ background: "none", border: "none", color: "#f0a030", fontSize: 16, cursor: "pointer" }}>+</button>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, minWidth: 70, textAlign: "right" }}>{Rs(item.price * item.qty)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #1f1810" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14, color: "#9a8870" }}>
                      <span>Subtotal</span><span>{Rs(cartTotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14, color: "#9a8870" }}>
                      <span>Delivery fee</span><span style={{ color: form.type === "pickup" ? "#86efac" : "#9a8870" }}>{form.type === "pickup" ? "Free (Pickup)" : Rs(DELIVERY_CHARGE)}</span>
                    </div>
                    <button className="btn-amber" style={{ width: "100%", padding: 14, fontSize: 15 }} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                      Proceed to Checkout →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CHECKOUT MODAL */}
            {checkoutOpen && (
              <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} onClick={() => setCheckoutOpen(false)} />
                <div className="fade-in" style={{ position: "relative", background: "#13100b", border: "1px solid #2e2518", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
                  <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1f1810", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Checkout</h2>
                    <button onClick={() => setCheckoutOpen(false)} style={{ background: "#2e2518", border: "none", color: "#f0e6d3", width: 32, height: 32, borderRadius: 8, cursor: "pointer" }}>✕</button>
                  </div>
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#1a1510", borderRadius: 10, padding: 4, marginBottom: 20 }}>
                      {["delivery", "pickup"].map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ padding: "10px", border: "none", borderRadius: 8, background: form.type === t ? "#f0a030" : "transparent", color: form.type === t ? "#0d0a06" : "#9a8870", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.15s" }}>
                          {t === "delivery" ? "🚴 Delivery" : "🏃 Pickup"}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, color: "#8a7a66", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>YOUR NAME *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter your full name" />
                        {formErr.name && <div style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{formErr.name}</div>}
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#8a7a66", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>PHONE / WHATSAPP *</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
                        {formErr.phone && <div style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{formErr.phone}</div>}
                      </div>
                      {form.type === "delivery" && (
                        <div>
                          <label style={{ fontSize: 12, color: "#8a7a66", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>DELIVERY ADDRESS *</label>
                          <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="House/Flat, Street, Area, City" rows={3} style={{ resize: "vertical" }} />
                          {formErr.address && <div style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{formErr.address}</div>}
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize: 12, color: "#8a7a66", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>ORDER NOTES (OPTIONAL)</label>
                        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions, allergies, etc." rows={2} style={{ resize: "vertical" }} />
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div style={{ background: "#1a1510", borderRadius: 10, padding: 16, marginTop: 20 }}>
                      <div style={{ fontSize: 12, color: "#8a7a66", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 12 }}>ORDER SUMMARY</div>
                      {cart.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#c8a87a" }}>
                          <span>{item.qty}× {item.name}</span>
                          <span>{Rs(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid #2e2518", marginTop: 10, paddingTop: 10 }}>
                        {form.type === "delivery" && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#9a8870" }}>
                            <span>Delivery fee</span><span>{Rs(DELIVERY_CHARGE)}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                          <span>Total</span>
                          <span style={{ color: "#f0a030" }}>{Rs(grandTotal)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#6b5a48", marginTop: 6 }}>💵 Cash on delivery / pickup</div>
                      </div>
                    </div>

                    <button className="btn-amber" style={{ width: "100%", padding: 16, fontSize: 16, marginTop: 16, borderRadius: 10 }} onClick={placeOrder}>
                      🎉 Place Order — {Rs(grandTotal)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER CONFIRMED */}
            {confirmed && (
              <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)" }} />
                <div className="fade-in" style={{ position: "relative", background: "#13100b", border: "1px solid #2e2518", borderRadius: 20, width: "100%", maxWidth: 480, padding: 32, textAlign: "center" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>Order Placed!</h2>
                  <div style={{ color: "#8a7a66", marginBottom: 6 }}>Order ID: <span style={{ color: "#f0a030", fontWeight: 600 }}>{confirmed.id}</span></div>
                  <p style={{ color: "#9a8870", fontSize: 14, marginBottom: 24 }}>Thank you, <strong style={{ color: "#f0e6d3" }}>{confirmed.customer.name}</strong>! We've received your order and will start preparing it right away.</p>

                  <div style={{ background: "#1a1510", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
                    {confirmed.items.map((i, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#c8a87a", marginBottom: 4 }}>
                        <span>{i.qty}× {i.name}</span><span>{Rs(i.price * i.qty)}</span>
                      </div>
                    ))}
                    {confirmed.deliveryCharge > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9a8870", marginBottom: 4 }}>
                        <span>Delivery</span><span>{Rs(confirmed.deliveryCharge)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid #2e2518", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                      <span>Total</span><span style={{ color: "#f0a030" }}>{Rs(confirmed.total)}</span>
                    </div>
                  </div>

                  <a href={buildWA(confirmed)} target="_blank" rel="noreferrer" style={{ display: "block", background: "#25d366", color: "#fff", borderRadius: 10, padding: "13px 24px", fontSize: 15, fontWeight: 600, textDecoration: "none", marginBottom: 12 }}>
                    📲 Send Order to Kitchen via WhatsApp
                  </a>
                  <button className="btn-ghost" style={{ width: "100%" }} onClick={() => setConfirmed(null)}>
                    Continue Browsing Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW */}
        {view === "admin" && (
          !adminAuthed ? (
            <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div className="fade-in" style={{ background: "#16110c", border: "1px solid #2e2518", borderRadius: 16, padding: 40, width: "100%", maxWidth: 360, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>Kitchen Access</h2>
                <p style={{ color: "#8a7a66", fontSize: 14, marginBottom: 24 }}>Enter your PIN to access the order dashboard</p>
                <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(false); }} onKeyDown={e => e.key === "Enter" && (() => { if (pin === ADMIN_PIN) { setAdminAuthed(true); setPinErr(false); } else setPinErr(true); })()} placeholder="Enter PIN" style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, marginBottom: 12 }} maxLength={8} />
                {pinErr && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>Incorrect PIN. Try again.</div>}
                <button className="btn-amber" style={{ width: "100%", padding: 14 }} onClick={() => { if (pin === ADMIN_PIN) { setAdminAuthed(true); setPinErr(false); } else setPinErr(true); }}>
                  Enter Dashboard
                </button>
                <div style={{ marginTop: 16, fontSize: 12, color: "#4a3e30" }}>Default PIN: 1234 (change in code)</div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
                {[
                  { label: "New Orders", val: orders.filter(o => o.status === "new").length, color: "#fca5a5" },
                  { label: "In Progress", val: orders.filter(o => ["accepted","preparing"].includes(o.status)).length, color: "#93c5fd" },
                  { label: "Ready", val: orders.filter(o => o.status === "ready").length, color: "#86efac" },
                  { label: "Delivered Today", val: orders.filter(o => o.status === "delivered").length, color: "#f0a030" },
                  { label: "Total Revenue", val: Rs(orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0)), color: "#e9d5ff" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#16110c", border: "1px solid #2e2518", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#6b5a48", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>{stat.label.toUpperCase()}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.val}</div>
                  </div>
                ))}
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {[{ id: "all", l: "All" }, { id: "new", l: "New" }, { id: "accepted", l: "Accepted" }, { id: "preparing", l: "Preparing" }, { id: "ready", l: "Ready" }, { id: "delivered", l: "Delivered" }, { id: "cancelled", l: "Cancelled" }].map(f => (
                  <button key={f.id} onClick={() => setOFilter(f.id)} style={{ padding: "6px 14px", borderRadius: 99, border: oFilter === f.id ? "1px solid #f0a030" : "1px solid #2e2518", background: oFilter === f.id ? "#2d1e05" : "transparent", color: oFilter === f.id ? "#f0a030" : "#8a7a66", cursor: "pointer", fontSize: 13, transition: "all 0.15s" }}>
                    {f.l}
                    {f.id !== "all" && <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>({orders.filter(o => o.status === f.id).length})</span>}
                  </button>
                ))}
              </div>

              {/* Orders */}
              {filtOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#4a3e30" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div>No orders in this category yet</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filtOrders.map(order => {
                    const sc = STATUS[order.status];
                    return (
                      <div key={order.id} className={order.status === "new" ? "pulse-ring" : ""} style={{ background: "#16110c", border: `1px solid ${sc.border}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s" }}>
                        {/* Order header */}
                        <div style={{ background: sc.bg, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: sc.text }}>{order.id}</span>
                            <span className="tag" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                            {order.customer.type === "delivery" ? <span style={{ fontSize: 12, color: sc.text, opacity: 0.8 }}>🚴 Delivery</span> : <span style={{ fontSize: 12, color: sc.text, opacity: 0.8 }}>🏃 Pickup</span>}
                          </div>
                          <span style={{ fontSize: 12, color: sc.text, opacity: 0.7 }}>{timeAgo(order.time)}</span>
                        </div>

                        {/* Order body */}
                        <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          {/* Customer info */}
                          <div>
                            <div style={{ fontSize: 11, color: "#6b5a48", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>CUSTOMER</div>
                            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{order.customer.name}</div>
                            <div style={{ fontSize: 13, color: "#9a8870", marginBottom: 3 }}>📞 {order.customer.phone}</div>
                            {order.customer.type === "delivery" && order.customer.address && (
                              <div style={{ fontSize: 12, color: "#8a7a66", marginBottom: 3 }}>📍 {order.customer.address}</div>
                            )}
                            {order.customer.notes && (
                              <div style={{ fontSize: 12, color: "#c8a87a", background: "#1f1a12", borderRadius: 6, padding: "6px 10px", marginTop: 6 }}>📝 {order.customer.notes}</div>
                            )}
                          </div>

                          {/* Items */}
                          <div>
                            <div style={{ fontSize: 11, color: "#6b5a48", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>ORDER ITEMS</div>
                            {order.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#c8a87a" }}>
                                <span>{item.qty}× {item.name}</span>
                                <span>{Rs(item.price * item.qty)}</span>
                              </div>
                            ))}
                            {order.deliveryCharge > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5a48", marginBottom: 4 }}>
                                <span>Delivery fee</span><span>{Rs(order.deliveryCharge)}</span>
                              </div>
                            )}
                            <div style={{ borderTop: "1px solid #2e2518", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                              <span>Total</span><span style={{ color: "#f0a030" }}>{Rs(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {sc.next && (
                          <div style={{ padding: "0 18px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button className="btn-amber" style={{ fontSize: 13, padding: "10px 20px" }} onClick={() => updateOrderStatus(order.id, sc.next)}>
                              {sc.nextLabel}
                            </button>
                            <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, "").replace(/^0/, "92")}?text=${encodeURIComponent(`Hi ${order.customer.name}! Your order ${order.id} from ${KITCHEN_NAME} is ${order.status === "ready" ? "ready for " + (order.customer.type === "delivery" ? "delivery 🚴" : "pickup 🏃") : STATUS[sc.next].label.toLowerCase() + " 👨‍🍳"}. Total: ${Rs(order.total)}.`)}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0d3320", border: "1px solid #14532d", color: "#86efac", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                              💬 WhatsApp Customer
                            </a>
                            {order.status === "new" && (
                              <button onClick={() => cancelOrder(order.id)} style={{ background: "none", border: "1px solid #3d1515", color: "#f87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer" }}>
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}
