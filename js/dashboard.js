// js/dashboard.js
import { auth } from './Firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const displayNameEl = document.getElementById('displayName');
const emailEl = document.getElementById('userEmail');
const uidEl = document.getElementById('userUid');
const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, user => {
  if(user){
    displayNameEl.textContent = user.displayName || 'No name';
    emailEl.textContent = user.email;
    uidEl.textContent = `UID: ${user.uid}`;
    // Load user-specific data later (reports etc.)
  } else {
    // Not logged in — force back to the landing
    window.location.href = 'index.html';
  }
});

logoutBtn.addEventListener('click', async ()=>{
  await signOut(auth);
  window.location.href = 'index.html';
});
