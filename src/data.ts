import { MenuItem, Category, KitchenConfig } from "./types";

export const DEFAULT_MENU: MenuItem[] = [
  { id: "1", name: "Classic Smash Burger", cat: "burgers", price: 450, desc: "Double smashed patty, special sauce, pickles & crisp lettuce", popular: true },
  { id: "2", name: "Double Smash Burger", cat: "burgers", price: 650, desc: "Two smashed patties, cheddar cheese, caramelized onions", popular: false },
  { id: "3", name: "Crispy Chicken Burger", cat: "burgers", price: 490, desc: "Crispy fried chicken fillet, coleslaw, sriracha mayo", popular: true },
  { id: "4", name: "BBQ Mushroom Burger", cat: "burgers", price: 520, desc: "Beef patty, smoky BBQ sauce, grilled mushrooms", popular: false },
  { id: "5", name: "Zinger Wrap", cat: "wraps", price: 380, desc: "Spicy zinger fillet, jalapeños, garlic sauce in a soft tortilla", popular: false },
  { id: "6", name: "BBQ Chicken Wrap", cat: "wraps", price: 360, desc: "Grilled chicken, BBQ sauce, fresh crunchy veggies", popular: false },
  { id: "7", name: "Classic Shawarma", cat: "wraps", price: 320, desc: "Marinated chicken, garlic sauce, pickles & fries rolled in", popular: true },
  { id: "8", name: "Chicken Biryani", cat: "rice", price: 350, desc: "Fragrant basmati with tender chicken, served with cooling raita", popular: true },
  { id: "9", name: "Beef Biryani", cat: "rice", price: 420, desc: "Slow-cooked spiced beef on aromatic basmati, raita & salad", popular: false },
  { id: "10", name: "Chicken Fried Rice", cat: "rice", price: 300, desc: "Wok-tossed basmati with chicken, eggs and vegetables", popular: false },
  { id: "11", name: "Family Deal", cat: "deals", price: 1800, desc: "4 Smash Burgers + 4 Crispy Fries + 4 Cold Drinks — feeds 4!", popular: true },
  { id: "12", name: "Couple Deal", cat: "deals", price: 1100, desc: "2 Burgers of choice + 2 Fries + 2 Cold Drinks", popular: false },
  { id: "13", name: "Student Deal", cat: "deals", price: 650, desc: "1 Burger + 1 Fries + 1 Drink — best value!", popular: true },
  { id: "14", name: "Crispy Fries", cat: "sides", price: 180, desc: "Golden crispy fries seasoned perfectly, served with ketchup", popular: false },
  { id: "15", name: "Loaded Fries", cat: "sides", price: 320, desc: "Fries piled with cheese sauce, jalapeños & spring onions", popular: true },
  { id: "16", name: "Cold Drink (Can)", cat: "drinks", price: 80, desc: "Pepsi, 7Up, or Mirinda — your choice", popular: false },
  { id: "17", name: "Fresh Lemon Soda", cat: "drinks", price: 120, desc: "Fresh lemon, mint syrup, chilled soda water", popular: false },
];

export const DEFAULT_CATS: Category[] = [
  { id: "burgers", label: "🍔 Burgers" },
  { id: "wraps", label: "🌯 Wraps" },
  { id: "rice", label: "🍛 Rice" },
  { id: "deals", label: "🎁 Deals" },
  { id: "sides", label: "🍟 Sides" },
  { id: "drinks", label: "🥤 Drinks" },
];

export const DEFAULT_CONFIG: KitchenConfig = {
  name: "The Fry Factory",
  tagline: "Cloud Kitchen · Fresh · Fast · Delivered",
  adminPin: "22041993",
  whatsappNumber: "923208203031",
  deliveryCharge: 150,
  minOrder: 300,
};
