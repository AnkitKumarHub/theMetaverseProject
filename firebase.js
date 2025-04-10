// Import the Firebase SDK
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARG_AvHHdzX5UWxB9PXpb7DIFKQdGItqA",
  authDomain: "metaverse-d25f6.firebaseapp.com",
  projectId: "metaverse-d25f6",
  storageBucket: "metaverse-d25f6.firebasestorage.app",
  messagingSenderId: "854997077705",
  appId: "1:854997077705:web:9114f8b3530daf728a0718",
  measurementId: "G-G5X922E8JW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export required modules
export { 
  db, 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
};
export default app;