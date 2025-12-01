// js/auth.js
// Wait until firebase is initialized (listens to event dispatched by firebase.js)
function onFirebaseReady(cb) {
  if (window.auth && window.db) return cb();
  window.addEventListener('firebaseReady', () => cb());
}

// Helper: show message
function showAuthMessage(text, type = 'info') {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.className = 'mt-4 p-2 rounded text-sm';
  if (type === 'error') el.classList.add('bg-red-600');
  else if (type === 'success') el.classList.add('bg-green-600');
  else el.classList.add('bg-white/10');
  el.textContent = text;
  el.classList.remove('hidden');
}

onFirebaseReady(() => {
  // Elements
  const loginForm = document.getElementById('loginForm');

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        showAuthMessage('Please enter email and password', 'error');
        return;
      }

      try {
        showAuthMessage('Signing in...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
        showAuthMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => { location.href = 'dashboard.html'; }, 600);
      } catch (err) {
        console.error('Login error', err);
        showAuthMessage(err.message || 'Login failed', 'error');
      }
    });
  }
// --------------------
// SIGNUP HANDLING
// --------------------
onFirebaseReady(() => {
  const signupForm = document.getElementById('signupForm');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('signupUsername').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value.trim();
      const about = document.getElementById('signupAbout').value.trim();
      const location = document.getElementById('signupLocation').value.trim();
      const photoFile = document.getElementById('signupPhoto').files[0];

      const msgEl = document.getElementById('signupMessage');
      function showSignupMsg(txt, type='info') {
        msgEl.className = "mt-4 p-2 rounded text-sm";
        if (type === 'error') msgEl.classList.add('bg-red-600');
        else if (type === 'success') msgEl.classList.add('bg-green-600');
        else msgEl.classList.add('bg-white/10');
        msgEl.textContent = txt;
        msgEl.classList.remove('hidden');
      }

      try {
        showSignupMsg("Creating your account...");

        // STEP 1: Create Firebase Auth user
        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCred.user.uid;

        let photoURL = "";
        // STEP 2: Upload profile photo if selected
        if (photoFile) {
          const path = `profiles/${uid}/${Date.now()}`;
          const upload = await storage.ref(path).put(photoFile);
          photoURL = await upload.ref.getDownloadURL();
        }

        // STEP 3: Create user document in Firestore
        await db.collection("users").doc(uid).set({
          username,
          email,
          about,
          location,
          photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lostCount: 0,
          foundCount: 0,
          rankPoints: 0
        });

        showSignupMsg("Account created! Redirecting...", "success");

        setTimeout(() => {
          location.href = "dashboard.html";
        }, 800);

      } catch (err) {
        console.error(err);
        showSignupMsg(err.message, "error");
      }
    });
  }
});

  // Auth state listener (global)
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      window.currentUser = user;
      // optionally load user profile doc into window.currentProfile
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) window.currentProfile = userDoc.data();
      } catch (e) {
        console.warn('Could not load profile', e);
      }
    } else {
      window.currentUser = null;
      window.currentProfile = null;
      // If on a protected page that is not index.html or signup.html, redirect to login
      const protectedPages = ['dashboard.html','report.html','history-lost.html','history-found.html','profile.html','match-chat.html'];
      const path = location.pathname.split('/').pop();
      if (protectedPages.includes(path)) {
        location.href = 'index.html';
      }
    }
  });
});
