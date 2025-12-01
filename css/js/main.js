// js/main.js (Firebase auth integration)
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  const authForm = document.getElementById('authForm');
  const signInToggle = document.getElementById('signinToggle');
  const heroSignup = document.getElementById('hero-signup');
  const googleBtn = document.getElementById('googleBtn');
  const btnCreate = document.getElementById('btn-create');
  const btnSignin = document.getElementById('btn-signin');

  let isSignInMode = false;

  function setFormMode(signIn) {
    isSignInMode = signIn;
    const submitBtn = authForm.querySelector('button[type="submit"]');
    submitBtn.textContent = signIn ? 'Sign in' : 'Create account';
    signInToggle.textContent = signIn ? "Don't have an account? Create" : "Already have an account? Sign in";
    document.getElementById('username').closest('label').style.display = signIn ? 'none' : 'block';
  }

  signInToggle.addEventListener('click', () => setFormMode(!isSignInMode));
  heroSignup.addEventListener('click', () => setFormMode(false));
  btnCreate.addEventListener('click', () => setFormMode(false));
  btnSignin.addEventListener('click', () => setFormMode(true));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value.trim() || '';

    try {
      if (isSignInMode) {
        await auth.signInWithEmailAndPassword(email, password);
        // redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        // set displayName
        if (userCred.user) await userCred.user.updateProfile({ displayName: username });
        // redirect to dashboard
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      alert('Auth error: ' + err.message);
    }
  });

  googleBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Google sign-in error: ' + err.message);
    }
  });

  // ensure default mode
  setFormMode(false);
});
