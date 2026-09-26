import { initializeApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
setLogLevel('silent');
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0448860491",
  appId: "1:961047932943:web:37f75ef7e233af793cb37a",
  apiKey: "AIzaSyATomHQp7H5ZNcTHM60_-lKLp2sf6GD8oY",
  authDomain: "gen-lang-client-0448860491.firebaseapp.com",
  storageBucket: "gen-lang-client-0448860491.firebasestorage.app",
  messagingSenderId: "961047932943",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-lightsouttattoo-90b14bb6-c7cf-4eb6-b802-d3995a38347e");
export const auth = getAuth(app);

export const authenticateAdminSilently = async () => {
  console.log("Using public access mode. No anonymous auth required.");
};
