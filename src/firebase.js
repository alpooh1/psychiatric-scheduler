import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDrnufSK97OIC4XxvaGJII7XdeHVemr3-Y",
    authDomain: "pttime-2a7cb.firebaseapp.com",
    // Inferred database URL for standard Fireabse projects. 
    // If this doesn't work, it might be 'https://pttime-2a7cb.firebaseio.com' (legacy)
    databaseURL: "https://pttime-2a7cb-default-rtdb.firebaseio.com",
    projectId: "pttime-2a7cb",
    storageBucket: "pttime-2a7cb.firebasestorage.app",
    messagingSenderId: "79594609284",
    appId: "1:79594609284:web:b40bd8de172db88ac000d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
