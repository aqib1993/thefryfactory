import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Lock, 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp, 
  Coins, 
  Activity, 
  FileText, 
  Layers, 
  Settings, 
  MapPin, 
  Phone, 
  User, 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  BarChart4, 
  Package, 
  HelpCircle 
} from "lucide-react";
import { MenuItem, Category, KitchenConfig, Order, OrderItem } from "./types";
import { DEFAULT_MENU, DEFAULT_CATS, DEFAULT_CONFIG } from "./data";

export default function App() {
  // --- STATE PERSISTENCE CLIENT-SIDE ---
  const [config, setConfig] = useState<KitchenConfig>(() => {
    const saved = localStorage.getItem("kitchen_config");
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("kitchen_categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATS;
  });

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem("kitchen_menu");
    return saved ? JSON.parse(saved) : DEFAULT_MENU;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("kitchen_orders");
    return saved ? JSON.parse(saved) : [];
  });

  // Save changes to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem("kitchen_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("kitchen_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("kitchen_menu", JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem("kitchen_orders", JSON.stringify(orders));
  }, [orders]);

  // --- UI STATE CONSTANTS ---
  const [view, setView] = useState<"customer" | "admin">("customer");
  const [adminTab, setAdminTab] = useState<"orders" | "menu" | "categories" | "settings">("orders");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Storefront navigation filters & search
  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Cart & Checkout states
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Customer Order Delivery details form
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
    type: "delivery" as "delivery" | "pickup",
    notes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Admin Dashboard filters and editing states
  const [orderQuery, setOrderQuery] = useState("");
  const [ordersFilter, setOrdersFilter] = useState<string>("all");
  
  // Modals for admin creation/modification
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name: "", desc: "", cat: "", price: 0, popular: false, outOfStock: false
  });

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState<Partial<Category>>({
    id: "", label: ""
  });

  // Standard alerts toggling
  const [adminMessage, setAdminMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (adminMessage) {
      const timer = setTimeout(() => setAdminMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [adminMessage]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setAdminMessage({ text, type });
  };

  // --- HELPER FORMATTING FUNCTIONS ---
  const Rs = (n: number) => `Rs. ${Number(n).toLocaleString()}`;

  const timeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ${diffMins % 60}m ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return "some time ago";
    }
  };

  // --- SYSTEM LOGIC - CUSTOMER FLOW ---
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const deliveryCharge = checkoutForm.type === "delivery" ? config.deliveryCharge : 0;
  const cartGrandTotal = cartSubtotal + deliveryCharge;

  const handleAddToCart = (item: MenuItem) => {
    if (item.outOfStock) {
      alert("This item is currently out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.id === id) {
          const nextQty = c.qty + delta;
          return { ...c, qty: nextQty };
        }
        return c;
      }).filter(c => c.qty > 0);
    });
  };

  const validateCheckoutForm = () => {
    const errors: Record<string, string> = {};
    if (!checkoutForm.name.trim()) errors.name = "Enter your full name so we can identify you";
    if (!checkoutForm.phone.trim()) errors.phone = "Provide your phone / WhatsApp number for dynamic updates";
    if (checkoutForm.phone.trim() && !/^\d{10,13}$/.test(checkoutForm.phone.replace(/[\s-+]/g, ""))) {
      errors.phone = "Enter a valid phone number (at least 10 digits)";
    }
    if (checkoutForm.type === "delivery" && !checkoutForm.address.trim()) {
      errors.address = "Complete address is required for prompt courier delivery";
    }
    if (cartSubtotal < config.minOrder) {
      errors.cart = `Minimum order amount is ${Rs(config.minOrder)}. Your cart layout total is ${Rs(cartSubtotal)}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = () => {
    if (!validateCheckoutForm()) return;

    const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: newOrderId,
      customer: { ...checkoutForm },
      items: [...cart],
      total: cartGrandTotal,
      deliveryCharge,
      status: "new",
      time: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    setConfirmedOrder(newOrder);
    
    // Clear storefront inputs & checkout workflow states
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setCheckoutForm({
      name: "",
      phone: "",
      address: "",
      type: "delivery",
      notes: ""
    });
    setFormErrors({});
  };

  // Build clean dynamic text for WhatsApp dispatching
  const getWhatsAppMessageUrl = (order: Order) => {
    const header = `*🔥 NEW ORDER RECIEVED - ${config.name} *`;
    const details = `\n\n📌 *Order ID:* ${order.id}\n👤 *Customer:* ${order.customer.name}\n📞 *Phone:* ${order.customer.phone}\n📦 *Delivery Type:* ${order.customer.type === "delivery" ? "Delivery 🚴" : "Self-Pickup 🏃"}`;
    const address = order.customer.type === "delivery" ? `\n📍 *Address:* ${order.customer.address}` : "";
    const note = order.customer.notes ? `\n📝 *Notes:* "${order.customer.notes}"` : "";
    
    const itemsList = order.items.map(i => `• ${i.qty}x _${i.name}_ - (${Rs(i.price * i.qty)})`).join("\n");
    const summary = `\n\n🍔 *ITEMS:* \n${itemsList}\n\n💵 *Subtotal:* ${Rs(order.total - order.deliveryCharge)}\n🚴 *Delivery Fee:* ${Rs(order.deliveryCharge)}\n💰 *TOTAL BILL:* ${Rs(order.total)}\n📍 *Payment Method:* Cash on Delivery (COD)`;
    const footer = `\n\n_Thank you for ordering with us! Please confirm your cooking slot schedule._`;

    const fullMessage = `${header}${details}${address}${note}${summary}${footer}`;
    return `https://wa.me/${config.whatsappNumber.replace(/[\s-+]/g, "")}?text=${encodeURIComponent(fullMessage)}`;
  };

  // --- SYSTEM LOGIC - ADMIN DASHBOARD ---
  const handleAdminVerify = () => {
    if (pinInput === config.adminPin) {
      setAdminAuthed(true);
      setPinError(false);
      setPinInput("");
      showToast("Access Granted. Welcome back chef!", "success");
    } else {
      setPinError(true);
      showToast("Verification failed. Incorrect Admin Pin.", "error");
    }
  };

  const handleUpdateOrderStatus = (id: string, nextStatus: Order["status"]) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    showToast(`Order status updated to ${nextStatus.toUpperCase()}`, "success");
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order record?")) {
      setOrders(prev => prev.filter(o => o.id !== id));
      showToast("Order history item deleted successfully");
    }
  };

  // --- MANUAL WEB EDIT CONTROLS (WITHOUT CHANGING CODES) ---
  // Menu Item operations
  const handleSaveItem = () => {
    if (!itemForm.name || !itemForm.cat || !itemForm.price) {
      showToast("Please fill all required item details!", "error");
      return;
    }

    if (editingItem) {
      // Modify target item
      setMenu(prev => prev.map(i => i.id === editingItem.id ? { 
        ...i, 
        name: itemForm.name!,
        desc: itemForm.desc || "",
        cat: itemForm.cat!,
        price: Number(itemForm.price),
        popular: !!itemForm.popular,
        outOfStock: !!itemForm.outOfStock
      } : i));
      showToast(`Successfully updated "${itemForm.name}" in menu catalog`, "success");
    } else {
      // Create new custom item
      const newItem: MenuItem = {
        id: `custom-${Date.now()}`,
        name: itemForm.name,
        desc: itemForm.desc || "",
        cat: itemForm.cat,
        price: Number(itemForm.price),
        popular: !!itemForm.popular,
        outOfStock: !!itemForm.outOfStock
      };
      setMenu(prev => [...prev, newItem]);
      showToast(`Successfully added "${itemForm.name}" to the menu!`, "success");
    }
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({ name: "", desc: "", cat: "", price: 0, popular: false, outOfStock: false });
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm("Are you sure you want to completely remove this item from your online menu?")) {
      setMenu(prev => prev.filter(i => i.id !== id));
      showToast("Menu item permanently removed");
    }
  };

  const handleTogglePopular = (item: MenuItem) => {
    setMenu(prev => prev.map(i => i.id === item.id ? { ...i, popular: !i.popular } : i));
    showToast(`Popular badge updated for "${item.name}"`);
  };

  const handleToggleStock = (item: MenuItem) => {
    setMenu(prev => prev.map(i => i.id === item.id ? { ...i, outOfStock: !i.outOfStock } : i));
    showToast(`Stock updated for "${item.name}" -> ${!item.outOfStock ? "OUT OF STOCK" : "IN STOCK"}`);
  };

  // Category operations
  const handleSaveCategory = () => {
    if (!catForm.id || !catForm.label) {
      showToast("Please supply a unique ID and a display Label for this category", "error");
      return;
    }

    const cleanId = catForm.id.toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (editingCat) {
      setCategories(prev => prev.map(c => c.id === editingCat.id ? { id: cleanId, label: catForm.label! } : c));
      // Update item association categories
      setMenu(prev => prev.map(item => item.cat === editingCat.id ? { ...item, cat: cleanId } : item));
      showToast(`Category updated to "${catForm.label}"`);
    } else {
      if (categories.find(c => c.id === cleanId)) {
        showToast("Category ID already exists!", "error");
        return;
      }
      setCategories(prev => [...prev, { id: cleanId, label: catForm.label! }]);
      showToast(`New category "${catForm.label}" successfully created!`);
    }
    setShowCatModal(false);
    setEditingCat(null);
    setCatForm({ id: "", label: "" });
  };

  const handleDeleteCategory = (id: string) => {
    const itemsInCat = menu.filter(item => item.cat === id);
    if (itemsInCat.length > 0) {
      if (!confirm(`Warning: There are ${itemsInCat.length} menu items list categorized under this tab. If you continue, those items will remain but won't belong to any category. Proceed?`)) {
        return;
      }
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast("Category removed successfully");
  };

  // General Kitchen config operations
  const handleSaveConfig = (fields: Partial<KitchenConfig>) => {
    setConfig(prev => ({ ...prev, ...fields }));
    showToast("Kitchen configurations synchronized locally", "success");
  };

  // --- STATS & ANALYTICS CALCULATOR ---
  const validOrders = orders.filter(o => o.status !== "cancelled");
  const grossSalesSum = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const avgOrderValue = deliveredOrders.length > 0 
    ? Math.round(deliveredOrders.reduce((sum, o) => sum + o.total, 0) / deliveredOrders.length) 
    : 0;

  const cancelledLossSum = orders.filter(o => o.status === "cancelled").reduce((sum, o) => sum + o.total, 0);
  const totalDeliveryFees = validOrders.reduce((sum, o) => sum + o.deliveryCharge, 0);

  // Compute top selling item names
  const itemQtyScores: Record<string, number> = {};
  orders.forEach(order => {
    if (order.status !== "cancelled") {
      order.items.forEach(i => {
        itemQtyScores[i.name] = (itemQtyScores[i.name] || 0) + i.qty;
      });
    }
  });
  const sortedItemScores = Object.entries(itemQtyScores).sort((a,b) => b[1] - a[1]);
  const bestSellerName = sortedItemScores.length > 0 ? sortedItemScores[0][0] : "None yet";
  const bestSellerQty = sortedItemScores.length > 0 ? sortedItemScores[0][1] : 0;

  // Render storefront item matching active filters & search terms
  const filteredMenuItems = menu.filter(item => {
    const matchesCat = activeCat === "all" || item.cat === activeCat;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Render admin orders list with filters & simple search matching
  const filteredOrders = orders.filter(o => {
    const matchesStatus = ordersFilter === "all" || o.status === ordersFilter;
    const cleanQuery = orderQuery.toLowerCase();
    const matchesSearch = !cleanQuery || 
                          o.id.toLowerCase().includes(cleanQuery) || 
                          o.customer.name.toLowerCase().includes(cleanQuery) || 
                          o.customer.phone.includes(cleanQuery) ||
                          o.items.some(i => i.name.toLowerCase().includes(cleanQuery));
    return matchesStatus && matchesSearch;
  });

  // Action flow tags
  const STATUS_CONFIGS: Record<Order["status"], { label: string; text: string; bg: string; border: string; nextStatus: Order["status"] | null; nextLabel: string }> = {
    new: { 
      label: "New Order", 
      text: "#fca5a5", 
      bg: "rgba(127, 29, 29, 0.4)", 
      border: "#7f1d1d", 
      nextStatus: "accepted", 
      nextLabel: "Accept Order ✓" 
    },
    accepted: { 
      label: "Accepted", 
      text: "#fcd34d", 
      bg: "rgba(120, 53, 15, 0.4)", 
      border: "#78350f", 
      nextStatus: "preparing", 
      nextLabel: "Start Cooking 👨‍🍳" 
    },
    preparing: { 
      label: "Preparing", 
      text: "#93c5fd", 
      bg: "rgba(30, 58, 138, 0.4)", 
      border: "#1e3a8a", 
      nextStatus: "ready", 
      nextLabel: "Mark Ready for handoff 🔔" 
    },
    ready: { 
      label: "Ready", 
      text: "#86efac", 
      bg: "rgba(20, 83, 45, 0.4)", 
      border: "#14532d", 
      nextStatus: "delivered", 
      nextLabel: "Deliver Order ✓" 
    },
    delivered: { 
      label: "Delivered", 
      text: "#9ca3af", 
      bg: "rgba(31, 41, 55, 0.4)", 
      border: "#374151", 
      nextStatus: null, 
      nextLabel: "" 
    },
    cancelled: { 
      label: "Cancelled", 
      text: "#f87171", 
      bg: "rgba(40, 40, 40, 0.4)", 
      border: "#4b5563", 
      nextStatus: null, 
      nextLabel: "" 
    }
  };

  return (
    <div className="bg-[#0b0805] text-[#f0e6d3] font-sans min-h-screen selection:bg-[#f0a030] selection:text-[#0b0805] transition-all duration-300">
      
      {/* GLOBAL NOTIFICATION TOAST */}
      {adminMessage && (
        <div className={`fixed top-4 right-4 z-[999] px-5 py-3 rounded-xl border flex items-center gap-3 backdrop-blur-md shadow-2xl transition-all duration-300 animate-bounce ${
          adminMessage.type === "success" 
            ? "bg-[#0f2e1a] border-[#14532d] text-[#86efac]" 
            : "bg-[#3a0a0a] border-[#7f1d1d] text-[#fca5a5]"
        }`}>
          {adminMessage.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{adminMessage.text}</span>
        </div>
      )}

      {/* FIXED FRONTEND NAVBAR */}
      <nav className="sticky top-0 z-[100] border-b border-[#211a12] glass-panel transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("customer")}>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#0b0805] flex items-center justify-center font-black text-xl shadow-[0_4px_16px_rgba(245,158,11,0.25)] ring-1 ring-amber-400">
              🔥
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 leading-none">
                {config.name}
              </h2>
              <span className="text-[10px] text-amber-500/80 font-mono tracking-widest uppercase block mt-1">
                {config.tagline.split("·")[0] || "CLOUD KITCHEN"}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {view === "customer" ? (
              <>
                <button
                  onClick={() => setView("admin")}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-amber-500 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 duration-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Lock size={12} />
                  <span>Chef Dashboard</span>
                  {orders.filter(o => o.status === "new").length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setCartOpen(true)}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0b0805] rounded-lg flex items-center gap-2 duration-150 shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span className="hidden sm:inline">Shopping Cart</span>
                  <span className="bg-[#0b0805]/20 text-[#0b0805] px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {cartItemCount}
                  </span>
                  {cartItemCount > 0 && (
                    <span className="font-mono font-bold block border-l border-[#0b0805]/10 pl-1.5">
                      {Rs(cartSubtotal)}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setView("customer");
                  setAdminAuthed(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-[#fcd34d] border border-[#fcd34d]/25 bg-[#241a08] hover:bg-[#3d2b0e] duration-150 flex items-center gap-2"
              >
                ← Shop Storefront
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* CUSTOMER MAIN DISPLAY VIEW */}
      {view === "customer" && (
        <div>
          {/* BANNER GREETING HERO */}
          <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-b from-[#1b120a] to-[#0b0805] border-b border-[#1c150c] text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="max-w-4xl mx-auto relative">
              <span className="text-[11px] font-mono tracking-widest text-[#f59e0b] bg-[#f59e0b]/5 px-3 py-1 rounded-full border border-[#f59e0b]/15 uppercase font-semibold">
                🔥 Quick Home Delivery & Hot Takeaway
              </span>
              <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight mt-6 mb-4 leading-tight">
                Satisfy Your Cravings <br className="hidden sm:inline" />
                With <span className="text-[#f59e0b]">Freshly Sizzled</span> Food
              </h1>
              <p className="text-sm sm:text-base text-stone-400 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
                {config.tagline}. We cook order-by-order using premium oils, imported spices & fresh butcher meats!
              </p>

              {/* Dynamic Info Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-stone-300">
                <span className="px-3 py-1.5 rounded-lg bg-[#16120d] border border-[#2e2417] text-xs font-medium flex items-center gap-1.5">
                  🚴 Delivery Fee: <strong className="text-amber-500">{Rs(config.deliveryCharge)}</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#16120d] border border-[#2e2417] text-xs font-medium flex items-center gap-1.5">
                  ⏱ Promise: <strong className="text-amber-500">30–45 Mins</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#16120d] border border-[#2e2417] text-xs font-medium flex items-center gap-1.5">
                  📦 Min Order: <strong className="text-amber-500">{Rs(config.minOrder)}</strong>
                </span>
              </div>
            </div>
          </section>

          {/* DYNAMIC CATEGORY PICKER & FILTER PANEL */}
          <section className="sticky top-16 z-50 py-3 bg-[#0b0805]/95 backdrop-blur-md border-b border-[#211a12] shadow-xl">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Category buttons tab */}
              <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <button
                  onClick={() => setActiveCat("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border duration-150 cursor-pointer whitespace-nowrap ${
                    activeCat === "all" 
                      ? "bg-[#f59e0b] hover:bg-amber-500 border-[#f59e0b] text-[#0b0805] font-semibold shadow-lg shadow-amber-500/10" 
                      : "bg-[#16120d] hover:bg-[#201a13] border-[#2e2417] text-[#c0a88c]"
                  }`}
                >
                  🍽 All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border duration-150 cursor-pointer whitespace-nowrap ${
                      activeCat === cat.id 
                        ? "bg-[#f59e0b] hover:bg-amber-500 border-[#f59e0b] text-[#0b0805] font-semibold shadow-lg shadow-amber-500/10" 
                        : "bg-[#16120d] hover:bg-[#201a13] border-[#2e2417] text-[#c0a88c]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Search Box */}
              <div className="w-full md:w-72 relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Query burgers, fries, biryani..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-[#16120d] border border-[#2e2417] text-[#f0e6d3] pl-9 pr-4 py-2 rounded-lg outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-stone-600 transition"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                    <X size={12} />
                  </button>
                )}
              </div>

            </div>
          </section>

          {/* CATALOG DISPLAY ELEMENT */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-24 bg-[#14100c] border border-[#231a10] rounded-2xl max-w-xl mx-auto">
                <HelpCircle size={44} className="mx-auto text-stone-600 mb-4" />
                <h3 className="font-serif font-bold text-lg text-stone-300">No Food Items Match Filter</h3>
                <p className="text-stone-500 text-xs mt-2 px-10">
                  There are currently no items available under this category. Contact us for custom cooking slots!
                </p>
                <button
                  onClick={() => { setActiveCat("all"); setSearchQuery(""); }}
                  className="mt-6 px-4 py-2 bg-amber-500 text-[#0b0805] hover:bg-amber-600 text-xs font-semibold rounded-lg duration-150"
                >
                  View All Menu Items
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMenuItems.map(item => {
                  const currCartItem = cart.find(c => c.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between bg-[#15110c] border rounded-2xl p-5 hover:border-amber-500/40 hover:bg-[#1a140f] duration-200 transition group ${
                        item.outOfStock ? "border-[#261d12] opacity-70" : "border-[#2c2012]"
                      }`}
                    >
                      {/* Popular/Out-of-Stock Badges */}
                      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                        {item.popular && (
                          <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 shadow-sm uppercase tracking-wide">
                            Pop Seller⭐
                          </span>
                        )}
                        {item.outOfStock && (
                          <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-900 shadow-sm uppercase tracking-wide">
                            Kitchen Out 🚫
                          </span>
                        )}
                      </div>

                      {/* Header Item info */}
                      <div>
                        <span className="text-[10px] font-semibold text-stone-500 font-mono tracking-wider block uppercase mb-1">
                          {categories.find(c => c.id === item.cat)?.label || item.cat}
                        </span>
                        <h3 className="font-serif font-bold text-lg text-white group-hover:text-amber-400 transition mb-1.5 duration-150">
                          {item.name}
                        </h3>
                        <p className="text-xs text-stone-400 leading-relaxed font-sans mb-4 min-h-[40px]">
                          {item.desc || "Prepared freshly on-demand with clean spices."}
                        </p>
                      </div>

                      {/* Price tag & add-to-cart layout controls */}
                      <div className="flex items-center justify-between border-t border-[#231a10] pt-4 mt-2">
                        <div className="font-serif text-lg font-black text-amber-400">
                          {Rs(item.price)}
                        </div>

                        {item.outOfStock ? (
                          <span className="text-[11px] font-medium text-stone-600 font-mono py-1.5 px-3 bg-[#110e0a] rounded-lg">
                            Out of Stock
                          </span>
                        ) : !currCartItem ? (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold text-xs rounded-lg shadow-sm transition active:scale-95 duration-100 cursor-pointer"
                          >
                            + Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[#2a1f12]/80 border border-amber-500/30 rounded-lg p-1">
                            <button
                              onClick={() => handleUpdateItemQty(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-amber-400 hover:text-white hover:bg-amber-500/15 rounded duration-100 font-bold"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold text-[#fff] w-5 text-center font-mono">
                              {currCartItem.qty}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-7 h-7 flex items-center justify-center text-amber-400 hover:text-white hover:bg-amber-500/15 rounded duration-100 font-bold"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* DYNAMIC CART SIDE-DRAWER */}
          {cartOpen && (
            <div className="fixed inset-0 z-[1000] overflow-hidden">
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setCartOpen(false)}
              />
              <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md bg-[#130f0a] border-l border-[#2e2417] flex flex-col shadow-2xl relative">
                  
                  {/* Cart Header */}
                  <div className="px-5 py-4 border-b border-[#211a12] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="text-amber-500" size={20} />
                      <h2 className="font-serif font-bold text-xl text-white">Your Cart</h2>
                      <span className="text-xs bg-[#241a0e] text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        {cartItemCount} Items
                      </span>
                    </div>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="w-8 h-8 rounded-lg bg-[#1f1911] text-stone-400 hover:text-white flex items-center justify-center cursor-pointer hover:bg-red-950/20 duration-150"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Cart List Items scroll zone */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar divide-y divide-[#211a12]">
                    {cart.length === 0 ? (
                      <div className="text-center py-24">
                        <ShoppingBag size={48} className="mx-auto text-stone-700 mb-4" />
                        <h4 className="font-medium text-stone-400">Cart Layout Is Empty</h4>
                        <p className="text-stone-600 text-xs mt-1">Please select delicious food items to satisfy details!</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="py-3.5 flex items-start gap-4">
                          <div className="flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-white">{item.name}</h4>
                            <span className="text-xs text-amber-500 font-mono font-medium block mt-1">{Rs(item.price)}</span>
                          </div>
                          
                          {/* Quantity selector */}
                          <div className="flex items-center gap-2 bg-[#1c1610] rounded-lg p-0.5 border border-[#2e2417]">
                            <button
                              onClick={() => handleUpdateItemQty(item.id!, -1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white rounded"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-bold text-white min-w-[20px] text-center font-mono">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => handleUpdateItemQty(item.id!, 1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white rounded"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          <div className="text-right min-w-[65px]">
                            <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                              {Rs(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cart Summary area */}
                  {cart.length > 0 && (
                    <div className="p-5 border-t border-[#211a12] bg-[#1a140e] space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span>Items Subtotal</span>
                          <span className="font-mono text-stone-300">{Rs(cartSubtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span>Delivery Fee (Estimate)</span>
                          <span className="font-mono text-stone-300">{Rs(config.deliveryCharge)}</span>
                        </div>
                        {cartSubtotal < config.minOrder && (
                          <div className="text-[10px] text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                            <AlertCircle size={12} />
                            <span>Add {Rs(config.minOrder - cartSubtotal)} more to satisfy minimum threshold!</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-[#2d2319] pt-3 flex items-center justify-between text-white">
                        <span className="font-serif font-bold text-sm">Grand Total</span>
                        <span className="font-serif font-black text-lg text-amber-400 font-mono">{Rs(cartSubtotal + config.deliveryCharge)}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (cartSubtotal < config.minOrder) {
                            alert(`Minimum order volume must be at least ${Rs(config.minOrder)} (excluding delivery fee). Just add some extra fries or side items!`);
                            return;
                          }
                          setCartOpen(false);
                          setCheckoutOpen(true);
                        }}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-[#0b0805] text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
                        disabled={cartSubtotal < config.minOrder}
                      >
                        <span>Proceed to Secure Checkout</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* CHECKOUT MODAL INTERFACE */}
          {checkoutOpen && (
            <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                onClick={() => setCheckoutOpen(false)}
              />
              <div className="relative bg-[#130f0a] border border-[#2e2417] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#211a12] flex items-center justify-between">
                  <h2 className="font-serif font-bold text-xl text-white">Review & Complete Order</h2>
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    className="w-8 h-8 rounded-lg bg-[#19140e] text-stone-400 hover:text-white flex items-center justify-center hover:bg-neutral-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Delivery vs Self-pickup selector bar */}
                  <div className="grid grid-cols-2 gap-1 bg-[#1c1610] p-1 border border-[#2e2417] rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setCheckoutForm(f => ({ ...f, type: "delivery" }))}
                      className={`py-2 rounded-lg duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        checkoutForm.type === "delivery" 
                          ? "bg-amber-500 text-stone-900 font-bold shadow-md shadow-amber-500/10" 
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      🚴 Delivery (At Address)
                    </button>
                    <button
                      onClick={() => setCheckoutForm(f => ({ ...f, type: "pickup" }))}
                      className={`py-2 rounded-lg duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        checkoutForm.type === "pickup" 
                          ? "bg-amber-500 text-stone-900 font-bold shadow-md shadow-amber-500/10" 
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      🏃 Self-Pickup (Hot slots)
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block mb-1.5 ring-offset-neutral-900">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Aqib Ahmed Mazars"
                        value={checkoutForm.name}
                        onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full text-xs font-medium bg-[#16120d] border border-[#2e2417] text-white px-3.5 py-2.5 rounded-lg focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 inline-block outline-none"
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle size={10} /> {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block mb-1.5">
                        WhatsApp Call Phone *
                      </label>
                      <input
                        type="text"
                        placeholder="03208203031"
                        value={checkoutForm.phone}
                        onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full text-xs font-medium bg-[#16120d] border border-[#2e2417] text-white px-3.5 py-2.5 rounded-lg focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 inline-block outline-none"
                      />
                      {formErrors.phone && (
                        <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle size={10} /> {formErrors.phone}
                        </p>
                      )}
                    </div>

                    {checkoutForm.type === "delivery" && (
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block mb-1.5">
                          Detailed House Address *
                        </label>
                        <textarea
                          placeholder="House No, Area, Near landmark, City"
                          value={checkoutForm.address}
                          onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))}
                          rows={2}
                          className="w-full text-xs font-medium bg-[#16120d] border border-[#2e2417] text-white px-3.5 py-2.5 rounded-lg focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 outline-none resize-none"
                        />
                        {formErrors.address && (
                          <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle size={10} /> {formErrors.address}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block mb-1.5">
                        Order Notes / Special Requests (Optional)
                      </label>
                      <textarea
                        placeholder="No pickles, extra napkins, spicy mayo etc."
                        value={checkoutForm.notes}
                        onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                        rows={1}
                        className="w-full text-xs font-medium bg-[#16120d] border border-[#2e2417] text-white px-3.5 py-2.5 rounded-lg focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Bill Outline Receipt */}
                  <div className="bg-[#1a140f] border border-[#2e2417] rounded-xl p-4 space-y-3 font-sans text-xs">
                    <span className="text-[10px] font-bold text-stone-500 uppercase font-mono tracking-wide block">
                      Total Checkout Receipt
                    </span>
                    <div className="max-h-24 overflow-y-auto pr-1 divide-y divide-[#271d13]/50">
                      {cart.map(item => (
                        <div key={item.id} className="py-1.5 flex items-center justify-between text-stone-300">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-mono">{Rs(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-[#211a12] pt-2 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-[#8a7a66]">
                        <span>Food Subtotal</span>
                        <span className="font-mono">{Rs(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#8a7a66]">
                        <span>Delivery Fee</span>
                        <span className="font-mono">{Rs(deliveryCharge)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white font-extrabold pt-1">
                        <span>Grand Cash Amount</span>
                        <span className="font-mono text-amber-500">{Rs(cartGrandTotal)}</span>
                      </div>
                    </div>
                    {formErrors.cart && (
                      <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/50 p-2 rounded mt-2">
                        {formErrors.cart}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCheckoutOpen(false)}
                      className="flex-1 py-3 bg-[#1c1610] border border-[#2e2417] text-stone-300 hover:text-white hover:bg-neutral-800 font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition active:scale-95 duration-150 cursor-pointer"
                    >
                      Place COD Order ({Rs(cartGrandTotal)})
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC POST-ORDER CONFIRMATION POPUP WITH WHATSAPP LINK */}
          {confirmedOrder && (
            <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <div className="relative bg-[#130f0a] border border-[#2e2417] rounded-3xl w-full max-w-md p-6 sm:p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-[#0a2d1a] border border-[#14532d] text-[#86efac] flex items-center justify-center text-3xl mx-auto mb-6">
                  🎉
                </div>
                
                <h2 className="font-serif font-black text-2xl text-white mb-1.5">
                  Order Registered Successfully!
                </h2>
                <p className="text-xs text-amber-500 font-mono font-bold tracking-wide">
                  Order Ticket Code: #{confirmedOrder.id}
                </p>

                <p className="text-stone-400 text-xs sm:text-sm my-4 px-3 leading-relaxed">
                  Hi <strong className="text-[#fcd34d] font-semibold">{confirmedOrder.customer.name}</strong>, your order has been queued in our kitchen. Let's send the slip via WhatsApp for instant processing!
                </p>

                {/* Receipt Preview */}
                <div className="bg-[#18120d] border border-[#2d2218] rounded-xl p-4 mb-6 text-left text-xs divide-y divide-[#271c10]/60 space-y-2">
                  <div className="pb-2">
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wider">Kitchen Queue Slip</span>
                    <div className="mt-1 font-semibold space-y-1 text-stone-300">
                      {confirmedOrder.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span>{i.qty}x {i.name}</span>
                          <span className="font-mono text-[11px] font-medium">{Rs(i.price * i.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-[#8a7a66] text-[11px]">
                      <span>Cooking Method</span>
                      <span className="capitalize">{confirmedOrder.customer.type}</span>
                    </div>
                    {confirmedOrder.deliveryCharge > 0 && (
                      <div className="flex justify-between text-[#8a7a66] text-[11px] mt-0.5">
                        <span>Courier Delivery</span>
                        <span className="font-mono">{Rs(confirmedOrder.deliveryCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-sm mt-1.5">
                      <span>Total Invoice</span>
                      <span className="font-mono text-[#fcd34d] font-black">{Rs(confirmedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={getWhatsAppMessageUrl(confirmedOrder)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                  >
                    {/* Raw Phone call or WhatsApp SVG */}
                    <Phone size={14} />
                    <span>Send Order to WhatsApp Manager</span>
                  </a>
                  
                  <button
                    onClick={() => setConfirmedOrder(null)}
                    className="w-full py-2.5 bg-[#17120d] border border-[#2e2417] text-stone-400 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    Continue Browsing Shop
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN CHEF DASHBOARD VIEW */}
      {view === "admin" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* PIN AUTH REQUIRED SKELETON */}
          {!adminAuthed ? (
            <div className="max-w-md mx-auto py-24">
              <div className="bg-[#120d09] border border-[#2a2013] rounded-3xl p-8 text-center shadow-2xl relative">
                <div className="w-14 h-14 rounded-full bg-amber-505 bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center text-xl mx-auto mb-6 shadow-sm">
                  <Lock size={20} />
                </div>
                
                <h2 className="font-serif font-bold text-2xl text-white mb-2">Kitchen Dashboard Access</h2>
                <p className="text-stone-500 text-xs mb-6 px-10 leading-relaxed">
                  Authentication PIN is mandatory to access online queue orders & modify price catalog layout.
                </p>

                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={pinInput}
                      onChange={e => {
                        setPinInput(e.target.value);
                        setPinError(false);
                      }}
                      onKeyDown={e => e.key === "Enter" && handleAdminVerify()}
                      className="w-full text-center text-xl tracking-[0.4em] bg-[#1a140e] border border-[#3e2e1b] text-amber-500 py-3 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-bold"
                      maxLength={12}
                    />
                    {pinError && (
                      <p className="text-red-400 text-xs font-semibold mt-2 flex items-center gap-1 justify-center">
                        <AlertCircle size={11} /> Pin Code is incorrect. Try again!
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleAdminVerify}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0b0805] text-xs font-bold rounded-xl transition duration-150 cursor-pointer shadow-md shadow-amber-500/15"
                  >
                    Authenticate PIN & Open Dashboard
                  </button>
                  
                  <div className="bg-[#1a130c] border border-[#2e2316] rounded-xl p-3 text-[11px] text-stone-500 text-left mt-4">
                    💡 <strong>Quick Notes:</strong> Default system PIN is configured as <span className="text-amber-500 font-bold">22041993</span>. You can modify this inside the Settings tab once you log in. No external code compilation is required!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* ADMIN VIEW HEADER */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#211a12] pb-6 mb-8">
                <div>
                  <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-white">
                    Cloud Kitchen Control Panel
                  </h1>
                  <p className="text-stone-500 text-xs mt-1">
                    Direct live controls to modify prices, add food items, update stock & coordinate kitchen orders!
                  </p>
                </div>

                {/* Tab Switcher Actions */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#1a130b] border border-[#2d2111] rounded-xl self-stretch md:self-auto text-xs font-semibold">
                  <button
                    onClick={() => setAdminTab("orders")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "orders" ? "bg-amber-500 text-[#0b0805] font-bold" : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <Activity size={12} />
                    <span>Live Queue ({orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length})</span>
                  </button>
                  <button
                    onClick={() => setAdminTab("menu")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "menu" ? "bg-amber-500 text-[#0b0805] font-bold" : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <Package size={12} />
                    <span>Catalog Items ({menu.length})</span>
                  </button>
                  <button
                    onClick={() => setAdminTab("categories")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "categories" ? "bg-amber-500 text-[#0b0805] font-bold" : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <Layers size={12} />
                    <span>Edit Categories</span>
                  </button>
                  <button
                    onClick={() => setAdminTab("settings")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "settings" ? "bg-amber-500 text-[#0b0805] font-bold" : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <Settings size={12} />
                    <span>Configuration Settings</span>
                  </button>
                </div>
              </div>

              {/* REAL-TIME METRICS & ANALYTICS BAR */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-[#120d09] border border-[#211a12] p-4 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Coins size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wide block">Gross Sales</span>
                    <strong className="text-sm font-bold text-emerald-400 font-mono block mt-0.5">{Rs(grossSalesSum)}</strong>
                  </div>
                </div>

                <div className="bg-[#120d09] border border-[#211a12] p-4 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <BarChart4 size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wide block">Delivered Ticket</span>
                    <strong className="text-sm font-bold text-white font-mono block mt-0.5">{deliveredOrders.length} Completed</strong>
                  </div>
                </div>

                <div className="bg-[#120d09] border border-[#211a12] p-4 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#f59e0b] flex items-center justify-center">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wide block">Avg Bill</span>
                    <strong className="text-sm font-bold text-amber-505 text-[#f59e0b] font-mono block mt-0.5">{Rs(avgOrderValue)}</strong>
                  </div>
                </div>

                <div className="bg-[#120d09] border border-[#211a12] p-4 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-455 text-indigo-400 flex items-center justify-center">
                    <Activity size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wide block">Active Queue</span>
                    <strong className="text-sm font-bold text-white font-mono block mt-0.5">{orders.filter(o => ["new", "accepted", "preparing", "ready"].includes(o.status)).length} Orders</strong>
                  </div>
                </div>

                <div className="bg-[#120d09] border border-[#211a12] p-4 rounded-xl flex items-center gap-3 col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                    <Trash2 size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wide block">Cancelled Ticket</span>
                    <strong className="text-sm font-bold text-red-400 font-mono block mt-0.5">{orders.filter(o => o.status === "cancelled").length} ({Rs(cancelledLossSum)})</strong>
                  </div>
                </div>

                <div className="bg-[#120d09] border border-[#211a12] p-4 rounded-xl flex items-center gap-3 col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-500 tracking-wide block">Top Seller Food</span>
                    <strong className="text-xs font-bold text-purple-300 block truncate mt-0.5" title={`${bestSellerName} (${bestSellerQty}x)`}>
                      {bestSellerName.split(" ").slice(0, 2).join(" ")} ({bestSellerQty}x)
                    </strong>
                  </div>
                </div>
              </div>

              {/* LIVE QUEUE TAB SECTION */}
              {adminTab === "orders" && (
                <div className="space-y-6">
                  
                  {/* Query filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#14100c] border border-[#231a10] p-4 rounded-xl">
                    {/* Status filter tabs */}
                    <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold w-full sm:w-auto">
                      {[{ id: "all", l: "All" }, { id: "new", l: "New" }, { id: "accepted", l: "Accepted" }, { id: "preparing", l: "Cooking" }, { id: "ready", l: "Ready" }, { id: "delivered", l: "Delivered" }, { id: "cancelled", l: "Cancelled" }].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setOrdersFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg duration-150 cursor-pointer ${
                            ordersFilter === tab.id 
                              ? "bg-amber-500/15 border border-amber-500/30 text-amber-400" 
                              : "text-stone-400 hover:text-white border border-transparent"
                          }`}
                        >
                          {tab.l} ({tab.id === "all" ? orders.length : orders.filter(o => o.status === tab.id).length})
                        </button>
                      ))}
                    </div>

                    {/* Order visual lookup box */}
                    <div className="w-full sm:w-64 relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                      <input
                        type="text"
                        placeholder="Search ID, customer name..."
                        value={orderQuery}
                        onChange={e => setOrderQuery(e.target.value)}
                        className="w-full text-xs bg-[#19140f] border border-[#2c2112] text-white pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Orders list map */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-[#14100c] border border-[#231a10] rounded-2xl max-w-xl mx-auto">
                      <FileText size={36} className="mx-auto text-stone-600 mb-3" />
                      <h4 className="font-serif font-bold text-base text-stone-300">No Orders Fit Filter Queue</h4>
                      <p className="text-stone-550 text-xs mt-1">There are no orders matching active criteria in client storage.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredOrders.map(order => {
                        const statusConfig = STATUS_CONFIGS[order.status];
                        return (
                          <div
                            key={order.id}
                            className={`flex flex-col justify-between bg-[#15110c] border rounded-2xl overflow-hidden transition ${
                              order.status === "new" ? "border-red-500/40 shadow-md shadow-red-500/5 pulse-ring-amber" : "border-[#2e2417]"
                            }`}
                          >
                            {/* Order mini banner */}
                            <div className="px-4 py-2.5 flex items-center justify-between text-xs" style={{ backgroundColor: statusConfig.bg }}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-white px-2 py-0.5 rounded bg-black/30">
                                  #{order.id}
                                </span>
                                <span className="px-2 py-0.5 rounded font-extrabold text-[10px] uppercase border" style={{ color: statusConfig.text, borderColor: statusConfig.border }}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <span className="text-stone-300 font-mono font-medium flex items-center gap-1">
                                <Clock size={11} /> {timeAgo(order.time)}
                              </span>
                            </div>

                            {/* Details body */}
                            <div className="p-4 sm:p-5 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Customer metadata */}
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase font-mono tracking-widest text-[#8a7a66] block">Handoff Delivery info</span>
                                <div className="space-y-1">
                                  <div className="text-[#fff] font-bold text-sm flex items-center gap-1.5">
                                    <User size={13} className="text-amber-500" />
                                    <span>{order.customer.name}</span>
                                  </div>
                                  <div className="text-stone-300 font-mono text-xs flex items-center gap-1.5 hover:text-white duration-100">
                                    <Phone size={13} className="text-stone-500" />
                                    <a href={`tel:${order.customer.phone}`} className="underline">{order.customer.phone}</a>
                                  </div>
                                  {order.customer.type === "delivery" && order.customer.address && (
                                    <div className="text-stone-400 font-medium text-xs flex items-start gap-1.5 mt-1">
                                      <MapPin size={13} className="text-stone-500 shrink-0 mt-0.5" />
                                      <span className="leading-tight">{order.customer.address}</span>
                                    </div>
                                  )}
                                  {order.customer.notes && (
                                    <div className="bg-[#1f160f] border border-stone-830 rounded-lg p-2.5 text-[11px] text-stone-300 font-medium tracking-wide mt-2">
                                      📝 <strong>Notes:</strong> "{order.customer.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Selected food items */}
                              <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-[#2e2417] sm:pl-4 pt-4 sm:pt-0">
                                <span className="text-[9px] uppercase font-mono tracking-widest text-[#8a7a66] block">Food Items Ordered</span>
                                <div className="space-y-1 text-xs">
                                  {order.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-stone-300">
                                      <span>{it.qty}x <strong className="text-white font-medium">{it.name}</strong></span>
                                      <span className="font-mono text-[11px]">{Rs(it.price * it.qty)}</span>
                                    </div>
                                  ))}
                                  {order.deliveryCharge > 0 && (
                                    <div className="flex justify-between items-center text-stone-550 pt-1 text-[11px]">
                                      <span>🚴 Delivery Fee</span>
                                      <span className="font-mono">{Rs(order.deliveryCharge)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-[#fff] font-bold text-sm border-t border-[#2e2417] pt-2 mt-1.5">
                                    <span>Total Invoice</span>
                                    <span className="font-mono text-amber-400">{Rs(order.total)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Direct queue status transiting button links */}
                            <div className="px-4 py-3 bg-[#110e0a] border-t border-[#231a10] flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {statusConfig.nextStatus && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, statusConfig.nextStatus!)}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-[11px] text-stone-900 rounded-lg duration-150 transition select-none cursor-pointer"
                                  >
                                    {statusConfig.nextLabel}
                                  </button>
                                )}
                                {order.status === "new" && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                    className="px-3 py-2 bg-red-950 hover:bg-red-900 font-bold text-[11px] text-red-400 border border-red-900/50 rounded-lg duration-150 transition cursor-pointer"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <a
                                  href={getWhatsAppMessageUrl(order)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 px-2 border border-emerald-500/25 bg-emerald-505/5 hover:bg-emerald-500/15 text-emerald-400 font-bold text-[10px] rounded-lg duration-150 flex items-center gap-1"
                                  title="Share order layout ticket with delivery driver"
                                >
                                  📨 WhatsApp Slip
                                </a>
                                
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-2 bg-[#211611]/60 border border-red-950 hover:border-red-500 hover:bg-red-500/15 text-stone-400 hover:text-red-400 rounded-lg duration-150 transition cursor-pointer"
                                  title="Delete history order completely"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* EDIT MENU CATALOG TAB SECTION */}
              {adminTab === "menu" && (
                <div className="space-y-6">
                  {/* Item filter & listing controller bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#14100c] border border-[#231a10] p-4 rounded-xl">
                    <div className="text-stone-300 font-medium text-xs font-serif">
                      Showing All {menu.length} Items Listed in Storefront
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setItemForm({ name: "", desc: "", cat: categories[0]?.id || "", price: 0, popular: false, outOfStock: false });
                        setShowItemModal(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 active:scale-95 duration-100 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      <Plus size={14} />
                      <span>Manually Add New Dish</span>
                    </button>
                  </div>

                  {/* Catalog management items list */}
                  <div className="bg-[#100c08] border border-[#251e15] rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#2d2316] bg-[#1a140f] text-stone-500 font-bold text-[10px] uppercase tracking-wider">
                            <th className="py-3.5 px-6">Dish Name</th>
                            <th className="py-3.5 px-4">Menu Section</th>
                            <th className="py-3.5 px-4">Cooking Price</th>
                            <th className="py-3.5 px-4">Catalog Status</th>
                            <th className="py-3.5 px-6 text-right">Settings Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#231a0e]/40">
                          {menu.map(item => (
                            <tr key={item.id} className="hover:bg-[#1a140e]/30 duration-100">
                              {/* Item details */}
                              <td className="py-4 px-6">
                                <div className="text-white font-bold">{item.name}</div>
                                <div className="text-stone-500 text-[11px] max-w-sm truncate mt-1">{item.desc || "No custom description cataloged."}</div>
                              </td>
                              {/* Category association */}
                              <td className="py-4 px-4 text-stone-300 font-medium">
                                <span className="bg-[#211a12] border border-[#302619] px-2.5 py-1 rounded text-xs">
                                  {categories.find(c => c.id === item.cat)?.label || item.cat}
                                </span>
                              </td>
                              {/* Price */}
                              <td className="py-4 px-4 text-amber-400 font-mono font-bold tracking-wide">
                                {Rs(item.price)}
                              </td>
                              {/* Indicators markup */}
                              <td className="py-4 px-4 space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleTogglePopular(item)}
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                    item.popular 
                                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400" 
                                      : "bg-[#16120d] border-[#2e2417] text-stone-600 hover:text-stone-400"
                                  }`}
                                  title="Toggle 'Popular Highlight' badge card on storefront"
                                >
                                  {item.popular ? "⭐ Popular" : "☆ Standard"}
                                </button>

                                <button
                                  onClick={() => handleToggleStock(item)}
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                    item.outOfStock 
                                      ? "bg-red-950/40 border-red-500/40 text-red-400" 
                                      : "bg-[#16120d] border-[#2e2417] text-emerald-400 hover:opacity-75"
                                  }`}
                                  title="Mark dish as In-Stock vs Out-Of-Stock"
                                >
                                  {item.outOfStock ? "🚫 Out" : "✅ In-Stock"}
                                </button>
                              </td>
                              {/* Action controls */}
                              <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setItemForm({ ...item });
                                    setShowItemModal(true);
                                  }}
                                  className="p-1.5 bg-[#1f1a12] border border-stone-800 hover:border-amber-500/50 text-stone-300 hover:text-white rounded-lg inline-flex items-center duration-150 cursor-pointer"
                                  title="Edit full particulars"
                                >
                                  <Edit size={12} />
                                </button>

                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="p-1.5 bg-neutral-900 border border-neutral-800 hover:border-red-500 hover:bg-red-500/15 text-stone-500 hover:text-red-400 rounded-lg inline-flex items-center duration-150 cursor-pointer"
                                  title="Permanently remove from catalog"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ITEM FORM CONFIG MODAL */}
                  {showItemModal && (
                    <div className="fixed inset-0 z-[1020] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
                      <div className="relative bg-[#130f0a] border border-[#2e2417] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#211a12] pb-3">
                          <h3 className="font-serif font-black text-lg text-white">
                            {editingItem ? "Edit Food Specifications" : "List New Food Catalog Spec"}
                          </h3>
                          <button onClick={() => setShowItemModal(false)} className="text-stone-550 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">Dish Title / Name *</label>
                            <input
                              type="text"
                              value={itemForm.name || ""}
                              onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="e.g., Spicy Jalapeño Zinger Burger"
                              className="w-full text-xs font-semibold bg-[#1a140f] border border-[#2d2217] text-white px-3 py-2 rounded-lg"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">Catalog Section / Cat *</label>
                              <select
                                value={itemForm.cat || ""}
                                onChange={e => setItemForm(f => ({ ...f, cat: e.target.value }))}
                                className="w-full text-xs bg-[#1a140f] border border-[#2d2217] text-white px-3 py-2 rounded-lg"
                              >
                                <option value="">-- Choose --</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">Cooking Retail Price *</label>
                              <input
                                type="number"
                                value={itemForm.price || ""}
                                onChange={e => setItemForm(f => ({ ...f, price: Number(e.target.value) }))}
                                placeholder="450"
                                className="w-full text-xs font-semibold bg-[#1a140f] border border-[#2d2217] text-white px-3 py-2 rounded-lg"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">Taste Description particulars (Ingredients info)</label>
                            <textarea
                              value={itemForm.desc || ""}
                              onChange={e => setItemForm(f => ({ ...f, desc: e.target.value }))}
                              placeholder="Crispy double fillet coated in home spices and sriracha drip"
                              rows={2}
                              className="w-full text-xs bg-[#1a140f] border border-[#2d2217] text-white px-3 py-2 rounded-lg resize-none"
                            />
                          </div>

                          {/* Quick checklist sliders */}
                          <div className="flex items-center gap-6 text-xs select-none">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-300">
                              <input
                                type="checkbox"
                                checked={!!itemForm.popular}
                                onChange={e => setItemForm(f => ({ ...f, popular: e.target.checked }))}
                                className="w-4 h-4 rounded bg-[#1a140f] border-[#2d2217]"
                              />
                              <span>Pop Seller Highlight ⭐</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-300">
                              <input
                                type="checkbox"
                                checked={!!itemForm.outOfStock}
                                onChange={e => setItemForm(f => ({ ...f, outOfStock: e.target.checked }))}
                                className="w-4 h-4 rounded bg-[#1a140f] border-[#2d2217]"
                              />
                              <span>Temporarily Out Of Stock 🚫</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          <button
                            onClick={() => setShowItemModal(false)}
                            className="flex-1 py-2.5 border border-[#2d2217] text-stone-400 hover:text-white rounded-lg text-xs font-semibold"
                          >
                            Discard
                          </button>
                          
                          <button
                            onClick={handleSaveItem}
                            className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0b0805] font-bold rounded-lg text-xs"
                          >
                            Synchronize Spec
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* MANAGE FILTER CATEGORIES TAB SECTION */}
              {adminTab === "categories" && (
                <div className="space-y-6">
                  {/* Category editor card header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#14100c] border border-[#231a10] p-4 rounded-xl">
                    <span className="text-stone-300 font-serif text-xs">
                      Active storefront tags: {categories.length} sections configured.
                    </span>

                    <button
                      onClick={() => {
                        setEditingCat(null);
                        setCatForm({ id: "", label: "" });
                        setShowCatModal(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-sans font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Create Custom Storefront Section</span>
                    </button>
                  </div>

                  {/* List of active editable client sections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => {
                      const count = menu.filter(item => item.cat === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="bg-[#15110c] border border-[#2c2012] p-5 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-serif font-black text-white text-base leading-none">
                              {cat.label}
                            </h4>
                            <span className="text-[10px] text-stone-500 tracking-wider font-mono uppercase mt-2.5 block">
                              Code: <strong className="text-amber-500 font-semibold lowercase">"{cat.id}"</strong> · {count} Items Linked
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCat(cat);
                                setCatForm({ ...cat });
                                setShowCatModal(true);
                              }}
                              className="p-1.5 bg-[#1d1610] border border-stone-850 text-stone-400 hover:text-white rounded-lg inline-flex items-center"
                              title="Edit Display Label text"
                            >
                              <Edit size={12} />
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 bg-neutral-900 border border-neutral-800 text-stone-500 hover:text-red-400 rounded-lg inline-flex items-center"
                              title="Delete storefront section"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CATEGORY FORM CONFIG MODAL */}
                  {showCatModal && (
                    <div className="fixed inset-0 z-[1020] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setShowCatModal(false)} />
                      <div className="relative bg-[#130f0a] border border-[#2e2417] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#211a12] pb-3">
                          <h3 className="font-serif font-black text-lg text-white">
                            {editingCat ? "Edit display section label" : "Create New storefront tab Section"}
                          </h3>
                          <button onClick={() => setShowCatModal(false)} className="text-stone-550 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">Display Label Name *</label>
                            <input
                              type="text"
                              value={catForm.label || ""}
                              onChange={e => setCatForm(f => ({ ...f, label: e.target.value, id: editingCat ? f.id : e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") }))}
                              placeholder="e.g., 🍦 Sweet Desserts"
                              className="w-full text-xs font-semibold bg-[#1a140f] border border-[#2d2217] text-white px-3 py-2 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">Unique Section ID *</label>
                            <input
                              type="text"
                              value={catForm.id || ""}
                              onChange={e => setCatForm(f => ({ ...f, id: e.target.value }))}
                              placeholder="e.g., desserts"
                              disabled={!!editingCat}
                              className="w-full text-xs font-semibold bg-[#1a140f] border border-[#2d2217] text-white px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          <button
                            onClick={() => setShowCatModal(false)}
                            className="flex-1 py-2.5 border border-[#2d2217] text-stone-400 hover:text-white rounded-lg text-xs font-semibold"
                          >
                            Discard
                          </button>
                          
                          <button
                            onClick={handleSaveCategory}
                            className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0b0805] font-bold rounded-lg text-xs"
                          >
                            Save Section Tag
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* CONFIGURATION SETTINGS TAB SECTION */}
              {adminTab === "settings" && (
                <div className="bg-[#120d09] border border-[#211a12] rounded-3xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-white">Interactive Website Details Specification</h3>
                    <p className="text-stone-500 text-xs mt-1">
                      Modify layout assets. All parameters will save instantly behind the scenes into local persistence.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">Kitchen Outlet Name</label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={e => handleSaveConfig({ name: e.target.value })}
                        placeholder="The Fry Factory"
                        className="w-full text-xs px-3 py-2 bg-[#1a1410] border border-[#3e2e1c] text-white rounded-lg focus:border-amber-505"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-550 uppercase block mb-1.5">Kitchen Tagline marketing subtitle</label>
                      <input
                        type="text"
                        value={config.tagline}
                        onChange={e => handleSaveConfig({ tagline: e.target.value })}
                        placeholder="Cloud Kitchen · Fresh · Fast · Delivered"
                        className="w-full text-xs px-3 py-2 bg-[#1a1410] border border-[#3e2e1c] text-stone-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-550 uppercase block mb-1.5">WhatsApp Outlet Business Phone</label>
                      <input
                        type="text"
                        value={config.whatsappNumber}
                        onChange={e => handleSaveConfig({ whatsappNumber: e.target.value })}
                        placeholder="923208203031"
                        className="w-full text-xs px-3 py-2 bg-[#1a1410] border border-[#3e2e1c] text-stone-200 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-550 uppercase block mb-1.5">Delivery Courier Charge fee</label>
                      <input
                        type="number"
                        value={config.deliveryCharge}
                        onChange={e => handleSaveConfig({ deliveryCharge: Number(e.target.value) })}
                        placeholder="150"
                        className="w-full text-xs px-3 py-2 bg-[#1a1410] border border-[#3e2e1c] text-stone-200 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-550 uppercase block mb-1.5">Minimum storefront order billing threshold</label>
                      <input
                        type="number"
                        value={config.minOrder}
                        onChange={e => handleSaveConfig({ minOrder: Number(e.target.value) })}
                        placeholder="300"
                        className="w-full text-xs px-3 py-2 bg-[#1a1410] border border-[#3e2e1c] text-stone-200 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-550 uppercase block mb-1.5">Chef Dashboard PIN Code *</label>
                      <input
                        type="password"
                        value={config.adminPin}
                        onChange={e => handleSaveConfig({ adminPin: e.target.value })}
                        placeholder="22041993"
                        className="w-full text-xs px-3 py-2 bg-[#1a1410] border border-[#3e2e1c] text-stone-200 rounded-lg font-mono"
                      />
                      <span className="text-[10px] text-stone-600 block mt-1">This PIN acts as locking authentication for client analytics metrics.</span>
                    </div>
                  </div>

                  <div className="border-t border-[#2a2013] pt-5 mt-5 flex justify-between items-center bg-[#17110a] p-4 rounded-2xl">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Restore Standard Factory Setup</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">Need to reset customized pricing catalog rules back to original starter lists?</p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm("Executing factory reset will purge all offline transaction orders, dynamic pricing and category modifications. Are you fully sure?")) {
                          localStorage.clear();
                          setConfig(DEFAULT_CONFIG);
                          setCategories(DEFAULT_CATS);
                          setMenu(DEFAULT_MENU);
                          setOrders([]);
                          setAdminAuthed(false);
                          showToast("Database fully reset to starter catalog parameters", "success");
                        }
                      }}
                      className="px-4 py-2 text-stone-400 hover:text-white bg-red-955 hover:bg-red-500/10 text-xs font-semibold rounded-lg border border-[#3d1515] transition"
                    >
                      Factory Reset System
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#211a12] bg-[#0d0905] py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded bg-stone-900 border border-stone-800 text-stone-400/80 text-xs flex items-center justify-center font-bold">
              🔥
            </span>
            <span className="text-xs text-stone-500 font-medium">
              © {new Date().getFullYear()} {config.name}. All customized parameters persist securely inside local storage sandbox.
            </span>
          </div>

          <div className="text-[11px] text-stone-500 font-mono">
            Outlet Coordinates: <strong className="text-amber-500/80">{config.whatsappNumber}</strong> · 30-45m Prompt Delivery Policy
          </div>
        </div>
      </footer>

    </div>
  );
}
