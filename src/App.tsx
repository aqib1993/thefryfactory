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
import { isConfigured } from "./firebase";
import { 
  syncConfig, 
  saveConfigInCloud, 
  syncCategories, 
  saveCategoryInCloud, 
  deleteCategoryInCloud, 
  syncMenu, 
  saveMenuItemInCloud, 
  deleteMenuItemInCloud, 
  syncOrders, 
  saveOrderInCloud, 
  deleteOrderInCloud 
} from "./dbSync";

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

  // --- GOOGLE FIREBASE REAL-TIME SYNCHRONIZATION ---
  useEffect(() => {
    if (!isConfigured) return;

    let unsubConfig = () => {};
    let unsubCats = () => {};
    let unsubMenu = () => {};
    let unsubOrders = () => {};

    const setupSync = async () => {
      unsubConfig = await syncConfig((data) => setConfig(data));
      unsubCats = await syncCategories((data) => setCategories(data));
      unsubMenu = await syncMenu((data) => setMenu(data));
      unsubOrders = await syncOrders((data) => setOrders(data));
    };

    setupSync();

    return () => {
      unsubConfig();
      unsubCats();
      unsubMenu();
      unsubOrders();
    };
  }, []);

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

  // Synchronize/migrate states to remove any generic leftovers and sync with DEFAULT_MENU
  useEffect(() => {
    if (menu.length === 0) return;

    let updatedAny = false;
    const existingIds = DEFAULT_MENU.map(d => d.id);
    
    // Find filtered out items to delete in cloud
    const toDelete = menu.filter(item => !existingIds.includes(item.id));
    if (toDelete.length > 0 && isConfigured) {
      toDelete.forEach(item => {
        deleteMenuItemInCloud(item.id);
      });
    }

    const filteredMenu = menu.filter(item => existingIds.includes(item.id));
    
    const updatedMenu = filteredMenu.map(item => {
      const defaultItem = DEFAULT_MENU.find(d => d.id === item.id);
      if (defaultItem) {
        if (item.name !== defaultItem.name || item.desc !== defaultItem.desc || item.price !== defaultItem.price) {
          updatedAny = true;
          const merged = { ...item, name: defaultItem.name, desc: defaultItem.desc, price: defaultItem.price };
          if (isConfigured) {
            saveMenuItemInCloud(merged);
          }
          return merged;
        }
      }
      return item;
    });

    // Append any missing items from the default menu card recipe spec
    const missingItems = DEFAULT_MENU.filter(d => !menu.some(m => m.id === d.id));
    if (missingItems.length > 0) {
      updatedAny = true;
      updatedMenu.push(...missingItems);
      if (isConfigured) {
        missingItems.forEach(item => {
          saveMenuItemInCloud(item);
        });
      }
    }

    if (updatedAny || menu.length !== updatedMenu.length) {
      setMenu(updatedMenu);
      localStorage.setItem("kitchen_menu", JSON.stringify(updatedMenu));
    }
  }, [menu]);

  // Synchronize/migrate categories to remove generic listings and sync with DEFAULT_CATS
  useEffect(() => {
    if (categories.length === 0) return;

    let updatedAny = false;
    const defaultCatIds = DEFAULT_CATS.map(c => c.id);

    // Delete categories that are not in default lists
    const toDeleteCats = categories.filter(cat => !defaultCatIds.includes(cat.id));
    if (toDeleteCats.length > 0 && isConfigured) {
      toDeleteCats.forEach(cat => {
        deleteCategoryInCloud(cat.id);
      });
    }

    const filteredCats = categories.filter(cat => defaultCatIds.includes(cat.id));

    const updatedCats = filteredCats.map(cat => {
      const defaultCat = DEFAULT_CATS.find(d => d.id === cat.id);
      if (defaultCat && cat.label !== defaultCat.label) {
        updatedAny = true;
        const merged = { ...cat, label: defaultCat.label };
        if (isConfigured) {
          saveCategoryInCloud(merged);
        }
        return merged;
      }
      return cat;
    });

    // Add missing default categories
    const missingCats = DEFAULT_CATS.filter(d => !categories.some(c => c.id === d.id));
    if (missingCats.length > 0) {
      updatedAny = true;
      updatedCats.push(...missingCats);
      if (isConfigured) {
        missingCats.forEach(cat => {
          saveCategoryInCloud(cat);
        });
      }
    }

    if (updatedAny || categories.length !== updatedCats.length) {
      setCategories(updatedCats);
      localStorage.setItem("kitchen_categories", JSON.stringify(updatedCats));
    }
  }, [categories]);

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
    
    if (isConfigured) {
      saveOrderInCloud(newOrder);
    }
    
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
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, status: nextStatus };
        if (isConfigured) {
          saveOrderInCloud(updated);
        }
        return updated;
      }
      return o;
    }));
    showToast(`Order status updated to ${nextStatus.toUpperCase()}`, "success");
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order record?")) {
      setOrders(prev => prev.filter(o => o.id !== id));
      if (isConfigured) {
        deleteOrderInCloud(id);
      }
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
      const updatedItem: MenuItem = { 
        ...editingItem, 
        name: itemForm.name!,
        desc: itemForm.desc || "",
        cat: itemForm.cat!,
        price: Number(itemForm.price),
        popular: !!itemForm.popular,
        outOfStock: !!itemForm.outOfStock
      };
      setMenu(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
      if (isConfigured) {
        saveMenuItemInCloud(updatedItem);
      }
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
      if (isConfigured) {
        saveMenuItemInCloud(newItem);
      }
      showToast(`Successfully added "${itemForm.name}" to the menu!`, "success");
    }
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({ name: "", desc: "", cat: "", price: 0, popular: false, outOfStock: false });
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm("Are you sure you want to completely remove this item from your online menu?")) {
      setMenu(prev => prev.filter(i => i.id !== id));
      if (isConfigured) {
        deleteMenuItemInCloud(id);
      }
      showToast("Menu item permanently removed");
    }
  };

  const handleTogglePopular = (item: MenuItem) => {
    const updated = { ...item, popular: !item.popular };
    setMenu(prev => prev.map(i => i.id === item.id ? updated : i));
    if (isConfigured) {
      saveMenuItemInCloud(updated);
    }
    showToast(`Popular badge updated for "${item.name}"`);
  };

  const handleToggleStock = (item: MenuItem) => {
    const updated = { ...item, outOfStock: !item.outOfStock };
    setMenu(prev => prev.map(i => i.id === item.id ? updated : i));
    if (isConfigured) {
      saveMenuItemInCloud(updated);
    }
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
      const updatedCat: Category = { id: cleanId, label: catForm.label! };
      setCategories(prev => prev.map(c => c.id === editingCat.id ? updatedCat : c));
      // Update item association categories
      setMenu(prev => prev.map(item => item.cat === editingCat.id ? { ...item, cat: cleanId } : item));
      
      if (isConfigured) {
        saveCategoryInCloud(updatedCat);
        // Also update any menu item categorized under this in the cloud
        menu.forEach(item => {
          if (item.cat === editingCat.id) {
            saveMenuItemInCloud({ ...item, cat: cleanId });
          }
        });
      }
      showToast(`Category updated to "${catForm.label}"`);
    } else {
      if (categories.find(c => c.id === cleanId)) {
        showToast("Category ID already exists!", "error");
        return;
      }
      const newCat: Category = { id: cleanId, label: catForm.label! };
      setCategories(prev => [...prev, newCat]);
      if (isConfigured) {
        saveCategoryInCloud(newCat);
      }
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
    if (isConfigured) {
      deleteCategoryInCloud(id);
    }
    showToast("Category removed successfully");
  };

  // General Kitchen config operations
  const handleSaveConfig = (fields: Partial<KitchenConfig>) => {
    const updated = { ...config, ...fields };
    setConfig(updated);
    if (isConfigured) {
      saveConfigInCloud(updated);
    }
    showToast("Kitchen configurations synchronized", "success");
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
      text: "#C5221F", 
      bg: "#FCE8E6", 
      border: "#FAD2CF", 
      nextStatus: "accepted", 
      nextLabel: "Accept Order ✓" 
    },
    accepted: { 
      label: "Accepted", 
      text: "#B06000", 
      bg: "#FEF3D6", 
      border: "#FDE293", 
      nextStatus: "preparing", 
      nextLabel: "Start Cooking 👨‍🍳" 
    },
    preparing: { 
      label: "Preparing", 
      text: "#1A5276", 
      bg: "#E8F0FE", 
      border: "#C2DBFA", 
      nextStatus: "ready", 
      nextLabel: "Mark Ready for Handoff 🔔" 
    },
    ready: { 
      label: "Ready", 
      text: "#137333", 
      bg: "#E6F4EA", 
      border: "#CEEAD6", 
      nextStatus: "delivered", 
      nextLabel: "Deliver Order ✓" 
    },
    delivered: { 
      label: "Delivered", 
      text: "#5F6368", 
      bg: "#F1F3F4", 
      border: "#E8EAED", 
      nextStatus: null, 
      nextLabel: "" 
    },
    cancelled: { 
      label: "Cancelled", 
      text: "#C5221F", 
      bg: "#FCE8E6", 
      border: "#FAD2CF",
      nextStatus: null,
      nextLabel: ""
    }
  };

  return (
    <div className="bg-[#F8F9FA] text-[#1F2937] font-sans min-h-screen selection:bg-[#EA580C]/10 selection:text-[#EA580C] transition-all duration-300">
      
      {/* GLOBAL NOTIFICATION TOAST */}
      {adminMessage && (
        <div className={`fixed top-4 right-4 z-[999] px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md border transition-all duration-300 animate-bounce ${
          adminMessage.type === "success" 
            ? "bg-[#E6F4EA] border-[#B7E1CD] text-[#137333]" 
            : "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
        }`}>
          {adminMessage.type === "success" ? <CheckCircle size={18} className="text-[#137333]" /> : <AlertCircle size={18} className="text-[#C5221F]" />}
          <span className="font-semibold text-xs sm:text-sm">{adminMessage.text}</span>
        </div>
      )}

      {/* FIXED FRONTEND NAVBAR */}
      <nav className="sticky top-0 z-[100] border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("customer")}>
            <div className="w-10 h-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-black text-xl shadow-[0_4px_16px_rgba(234,88,12,0.25)] ring-1 ring-orange-400">
              🍟
            </div>
            <div>
              <h2 className="font-serif font-black text-xl tracking-tight text-neutral-900 flex items-center gap-1.5 leading-none">
                {config.name}
              </h2>
              <span className="text-[10px] text-[#EA580C] font-mono tracking-widest uppercase block mt-1 font-bold">
                {config.tagline.split("·")[0] || "THE INVENTORY"}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {view === "customer" ? (
              <>
                <button
                  onClick={() => setView("admin")}
                  className="px-4 py-2.5 text-xs font-bold rounded-lg text-neutral-600 border border-neutral-300/80 bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-900 duration-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Lock size={12} className="text-[#EA580C]" />
                  <span>Chef Dashboard</span>
                  {orders.filter(o => o.status === "new").length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setCartOpen(true)}
                  className="px-4 py-2.5 text-xs font-bold bg-[#EA580C] hover:bg-[#c2410c] active:scale-95 text-white rounded-lg flex items-center gap-2 duration-150 shadow-md shadow-[#EA580C]/10 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span className="hidden sm:inline font-bold">Cart</span>
                  <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                    {cartItemCount}
                  </span>
                  {cartItemCount > 0 && (
                    <span className="font-mono font-bold block border-l border-white/20 pl-1.5">
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
                className="px-4 py-2.5 text-xs font-bold rounded-lg text-[#EA580C] border border-[#EA580C]/25 bg-[#EA580C]/5 hover:bg-[#EA580C]/10 duration-150 flex items-center gap-2"
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
          {/* BANNER GREETING HERO (THE FRY FACTORY THEME) */}
          <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-br from-orange-50/40 via-white to-neutral-50 border-b border-neutral-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="max-w-4xl mx-auto relative text-center">
              <span className="text-[11px] font-mono tracking-widest text-orange-600 bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 uppercase font-black inline-block shadow-sm">
                🔥 Sizzling Hot Burgers & Fresh Hand-Cut Fries
              </span>
              <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl text-neutral-900 tracking-tight mt-6 mb-4 leading-tight">
                Welcome to <br className="hidden sm:inline" />
                <span className="text-orange-600">The Fry Factory</span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto mb-8 leading-relaxed font-sans font-medium">
                We prepare everything order-by-order using premium quality oil, freshly smashed grain-fed beef, and tender local farm chicken!
              </p>

              {/* Dynamic Info Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-neutral-700">
                <span className="px-3.5 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-sm text-xs font-semibold flex items-center gap-1.5">
                  🚴 Delivery Fee: <strong className="text-orange-600">{Rs(config.deliveryCharge)}</strong>
                </span>
                <span className="px-3.5 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-sm text-xs font-semibold flex items-center gap-1.5">
                  ⏱ Promise: <strong className="text-orange-600">30–45 Mins</strong>
                </span>
                <span className="px-3.5 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-sm text-xs font-semibold flex items-center gap-1.5">
                  📦 Min Order: <strong className="text-orange-600">{Rs(config.minOrder)}</strong>
                </span>
                <span className="px-3.5 py-1.5 rounded-lg bg-white border border-orange-100 shadow-sm text-xs font-semibold flex items-center gap-1.5">
                  ⭐ Top Rated Location: <strong className="text-orange-600">DHA Phase 1 Karachi</strong>
                </span>
              </div>
            </div>
          </section>

          {/* THE INVENTORY FACTORY PROTOCOLS BACKGROUND */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <h2 className="text-xs font-extrabold uppercase text-neutral-400 font-sans tracking-widest mb-4">ACTIVE OFFERS & PROTOCOLS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              <div className="bg-orange-500/5 border border-orange-500/15 rounded-2xl p-5 flex items-start gap-4 shadow-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md shadow-orange-600/20">
                  %
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-none">10% FLAT OFF</h4>
                  <p className="text-sm font-bold text-neutral-900 mt-1">Sizzling Discount Applied Automatically!</p>
                  <span className="text-[11px] text-orange-600 font-bold block mt-1.5">No coupon codes or tricks — valid across the entire menu list!</span>
                </div>
              </div>
              <div className="bg-neutral-100/50 border border-neutral-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-none">100% FRESH SQUAD</h4>
                  <p className="text-sm font-bold text-neutral-900 mt-1">Real Ingredients Only</p>
                  <span className="text-[11px] text-neutral-600 font-normal block mt-1.5">Zero pre-cooked patties. We smash and sear on sizzling metal grills only after you lock the order.</span>
                </div>
              </div>
            </div>
          </section>

          {/* DYNAMIC CATEGORY PICKER & FILTER PANEL */}
          <section className="sticky top-[72px] sm:top-[72px] z-50 py-4 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm mt-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Category buttons tab */}
              <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <button
                  onClick={() => setActiveCat("all")}
                  className={`px-4 py-2 rounded-full text-xs font-bold border duration-150 cursor-pointer whitespace-nowrap ${
                    activeCat === "all" 
                      ? "bg-orange-600 border-orange-600 text-white font-black shadow-md shadow-orange-600/10" 
                      : "bg-[#F3F4F6] hover:bg-neutral-200 border-neutral-200 text-neutral-700"
                  }`}
                >
                  🍽 All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border duration-150 cursor-pointer whitespace-nowrap ${
                      activeCat === cat.id 
                        ? "bg-orange-600 border-orange-600 text-white font-black shadow-md shadow-orange-600/10" 
                        : "bg-[#F3F4F6] hover:bg-neutral-200 border-neutral-200 text-neutral-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Search Box */}
              <div className="w-full md:w-72 relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Query burgers, fries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 text-neutral-800 pl-9 pr-4 py-2.5 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder:text-neutral-400 transition"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <X size={12} />
                  </button>
                )}
              </div>

            </div>
          </section>

          {/* CATALOG DISPLAY ELEMENT */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl max-w-xl mx-auto shadow-sm">
                <HelpCircle size={44} className="mx-auto text-neutral-300 mb-4" />
                <h3 className="font-serif font-black text-lg text-neutral-800">No Food Items Match Filter</h3>
                <p className="text-neutral-500 text-xs mt-2 px-10 leading-relaxed font-sans">
                  There are currently no items available under this category. Contact us for custom cooking slots!
                </p>
                <button
                  onClick={() => { setActiveCat("all"); setSearchQuery(""); }}
                  className="mt-6 px-5 py-2.5 bg-orange-600 text-white hover:bg-orange-700 text-xs font-bold rounded-xl shadow-md shadow-orange-600/10 duration-150"
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
                      className={`relative flex flex-col justify-between bg-white border rounded-2xl p-5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.05)] duration-205 transition group text-left ${
                        item.outOfStock ? "border-neutral-200 opacity-70" : "border-neutral-200/75"
                      }`}
                    >
                      {/* Popular/Out-of-Stock Badges */}
                      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
                        {item.popular && (
                          <span className="px-2.5 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-extrabold border border-orange-100 shadow-sm uppercase tracking-wide">
                            Pop Seller⭐
                          </span>
                        )}
                        {item.outOfStock && (
                          <span className="px-2.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-bold border border-neutral-200 shadow-sm uppercase tracking-wide">
                            Kitchen Out 🚫
                          </span>
                        )}
                      </div>

                      {/* Header Item info */}
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-orange-600 font-mono tracking-wider block uppercase mb-1">
                          {categories.find(c => c.id === item.cat)?.label || item.cat}
                        </span>
                        <h3 className="font-serif font-extrabold text-lg text-neutral-900 group-hover:text-orange-600 transition mb-1.5 duration-150">
                          {item.name}
                        </h3>
                        <p className="text-xs text-neutral-500 leading-relaxed font-sans mb-4 min-h-[40px]">
                          {item.desc || "Prepared freshly on-demand with premium oils & clean local spices."}
                        </p>
                      </div>

                      {/* Price tag & add-to-cart layout controls */}
                      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-2">
                        <div className="font-sans text-lg font-black text-orange-600">
                          {Rs(item.price)}
                        </div>

                        {item.outOfStock ? (
                          <span className="text-[11px] font-bold text-neutral-400 font-mono py-1.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                            Out of Stock
                          </span>
                        ) : !currCartItem ? (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 duration-100 cursor-pointer"
                          >
                            + Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl p-1">
                            <button
                              onClick={() => handleUpdateItemQty(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-orange-600 hover:text-white hover:bg-orange-600 rounded-lg duration-100 font-bold cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold text-neutral-800 w-5 text-center font-mono">
                              {currCartItem.qty}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-7 h-7 flex items-center justify-center text-orange-600 hover:text-white hover:bg-orange-600 rounded-lg duration-100 font-bold cursor-pointer"
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
                    <div className="p-5 border-t border-neutral-200/60 bg-neutral-50/50 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span>Items Subtotal</span>
                          <span className="font-mono text-neutral-800 font-bold">{Rs(cartSubtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span>Delivery Fee (Estimate)</span>
                          <span className="font-mono text-neutral-800 font-bold">{Rs(config.deliveryCharge)}</span>
                        </div>
                        {cartSubtotal < config.minOrder && (
                          <div className="text-[10px] text-orange-600 bg-orange-100/50 px-2.5 py-1.5 rounded-lg border border-orange-200 flex items-center gap-1.5">
                            <AlertCircle size={12} className="text-orange-600" />
                            <span>Add {Rs(config.minOrder - cartSubtotal)} more to satisfy minimum threshold!</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-neutral-800">
                        <span className="font-sans font-extrabold text-sm">Grand Total</span>
                        <span className="font-sans font-black text-lg text-orange-600 font-mono">{Rs(cartSubtotal + config.deliveryCharge)}</span>
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
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/15 cursor-pointer"
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
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                onClick={() => setCheckoutOpen(false)}
              />
              <div className="relative bg-white border border-neutral-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
                  <h2 className="font-serif font-black text-xl text-neutral-900">Review & Complete Order</h2>
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center hover:bg-neutral-200"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Delivery vs Self-pickup selector bar */}
                  <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 border border-neutral-200 rounded-xl text-xs font-bold font-sans">
                    <button
                      onClick={() => setCheckoutForm(f => ({ ...f, type: "delivery" }))}
                      className={`py-2 rounded-lg duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        checkoutForm.type === "delivery" 
                          ? "bg-orange-600 text-white font-black shadow-md shadow-orange-600/10" 
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      🚴 Delivery (At Address)
                    </button>
                    <button
                      onClick={() => setCheckoutForm(f => ({ ...f, type: "pickup" }))}
                      className={`py-2 rounded-lg duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        checkoutForm.type === "pickup" 
                          ? "bg-orange-600 text-white font-black shadow-md shadow-orange-600/10" 
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      🏃 Self-Pickup (Hot slots)
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Aqib Ahmed"
                        value={checkoutForm.name}
                        onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 inline-block outline-none text-left"
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-[#C5221F] flex items-center gap-1 mt-1 font-bold">
                          <AlertCircle size={10} /> {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                        WhatsApp Contact Phone *
                      </label>
                      <input
                        type="text"
                        placeholder="03001234567"
                        value={checkoutForm.phone}
                        onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-orange-550 focus:ring-1 focus:ring-orange-500 inline-block outline-none text-left"
                      />
                      {formErrors.phone && (
                        <p className="text-[11px] text-[#C5221F] flex items-center gap-1 mt-1 font-bold">
                          <AlertCircle size={10} /> {formErrors.phone}
                        </p>
                      )}
                    </div>

                    {checkoutForm.type === "delivery" && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                          Detailed House Address *
                        </label>
                        <textarea
                          placeholder="House No, Area, Near landmark, City"
                          value={checkoutForm.address}
                          onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))}
                          rows={2}
                          className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none text-left"
                        />
                        {formErrors.address && (
                          <p className="text-[11px] text-[#C5221F] flex items-center gap-1 mt-1 font-bold">
                            <AlertCircle size={10} /> {formErrors.address}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                        Order Notes / Special Requests (Optional)
                      </label>
                      <textarea
                        placeholder="No pickles, extra napkins, spicy mayo etc."
                        value={checkoutForm.notes}
                        onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                        rows={1}
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none text-left"
                      />
                    </div>
                  </div>

                  {/* Bill Outline Receipt */}
                  <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 space-y-3 font-sans text-xs">
                    <span className="text-[10px] font-black text-neutral-500 uppercase font-mono tracking-wide block">
                      Total Checkout Receipt
                    </span>
                    <div className="max-h-24 overflow-y-auto pr-1 divide-y divide-neutral-200/60 text-left">
                      {cart.map(item => (
                        <div key={item.id} className="py-1.5 flex items-center justify-between text-neutral-700">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-mono font-bold text-neutral-800">{Rs(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-neutral-200 pt-2 space-y-1.5 text-left">
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>Food Subtotal</span>
                        <span className="font-mono font-bold text-neutral-800">{Rs(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>Delivery Fee</span>
                        <span className="font-mono font-bold text-neutral-800">{Rs(deliveryCharge)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-neutral-800 font-extrabold pt-1">
                        <span>Grand Cash Amount</span>
                        <span className="font-mono text-orange-600 font-black text-sm sm:text-base">{Rs(cartGrandTotal)}</span>
                      </div>
                    </div>
                    {formErrors.cart && (
                      <div className="text-[10px] text-[#C5221F] bg-[#FCE8E6] border border-[#FAD2CF] p-2 rounded mt-2 text-left font-bold">
                        {formErrors.cart}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCheckoutOpen(false)}
                      className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-305 text-neutral-600 hover:text-neutral-900 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-[2] py-3 bg-orange-600 hover:bg-orange-700 text-[#fff] font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/15 hover:shadow-orange-700/30 transition active:scale-95 duration-150 cursor-pointer"
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
              <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-md" />
              <div className="relative bg-white border border-neutral-200 rounded-3xl w-full max-w-md p-6 sm:p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-5 shadow-sm">
                  🎉
                </div>
                
                <h2 className="font-serif font-black text-2xl text-neutral-900 mb-1.5 animate-bounce">
                  Order Registered Successfully!
                </h2>
                <p className="text-xs text-orange-600 font-mono font-bold tracking-wide">
                  Order Ticket Code: #{confirmedOrder.id}
                </p>

                <p className="text-neutral-500 text-xs sm:text-sm my-4 px-3 leading-relaxed">
                  Hi <strong className="text-neutral-800 font-bold">{confirmedOrder.customer.name}</strong>, your order has been queued in our kitchen. Let's send the slip via WhatsApp for instant processing!
                </p>

                {/* Receipt Preview */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-6 text-left text-xs divide-y divide-neutral-200/70 space-y-2">
                  <div className="pb-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Kitchen Queue Slip</span>
                    <div className="mt-1 font-semibold space-y-1 text-neutral-700">
                      {confirmedOrder.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span>{i.qty}x {i.name}</span>
                          <span className="font-mono text-[11px] font-bold text-neutral-800">{Rs(i.price * i.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-left">
                    <div className="flex justify-between text-neutral-500 text-[11px]">
                      <span>Cooking Method</span>
                      <span className="capitalize font-bold text-neutral-705">{confirmedOrder.customer.type}</span>
                    </div>
                    {confirmedOrder.deliveryCharge > 0 && (
                      <div className="flex justify-between text-neutral-500 text-[11px] mt-0.5">
                        <span>Courier Delivery</span>
                        <span className="font-mono font-bold text-neutral-800">{Rs(confirmedOrder.deliveryCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-800 font-extrabold text-sm mt-1.5 border-t border-neutral-100 pt-1.5">
                      <span>Total Invoice</span>
                      <span className="font-mono text-orange-600 font-black">{Rs(confirmedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={getWhatsAppMessageUrl(confirmedOrder)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-black text-xs rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                  >
                    {/* Raw Phone call or WhatsApp SVG */}
                    <Phone size={14} />
                    <span>Send Order to WhatsApp Manager</span>
                  </a>
                  
                  <button
                    onClick={() => setConfirmedOrder(null)}
                    className="w-full py-2.5 bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 font-bold text-xs rounded-xl transition cursor-pointer"
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
              <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center shadow-2xl relative">
                <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center text-xl mx-auto mb-6 shadow-sm">
                  <Lock size={20} />
                </div>
                
                <h2 className="font-serif font-black text-2xl text-neutral-900 mb-2">Kitchen Dashboard Access</h2>
                <p className="text-neutral-500 text-xs mb-6 px-10 leading-relaxed">
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
                      className="w-full text-center text-xl tracking-[0.4em] bg-neutral-50 border border-neutral-200 text-orange-600 py-3 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-black"
                      maxLength={12}
                    />
                    {pinError && (
                      <p className="text-red-600 text-xs font-semibold mt-2 flex items-center gap-1 justify-center">
                        <AlertCircle size={11} className="text-[#C5221F]" /> Pin Code is incorrect. Try again!
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleAdminVerify}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl transition duration-150 cursor-pointer shadow-md shadow-orange-600/15"
                  >
                    Authenticate PIN & Open Dashboard
                  </button>
                  
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-[11px] text-neutral-500 text-left mt-4">
                    💡 <strong>Quick Notes:</strong> Default system PIN is configured as <span className="text-orange-600 font-bold">22041993</span>. You can modify this inside the Settings tab once you log in. No external code compilation is required!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* ADMIN VIEW HEADER */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
                <div>
                  <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-neutral-900">
                    Cloud Kitchen Control Panel
                  </h1>
                  <p className="text-neutral-500 text-xs mt-1">
                    Direct live controls to modify prices, add food items, update stock & coordinate kitchen orders!
                  </p>
                </div>

                {/* Tab Switcher Actions */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 border border-neutral-200/80 rounded-xl self-stretch md:self-auto text-xs font-bold">
                  <button
                    onClick={() => setAdminTab("orders")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "orders" ? "bg-orange-600 text-white font-black shadow-sm" : "text-neutral-500 hover:text-neutral-850"
                    }`}
                  >
                    <Activity size={12} />
                    <span>Live Queue ({orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length})</span>
                  </button>
                  <button
                    onClick={() => setAdminTab("menu")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "menu" ? "bg-orange-600 text-white font-black shadow-sm" : "text-neutral-500 hover:text-neutral-850"
                    }`}
                  >
                    <Package size={12} />
                    <span>Catalog Items ({menu.length})</span>
                  </button>
                  <button
                    onClick={() => setAdminTab("categories")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "categories" ? "bg-orange-600 text-white font-black shadow-sm" : "text-neutral-500 hover:text-neutral-850"
                    }`}
                  >
                    <Layers size={12} />
                    <span>Edit Categories</span>
                  </button>
                  <button
                    onClick={() => setAdminTab("settings")}
                    className={`px-3 py-2 rounded-lg duration-150 flex items-center gap-1.5 cursor-pointer ${
                      adminTab === "settings" ? "bg-orange-600 text-white font-black shadow-sm" : "text-neutral-500 hover:text-neutral-850"
                    }`}
                  >
                    <Settings size={12} />
                    <span>Configuration Settings</span>
                  </button>
                </div>
              </div>

              {/* REAL-TIME METRICS & ANALYTICS BAR */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 text-left">
                <div className="bg-white border border-neutral-200 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <Coins size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wide block">Gross Sales</span>
                    <strong className="text-sm font-black text-emerald-600 font-mono block mt-0.5">{Rs(grossSalesSum)}</strong>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <BarChart4 size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wide block">Delivered Ticket</span>
                    <strong className="text-sm font-black text-neutral-805 font-mono block mt-0.5">{deliveredOrders.length} Completed</strong>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wide block">Avg Bill</span>
                    <strong className="text-sm font-black text-orange-600 font-mono block mt-0.5">{Rs(avgOrderValue)}</strong>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                    <Activity size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wide block">Active Queue</span>
                    <strong className="text-sm font-black text-neutral-800 font-mono block mt-0.5">{orders.filter(o => ["new", "accepted", "preparing", "ready"].includes(o.status)).length} Orders</strong>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-4 rounded-xl flex items-center gap-3 col-span-1 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-105 flex items-center justify-center">
                    <Trash2 size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wide block">Cancelled Ticket</span>
                    <strong className="text-sm font-black text-red-600 font-mono block mt-0.5">{orders.filter(o => o.status === "cancelled").length} ({Rs(cancelledLossSum)})</strong>
                  </div>
                </div>

                <div className="bg-white border border-[#E9D5FF] p-4 rounded-xl flex items-center gap-3 col-span-1 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wide block">Top Seller Food</span>
                    <strong className="text-xs font-black text-purple-700 block truncate mt-0.5" title={`${bestSellerName} (${bestSellerQty}x)`}>
                      {bestSellerName.split(" ").slice(0, 2).join(" ")} ({bestSellerQty}x)
                    </strong>
                  </div>
                </div>
              </div>

              {/* LIVE QUEUE TAB SECTION */}
              {adminTab === "orders" && (
                <div className="space-y-6">
                  
                  {/* Query filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
                    {/* Status filter tabs */}
                    <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold w-full sm:w-auto">
                      {[{ id: "all", l: "All" }, { id: "new", l: "New" }, { id: "accepted", l: "Accepted" }, { id: "preparing", l: "Cooking" }, { id: "ready", l: "Ready" }, { id: "delivered", l: "Delivered" }, { id: "cancelled", l: "Cancelled" }].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setOrdersFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg duration-150 cursor-pointer ${
                            ordersFilter === tab.id 
                              ? "bg-orange-50 border border-orange-200 text-orange-650 font-black" 
                              : "text-neutral-500 hover:text-neutral-800 border border-transparent"
                          }`}
                        >
                          {tab.l} ({tab.id === "all" ? orders.length : orders.filter(o => o.status === tab.id).length})
                        </button>
                      ))}
                    </div>

                    {/* Order visual lookup box */}
                    <div className="w-full sm:w-64 relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search ID, customer name..."
                        value={orderQuery}
                        onChange={e => setOrderQuery(e.target.value)}
                        className="w-full text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 pl-8 pr-3 py-1.5 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Orders list map */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-neutral-200 rounded-2xl max-w-xl mx-auto shadow-sm">
                      <FileText size={36} className="mx-auto text-neutral-300 mb-3" />
                      <h4 className="font-serif font-black text-base text-neutral-800">No Orders Fit Filter Queue</h4>
                      <p className="text-neutral-500 text-xs mt-1">There are no orders matching active criteria in client storage.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {filteredOrders.map(order => {
                        const statusConfig = STATUS_CONFIGS[order.status];
                        return (
                          <div
                            key={order.id}
                            className={`flex flex-col justify-between bg-white border rounded-2xl overflow-hidden transition text-left ${
                              order.status === "new" ? "border-orange-500 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20" : "border-neutral-200 shadow-sm"
                            }`}
                          >
                            {/* Order mini banner */}
                            <div className="px-4 py-2.5 flex items-center justify-between text-xs" style={{ backgroundColor: statusConfig.bg }}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-neutral-800 px-2 py-0.5 rounded bg-white/60">
                                  #{order.id}
                                </span>
                                <span className="px-2 py-0.5 rounded font-extrabold text-[10px] uppercase border" style={{ color: statusConfig.text, borderColor: statusConfig.border, backgroundColor: "rgba(255,255,255,0.85)" }}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <span className="text-neutral-600 font-mono font-bold flex items-center gap-1">
                                <Clock size={11} className="text-neutral-500" /> {timeAgo(order.time)}
                              </span>
                            </div>

                            {/* Details body */}
                            <div className="p-4 sm:p-5 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                               {/* Customer metadata */}
                               <div className="space-y-2">
                                 <span className="text-[9px] uppercase font-bold tracking-widest text-orange-600 block">Handoff Delivery Info</span>
                                <div className="space-y-1">
                                  <div className="text-neutral-800 font-black text-sm flex items-center gap-1.5">
                                    <User size={13} className="text-orange-500" />
                                    <span>{order.customer.name}</span>
                                  </div>
                                  <div className="text-neutral-600 font-mono text-xs flex items-center gap-1.5 hover:text-orange-600 duration-100">
                                    <Phone size={13} className="text-neutral-400" />
                                    <a href={`tel:${order.customer.phone}`} className="underline font-bold">{order.customer.phone}</a>
                                  </div>
                                  {order.customer.type === "delivery" && order.customer.address && (
                                    <div className="text-neutral-600 font-medium text-xs flex items-start gap-1.5 mt-1">
                                      <MapPin size={13} className="text-neutral-400 shrink-0 mt-0.5" />
                                      <span className="leading-tight">{order.customer.address}</span>
                                    </div>
                                  )}
                                  {order.customer.notes && (
                                    <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-2.5 text-[11px] text-orange-850 font-bold tracking-wide mt-2 block">
                                      📝 <strong>Notes:</strong> "{order.customer.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Selected food items */}
                              <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-neutral-100 sm:pl-4 pt-4 sm:pt-0">
                                <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 block">Food Items Ordered</span>
                                <div className="space-y-1 text-xs">
                                  {order.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-neutral-600">
                                      <span>{it.qty}x <strong className="text-neutral-800 font-bold">{it.name}</strong></span>
                                      <span className="font-mono text-[11px] font-bold text-neutral-850">{Rs(it.price * it.qty)}</span>
                                    </div>
                                  ))}
                                  {order.deliveryCharge > 0 && (
                                    <div className="flex justify-between items-center text-neutral-400 pt-1 text-[11px]">
                                      <span>🚴 Delivery Fee</span>
                                      <span className="font-mono font-bold text-neutral-500">{Rs(order.deliveryCharge)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-neutral-800 font-black text-sm border-t border-neutral-100 pt-2 mt-1.5">
                                    <span>Total Invoice</span>
                                    <span className="font-mono text-orange-600 font-black">{Rs(order.total)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Direct queue status transiting button links */}
                            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {statusConfig.nextStatus && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, statusConfig.nextStatus!)}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 font-bold text-[11px] text-white rounded-lg duration-150 transition select-none cursor-pointer shadow-sm"
                                  >
                                    {statusConfig.nextLabel}
                                  </button>
                                )}
                                {order.status === "new" && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-105 font-bold text-[11px] text-red-650 border border-red-150 rounded-lg duration-150 transition cursor-pointer"
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
                                  className="p-1.5 px-2 px-3 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 font-black text-[10px] rounded-lg duration-150 flex items-center gap-1"
                                  title="Share order layout ticket with delivery driver"
                                >
                                  📨 WhatsApp Slip
                                </a>
                                
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-2 bg-neutral-100 border border-neutral-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-neutral-500 rounded-lg duration-150 transition cursor-pointer"
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
                    <div className="text-neutral-500 font-bold text-xs">
                      Showing All {menu.length} Items Listed in Storefront
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setItemForm({ name: "", desc: "", cat: categories[0]?.id || "", price: 0, popular: false, outOfStock: false });
                        setShowItemModal(true);
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white active:scale-95 duration-100 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/10"
                    >
                      <Plus size={14} />
                      <span>Manually Add New Dish</span>
                    </button>
                  </div>

                  {/* Catalog management items list */}
                  <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 font-bold text-[10px] uppercase tracking-wider">
                            <th className="py-4 px-6">Dish Name</th>
                            <th className="py-4 px-4">Menu Section</th>
                            <th className="py-4 px-4">Cooking Price</th>
                            <th className="py-4 px-4">Catalog Status</th>
                            <th className="py-4 px-6 text-right">Settings Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-150">
                          {menu.map(item => (
                            <tr key={item.id} className="hover:bg-neutral-50/60 duration-100">
                              {/* Item details */}
                              <td className="py-4 px-6">
                                <div className="text-neutral-800 font-bold">{item.name}</div>
                                <div className="text-neutral-500 text-[11px] max-w-sm truncate mt-1">{item.desc || "No custom description cataloged."}</div>
                              </td>
                              {/* Category association */}
                              <td className="py-4 px-4 text-neutral-600 font-medium">
                                <span className="bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                  {categories.find(c => c.id === item.cat)?.label || item.cat}
                                </span>
                              </td>
                              {/* Price */}
                              <td className="py-4 px-4 text-orange-600 font-mono font-black tracking-wide">
                                {Rs(item.price)}
                              </td>
                              {/* Indicators markup */}
                              <td className="py-4 px-4 space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleTogglePopular(item)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                                    item.popular 
                                      ? "bg-orange-50 border-orange-200 text-orange-600" 
                                      : "bg-white border-neutral-200 text-neutral-400 hover:text-neutral-600"
                                  }`}
                                  title="Toggle 'Popular Highlight' badge card on storefront"
                                >
                                  {item.popular ? "★ Popular" : "☆ Standard"}
                                </button>

                                <button
                                  onClick={() => handleToggleStock(item)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                                    item.outOfStock 
                                      ? "bg-red-50 border-red-200 text-red-650" 
                                      : "bg-emerald-50 border-emerald-100 text-[#137333] hover:opacity-75"
                                  }`}
                                  title="Mark dish as In-Stock vs Out-Of-Stock"
                                >
                                  {item.outOfStock ? "🚫 Out" : "✓ In-Stock"}
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
                                  className="p-2 bg-neutral-50 border border-neutral-200 hover:border-orange-250/30 hover:bg-orange-50 text-neutral-500 hover:text-orange-600 rounded-lg inline-flex items-center duration-150 cursor-pointer shadow-sm"
                                  title="Edit full particulars"
                                >
                                  <Edit size={12} />
                                </button>

                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="p-2 bg-neutral-50 border border-neutral-200 hover:border-red-200 hover:bg-red-50 text-neutral-500 hover:text-red-650 rounded-lg inline-flex items-center duration-150 cursor-pointer shadow-sm"
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
                      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
                      <div className="relative bg-white border border-neutral-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                          <h3 className="font-serif font-black text-lg text-neutral-900">
                            {editingItem ? "Edit Food Specifications" : "List New Food Catalog Spec"}
                          </h3>
                          <button onClick={() => setShowItemModal(false)} className="text-neutral-400 hover:text-neutral-700 cursor-pointer">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Dish Title / Name *</label>
                            <input
                              type="text"
                              value={itemForm.name || ""}
                              onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="e.g., Spicy Jalapeño Zinger Burger"
                              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Catalog Section / Cat *</label>
                              <select
                                value={itemForm.cat || ""}
                                onChange={e => setItemForm(f => ({ ...f, cat: e.target.value }))}
                                className="w-full text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:bg-white focus:border-orange-500"
                              >
                                <option value="">-- Choose --</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Cooking Retail Price *</label>
                              <input
                                type="number"
                                value={itemForm.price || ""}
                                onChange={e => setItemForm(f => ({ ...f, price: Number(e.target.value) }))}
                                placeholder="450"
                                className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Taste Description particulars (Ingredients info)</label>
                            <textarea
                              value={itemForm.desc || ""}
                              onChange={e => setItemForm(f => ({ ...f, desc: e.target.value }))}
                              placeholder="Crispy double fillet coated in home spices and sriracha drip"
                              rows={2}
                              className="w-full text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg resize-none outline-none focus:bg-white focus:border-orange-500"
                            />
                          </div>

                          {/* Quick checklist sliders */}
                          <div className="flex items-center gap-6 text-xs select-none">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-600">
                              <input
                                type="checkbox"
                                checked={!!itemForm.popular}
                                onChange={e => setItemForm(f => ({ ...f, popular: e.target.checked }))}
                                className="accent-orange-650"
                              />
                              <span>Pop Seller Highlight ⭐</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-600">
                              <input
                                type="checkbox"
                                checked={!!itemForm.outOfStock}
                                onChange={e => setItemForm(f => ({ ...f, outOfStock: e.target.checked }))}
                                className="accent-orange-650"
                              />
                              <span>Temporarily Out Of Stock 🚫</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          <button
                            onClick={() => setShowItemModal(false)}
                            className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-150 text-neutral-600 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Discard
                          </button>
                          
                          <button
                            onClick={handleSaveItem}
                            className="flex-[2] py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-orange-600/10"
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
                    <span className="text-neutral-500 font-bold text-xs">
                      Active storefront tags: {categories.length} sections configured.
                    </span>

                    <button
                      onClick={() => {
                        setEditingCat(null);
                        setCatForm({ id: "", label: "" });
                        setShowCatModal(true);
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-sans font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/10"
                    >
                      <Plus size={14} />
                      <span>Create Custom Storefront Section</span>
                    </button>
                  </div>

                  {/* List of active editable client sections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                    {categories.map(cat => {
                      const count = menu.filter(item => item.cat === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="bg-white border border-neutral-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition"
                        >
                          <div>
                            <h4 className="font-serif font-black text-neutral-900 text-base leading-none">
                              {cat.label}
                            </h4>
                            <span className="text-[10px] text-neutral-400 tracking-wider font-mono uppercase mt-2.5 block">
                              Code: <strong className="text-orange-600 font-bold lowercase">"{cat.id}"</strong> · {count} Items Linked
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                  setEditingCat(cat);
                                  setCatForm({ ...cat });
                                  setShowCatModal(true);
                              }}
                              className="p-2 bg-neutral-50 border border-neutral-200 hover:border-orange-250/30 hover:bg-orange-50 text-neutral-500 hover:text-orange-600 rounded-lg inline-flex items-center cursor-pointer duration-100"
                              title="Edit Display Label text"
                            >
                              <Edit size={12} />
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 bg-neutral-50 border border-neutral-200 hover:border-red-200 hover:bg-red-50 text-neutral-500 hover:text-red-650 rounded-lg inline-flex items-center cursor-pointer duration-100"
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
                      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowCatModal(false)} />
                      <div className="relative bg-white border border-neutral-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-left">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                          <h3 className="font-serif font-black text-lg text-neutral-900">
                            {editingCat ? "Edit display section label" : "Create New storefront tab Section"}
                          </h3>
                          <button onClick={() => setShowCatModal(false)} className="text-neutral-400 hover:text-neutral-700 cursor-pointer">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Display Label Name *</label>
                            <input
                              type="text"
                              value={catForm.label || ""}
                              onChange={e => setCatForm(f => ({ ...f, label: e.target.value, id: editingCat ? f.id : e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") }))}
                              placeholder="e.g., 🍦 Sweet Desserts"
                              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Unique Section ID *</label>
                            <input
                              type="text"
                              value={catForm.id || ""}
                              onChange={e => setCatForm(f => ({ ...f, id: e.target.value }))}
                              placeholder="e.g., desserts"
                              disabled={!!editingCat}
                              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-250 text-neutral-800 px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed outline-none focus:bg-white focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          <button
                            onClick={() => setShowCatModal(false)}
                            className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-150 text-neutral-600 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Discard
                          </button>
                          
                          <button
                            onClick={handleSaveCategory}
                            className="flex-[2] py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-orange-600/10"
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
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-sm">
                  <div>
                    <h3 className="font-serif font-black text-xl text-neutral-900">Interactive Website Details Specification</h3>
                    <p className="text-neutral-500 text-xs mt-1">
                      Modify layout assets. All parameters will save instantly behind the scenes into local and cloud persistence.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Kitchen Outlet Name</label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={e => handleSaveConfig({ name: e.target.value })}
                        placeholder="The Fry Factory"
                        className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Kitchen Tagline marketing subtitle</label>
                      <input
                        type="text"
                        value={config.tagline}
                        onChange={e => handleSaveConfig({ tagline: e.target.value })}
                        placeholder="Cloud Kitchen · Fresh · Fast · Delivered"
                        className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">WhatsApp Outlet Business Phone</label>
                      <input
                        type="text"
                        value={config.whatsappNumber}
                        onChange={e => handleSaveConfig({ whatsappNumber: e.target.value })}
                        placeholder="923208203031"
                        className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg font-mono outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Delivery Courier Charge fee</label>
                      <input
                        type="number"
                        value={config.deliveryCharge}
                        onChange={e => handleSaveConfig({ deliveryCharge: Number(e.target.value) })}
                        placeholder="150"
                        className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg font-mono outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Minimum storefront order billing threshold</label>
                      <input
                        type="number"
                        value={config.minOrder}
                        onChange={e => handleSaveConfig({ minOrder: Number(e.target.value) })}
                        placeholder="300"
                        className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg font-mono outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Chef Dashboard PIN Code *</label>
                      <input
                        type="password"
                        value={config.adminPin}
                        onChange={e => handleSaveConfig({ adminPin: e.target.value })}
                        placeholder="22041993"
                        className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 border border-neutral-200 text-neutral-850 rounded-lg font-mono outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-[10px] text-neutral-400 font-medium block mt-1">This PIN acts as locking authentication for client analytics metrics.</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-5 mt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-red-50/40 p-5 rounded-2xl border border-red-100">
                    <div>
                      <h4 className="text-sm font-black text-red-900">Restore Standard Factory Setup</h4>
                      <p className="text-[11px] text-neutral-550 mt-0.5">Need to reset customized pricing catalog rules back to original starter lists?</p>
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
                      className="px-4 py-2 text-red-650 hover:text-white bg-white hover:bg-red-650 text-xs font-bold rounded-xl border border-red-200 hover:border-red-650 cursor-pointer transition duration-150"
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
      <footer className="border-t border-neutral-200 bg-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-orange-600 text-white text-base flex items-center justify-center font-bold shadow-md shadow-orange-600/10">
              🍟
            </span>
            <div className="text-left">
              <h5 className="text-xs font-black text-neutral-800 leading-none">{config.name}</h5>
              <span className="text-[10px] text-neutral-400 font-semibold mt-1 block">
                © {new Date().getFullYear()} Real-time Smart Checkout Outlet Sandbox.
              </span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 font-bold font-mono bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-150">
            Outlet Support: <strong className="text-orange-600 font-black">{config.whatsappNumber}</strong> · 30-45 mins Prompt Delivery Rule
          </div>
        </div>
      </footer>

    </div>
  );
}
