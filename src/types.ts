export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  cat: string;
  price: number;
  popular: boolean;
  outOfStock?: boolean;
}

export interface Category {
  id: string;
  label: string;
}

export interface KitchenConfig {
  name: string;
  tagline: string;
  adminPin: string;
  whatsappNumber: string;
  deliveryCharge: number;
  minOrder: number;
}

export interface OrderItem {
  id?: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    type: "delivery" | "pickup";
    notes?: string;
  };
  items: OrderItem[];
  total: number;
  deliveryCharge: number;
  status: "new" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled";
  time: string;
}
