import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuZ-icql4Jdncye3LsPG2jW45q8F6il-0",
  authDomain: "cryptotracker-6b802.firebaseapp.com",
  projectId: "cryptotracker-6b802",
  storageBucket: "cryptotracker-6b802.firebasestorage.app",
  messagingSenderId: "772045778005",
  appId: "1:772045778005:web:971be38597c56868fdf8dc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
