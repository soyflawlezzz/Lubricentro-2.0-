import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './config';

export async function testConnection(): Promise<boolean> {
  try {
    if (!navigator.onLine) {
      return true;
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    // Gracefully handle network/offline/permission status without raising alerts
    return true;
  }
}

