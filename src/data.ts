import { MenuItem, Category, KitchenConfig } from "./types";

export const DEFAULT_MENU: MenuItem[] = [
  // --- APPETIZERS (Factory Creation) ---
  { id: "app-1", name: "Factory Fries", cat: "appetizers", price: 333, desc: "Crispy golden golden fries, perfectly textured and seasoned to factory standards.", popular: true },
  { id: "app-2", name: "THE CRUNCH PROTOTYPE", cat: "appetizers", price: 666, desc: "Ultra crunchy appetizer prototype engineered for maximal texture, crunch, and bold flavor.", popular: true },

  // --- MAIN COURSE (Burgers & Chicken) ---
  { id: "mc-1", name: "CREAMY CARGO", cat: "main_course", price: 889, desc: "A juicy beef patty,cheese,rich creamy mushroom souce.", popular: true },
  { id: "mc-2", name: "THE NUT & JOLT", cat: "main_course", price: 1199, desc: "A juicy beef patty,signature creamy peanut butter sauce ,", popular: false },
  { id: "mc-3", name: "THE FOUNDATION(OG)", cat: "main_course", price: 888, desc: "A juicy beef patty,cheese,sweet caramelized oniens.", popular: true },
  { id: "mc-4", name: "PRODUCTION OVERLOAD", cat: "main_course", price: 1515, desc: "Three juicy smashed beef patties,three cheese,rich secret sauce.", popular: true },
  { id: "mc-5", name: "THE MEAT FOUNDARY", cat: "main_course", price: 999, desc: "A juicy smashed patty,Cheese,sauce,and beef perpooni.", popular: false },
  { id: "mc-6", name: "THE TURBO CRUNCH", cat: "main_course", price: 888, desc: "Chicken,tight,fresh brioche bun, cheese, rich secret sauce.", popular: true },
  { id: "mc-7", name: "THE GALVANIZED BIRD", cat: "main_course", price: 999, desc: "Tight chicken tossed in Nashville spicy oil, creamy sauce,coleslaw.", popular: true },
  { id: "mc-8", name: "THE SCAFFOLDING", cat: "main_course", price: 1313, desc: "Double crispy chicken patties, iceberg, cheese, sauce.", popular: false },
  { id: "mc-9", name: "THE SHORT CIRCUIT", cat: "main_course", price: 999, desc: "Tight chicken,iceberg,cheese, het honey glaze, and mild sauce.", popular: false },
  { id: "mc-10", name: "THE PROTOTYPE", cat: "main_course", price: 1111, desc: "Tight chicken,cheese,mortadella and lava mayo.", popular: false },

  // --- DRINKS ---
  { id: "dr-1", name: "SOFT DRINKS", cat: "drinks", price: 150, desc: "Chilled canned soda (Pepsi, Coca-Cola, Sprite, or Fanta).", popular: false },
  { id: "dr-2", name: "WATER", cat: "drinks", price: 80, desc: "Pure, cooling, chilled mineral bottle water.", popular: false },

  // --- DIPS ---
  { id: "dp-1", name: "HONEY MUSTARD", cat: "dips", price: 100, desc: "Factory crafted sweet and tangy honey dipping sauce.", popular: false },
  { id: "dp-2", name: "CREAMY GARLIC SAUCE", cat: "dips", price: 100, desc: "Creamy garlic reduction sauce, extremely aromatic and velvety.", popular: false },
  { id: "dp-3", name: "CHILI MAYO", cat: "dips", price: 100, desc: "Spiced mayo dip seasoned with selected spicy notes.", popular: false },
  { id: "dp-4", name: "LAVA MAYO", cat: "dips", price: 100, desc: "Fiery hot signature lava mayo dip for extreme heat lovers.", popular: false },
  { id: "dp-5", name: "Factory secret sauce", cat: "dips", price: 150, desc: "The elite secret recipe sauce straight from the kitchen lab.", popular: true },

  // --- EXTRAS ---
  { id: "ex-1", name: "Cheese", cat: "extras", price: 100, desc: "Extra slice of melty cheddar cheese.", popular: false },
  { id: "ex-2", name: "Jalapenos", cat: "extras", price: 100, desc: "Farm-fresh sliced fiery pickled jalapeños.", popular: false }
];

export const DEFAULT_CATS: Category[] = [
  { id: "appetizers", label: "🍟 Appetizers" },
  { id: "main_course", label: "🍔 Main Course" },
  { id: "drinks", label: "🥤 Drinks" },
  { id: "dips", label: "🍯 Dips" },
  { id: "extras", label: "🧀 Extras" },
];

export const DEFAULT_CONFIG: KitchenConfig = {
  name: "The Fry Factory",
  tagline: "The Inventory · Heavy Burgers · Fast · Delivered",
  adminPin: "22041993",
  whatsappNumber: "923016618300",
  deliveryCharge: 150,
  minOrder: 300,
};
