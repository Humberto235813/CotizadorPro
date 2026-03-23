/* Script para corregir URLs de logos con dominio erroneo (.firebasestorage.app) y reemplazarlas por .appspot.com */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Config tomaría las env de Vite; ajustar si se ejecuta fuera de bundler
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async () => {
  const companiesCol = collection(db, 'companies');
  const snap = await getDocs(companiesCol);
  let updates = 0;
  for (const d of snap.docs) {
    const data = d.data() as any;
    if (data.logo && typeof data.logo === 'string' && data.logo.includes('.firebasestorage.app')) {
      const fixed = data.logo.replace('.firebasestorage.app', '.appspot.com');
      if (fixed !== data.logo) {
        await updateDoc(doc(db, 'companies', d.id), { logo: fixed });
        updates++;
        console.log('Actualizado logo de', d.id);
      }
    }
  }
  console.log('Corrección terminada. Total actualizados:', updates);
})();
