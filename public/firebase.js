// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC12N3XA6kMCmii7CspFJ2EIDtC_6ZwZ0",
    authDomain: "naviweb-6c495.firebaseapp.com",
    projectId: "naviweb-6c495",
    storageBucket: "naviweb-6c495.firebasestorage.app",
    messagingSenderId: "1088027671105",
    appId: "1:1088027671105:web:27203dcc8a6666429364c0",
    measurementId: "G-3ZTYGT63Y6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export the Auth instance
export { auth };
