// js/firebase-config.js
// Replace the firebaseConfig object below with the values from your Firebase console (web app)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpwwJoR1eH8cqgxeMvYBbhhzQKQGwau3E",
  authDomain: "catchy-app-7b123.firebaseapp.com",
  projectId: "catchy-app-7b123",
  storageBucket: "catchy-app-7b123.firebasestorage.app",
  messagingSenderId: "561394228740",
  appId: "1:561394228740:web:99084bc70412ce0d271f51",
  measurementId: "G-LQ0M07C8MM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
