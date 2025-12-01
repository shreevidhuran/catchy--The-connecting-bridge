// js/main.js (make sure index.html loads it as type="module")
import { auth, googleProvider } from './Firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// UI elements (same ids as Stage 1)
const authForm = document.getElementById('authForm');
const signInToggle = document.getElementById('signinToggle');
const heroSignup = document.getElementById('hero-signup');
const googleBtn = document.getElementById('googleBtn');

let isSignInMode = false;

function setFormMode(signIn){
  isSignInMode = signIn;
  const submitBtn = authForm.querySelector('button[type="submit"]');
  submitBtn.textContent = signIn ? 'Sign in' : 'Create account';
  signInToggle.textContent = signIn ? "Don't have an account? Create" : "Already have an account? Sign in";
  document.getElementById('username').closest('label').style.display = signIn ? 'none' : 'block';
}

signInToggle.addEventListener('click', ()=> setFormMode(!isSignInMode));
heroSignup.addEventListener('click', ()=> setFormMode(false));
document.getElementById('btn-create').addEventListener('click', ()=> setFormMode(false));
document.getElementById('btn-signin').addEventListener('click', ()=> setFormMode(true));

// Sign up / Sign in form handler
authForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value.trim() || '';

  if(!email || !password){
    alert('Please enter email and password.');
    return;
  }

  try {
    if(isSignInMode){
      // Sign in
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will redirect to dashboard
    } else {
      // Create account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if(username) {
        await updateProfile(userCredential.user, { displayName: username });
      }
      // onAuthStateChanged will redirect to dashboard
    }
  } catch (err) {
    console.error(err);
    alert(err.message || 'Authentication error');
  }
});

// Google Sign-in
googleBtn.addEventListener('click', async ()=>{
  try {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged will redirect to dashboard
  } catch (err) {
    console.error(err);
    alert(err.message || 'Google sign-in error');
  }
});

// If user is already logged in, redirect to dashboard
onAuthStateChanged(auth, user => {
  if(user){
    // logged in
    window.location.href = 'dashboard.html';
  } else {
    // not logged in — stay on index
    // You could hide/show UI here if needed
    setFormMode(false); // default
  }
});
