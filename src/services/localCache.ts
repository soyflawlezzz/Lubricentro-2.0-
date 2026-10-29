import { Client, Vehicle } from '../types';

const DB_NAME = 'LubricentroLocalCache';
const DB_VERSION = 1;
const STORE_CLIENTS = 'clients';
const STORE_VEHICLES = 'vehicles';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CLIENTS)) {
        db.createObjectStore(STORE_CLIENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VEHICLES)) {
        db.createObjectStore(STORE_VEHICLES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves cached clients from IndexedDB instantly
 */
export async function getCachedClients(): Promise<Client[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CLIENTS, 'readonly');
      const store = tx.objectStore(STORE_CLIENTS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result as Client[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading clients from IndexedDB cache:', err);
    return [];
  }
}

/**
 * Saves or updates clients in IndexedDB cache
 */
export async function saveCachedClients(clients: Client[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CLIENTS, 'readwrite');
    const store = tx.objectStore(STORE_CLIENTS);

    // Clear and refill with latest snapshot
    store.clear();
    for (const client of clients) {
      if (client && client.id) {
        store.put(client);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error writing clients to IndexedDB cache:', err);
  }
}

/**
 * Retrieves cached vehicles from IndexedDB instantly
 */
export async function getCachedVehicles(): Promise<Vehicle[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VEHICLES, 'readonly');
      const store = tx.objectStore(STORE_VEHICLES);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result as Vehicle[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading vehicles from IndexedDB cache:', err);
    return [];
  }
}

/**
 * Saves or updates vehicles in IndexedDB cache
 */
export async function saveCachedVehicles(vehicles: Vehicle[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VEHICLES, 'readwrite');
    const store = tx.objectStore(STORE_VEHICLES);

    // Clear and refill with latest snapshot
    store.clear();
    for (const vehicle of vehicles) {
      if (vehicle && vehicle.id) {
        store.put(vehicle);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error writing vehicles to IndexedDB cache:', err);
  }
}
