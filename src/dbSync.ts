import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import { db, isConfigured, OperationType, handleFirestoreError } from './firebase';
import { MenuItem, Category, KitchenConfig, Order } from './types';
import { DEFAULT_MENU, DEFAULT_CATS, DEFAULT_CONFIG } from './data';

// --- CONFIG SYNC ---
export async function syncConfig(onUpdate: (config: KitchenConfig) => void): Promise<() => void> {
  if (!isConfigured || !db) return () => {};

  const docRef = doc(db, 'configs', 'kitchen');

  try {
    // Check if configuration already exists in the cloud
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // Seed initial default config if blank
      await setDoc(docRef, DEFAULT_CONFIG);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'configs/kitchen');
  }

  // Real-time listener for configurations
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as KitchenConfig);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'configs/kitchen');
  });

  return unsubscribe;
}

export async function saveConfigInCloud(config: KitchenConfig): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'configs', 'kitchen');
  try {
    await setDoc(docRef, config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'configs/kitchen');
  }
}

// --- CATEGORIES SYNC ---
export async function syncCategories(onUpdate: (cats: Category[]) => void): Promise<() => void> {
  if (!isConfigured || !db) return () => {};

  const colRef = collection(db, 'categories');

  try {
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default categories
      const batch = writeBatch(db);
      DEFAULT_CATS.forEach((cat) => {
        const docRef = doc(db, 'categories', cat.id);
        batch.set(docRef, cat);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'categories');
  }

  const unsubscribe = onSnapshot(colRef, (querySnap) => {
    const list: Category[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as Category);
    });
    // Sort so it order matches sequence if needed or keep raw
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'categories');
  });

  return unsubscribe;
}

export async function saveCategoryInCloud(cat: Category): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'categories', cat.id);
  try {
    await setDoc(docRef, cat);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `categories/${cat.id}`);
  }
}

export async function deleteCategoryInCloud(id: string): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'categories', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
  }
}

// --- MENU SYNC ---
export async function syncMenu(onUpdate: (items: MenuItem[]) => void): Promise<() => void> {
  if (!isConfigured || !db) return () => {};

  const colRef = collection(db, 'menu');

  try {
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default foods
      const batch = writeBatch(db);
      DEFAULT_MENU.forEach((item) => {
        const docRef = doc(db, 'menu', item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'menu');
  }

  const unsubscribe = onSnapshot(colRef, (querySnap) => {
    const list: MenuItem[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as MenuItem);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'menu');
  });

  return unsubscribe;
}

export async function saveMenuItemInCloud(item: MenuItem): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'menu', item.id);
  try {
    await setDoc(docRef, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `menu/${item.id}`);
  }
}

export async function deleteMenuItemInCloud(id: string): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'menu', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
  }
}

// --- ORDERS SYNC ---
export async function syncOrders(onUpdate: (orders: Order[]) => void): Promise<() => void> {
  if (!isConfigured || !db) return () => {};

  const colRef = collection(db, 'orders');

  const unsubscribe = onSnapshot(colRef, (querySnap) => {
    const list: Order[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as Order);
    });
    // Sort from newest to oldest
    list.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'orders');
  });

  return unsubscribe;
}

export async function saveOrderInCloud(order: Order): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'orders', order.id);
  try {
    await setDoc(docRef, order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
  }
}

export async function deleteOrderInCloud(id: string): Promise<void> {
  if (!isConfigured || !db) return;
  const docRef = doc(db, 'orders', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
  }
}
