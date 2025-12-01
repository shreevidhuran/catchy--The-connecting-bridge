// js/firebase.js
// ----------------------
// Paste your Firebase config below (replace the placeholders)
// Go to Firebase Console -> Project Settings -> Your apps -> Config
// ----------------------

const firebaseConfig = {
  apiKey: "AIzaSyBpwwJoR1eH8cqgxeMvYBbhhzQKQGwau3E",
  authDomain: "catchy-app-7b123.firebaseapp.com",
  projectId: "catchy-app-7b123",
  storageBucket: "catchy-app-7b123.firebasestorage.app",
  messagingSenderId: "561394228740",
  appId: "1:561394228740:web:99084bc70412ce0d271f51",
  measurementId: "G-LQ0M07C8MM"
};

// Load Firebase (compat) SDK via script injection to keep files simple
(function loadFirebase() {
  const base = 'https://www.gstatic.com/firebasejs/9.23.0/';
  const scripts = [
    base + 'firebase-app-compat.js',
    base + 'firebase-auth-compat.js',
    base + 'firebase-firestore-compat.js',
    base + 'firebase-storage-compat.js'
  ];

  let loaded = 0;
  function tryInit() {
    if (++loaded === scripts.length) {
      firebase.initializeApp(firebaseConfig);
      window.auth = firebase.auth();
      window.db = firebase.firestore();
      window.storage = firebase.storage();
      console.log('✅ Firebase initialized');
      // dispatch event so other scripts can wait
      window.dispatchEvent(new Event('firebaseReady'));
    }
  }

  scripts.forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = tryInit;
    s.onerror = (e) => console.error('Failed to load', src, e);
    document.head.appendChild(s);
  });
})();
