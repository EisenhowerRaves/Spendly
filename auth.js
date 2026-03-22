import {
  state, auth, db, currentUserId, currentUserProfile,
  setCurrentUserId, setCurrentUserProfile,
  isFirebase, DEFAULT_TABS, saveLocal, fbSaveTab, showToast,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setDoc, doc
} from './state.js';
import { renderSidebar, renderContent } from './render.js';

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
export function showAuthScreen() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('login-form').style.display = 'flex';
}
window.showLoginScreen = showLoginScreen;

// ─── LAUNCH ──────────────────────────────────────────────────────────────────
export function launchApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const displayName = (currentUserProfile && (currentUserProfile.preferredName || currentUserProfile.name)) || '';
  const nameEl = document.getElementById('header-name-text');
  if (nameEl) nameEl.textContent = displayName ? displayName + '!' : '';
  renderSidebar();
  renderContent();
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
window.handleLogin = async function() {
  const btn = document.getElementById('login-btn');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showToast('Enter email and password'); return; }
  btn.textContent = 'Logging in…';
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles the rest
  } catch(e) {
    showToast('Error: ' + (e.message || e.code));
    btn.textContent = 'Log in';
    btn.disabled = false;
  }
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
window.handleRegister = async function() {
  const btn = document.getElementById('reg-btn');
  const name          = document.getElementById('reg-name').value.trim();
  const surname       = document.getElementById('reg-surname').value.trim();
  const preferredName = document.getElementById('reg-preferred-name').value.trim();
  const email         = document.getElementById('reg-email').value.trim();
  const password      = document.getElementById('reg-password').value;
  if (!email || !password) { showToast('Enter email and password'); return; }
  btn.textContent = 'Creating account…';
  btn.disabled = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, 'users', uid), { email, name, surname, preferredName });
    setCurrentUserProfile({ email, name, surname, preferredName });
    setCurrentUserId(uid);
    state.tabs = DEFAULT_TABS.map(t => ({...t, id: crypto.randomUUID()}));
    state.expenses = [];
    for (const tab of state.tabs) { await fbSaveTab(tab); }
    saveLocal();
    document.getElementById('register-modal').classList.remove('open');
    // onAuthStateChanged fires and calls launchApp()
  } catch(e) {
    showToast('Error: ' + (e.message || e.code));
    btn.textContent = 'Create';
    btn.disabled = false;
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
window.logOut = async function() {
  // Clear localStorage before signing out so stale data never lingers
  localStorage.removeItem('spendly_user');
  localStorage.removeItem('spendly_state');
  Object.keys(localStorage)
    .filter(k => k.startsWith('spendly_'))
    .forEach(k => localStorage.removeItem(k));
  await signOut(auth);
  setCurrentUserId(null);
  state.tabs = [];
  state.expenses = [];
  state.income = [];
  state.taxes = [];
  state.super = [];
  state.activeTab = 'overview';
  state.selectedExpenseIds = [];
  state.selectedIncomeIds = [];
  state.selectedTaxIds = [];
  state.selectedSuperIds = [];
  document.getElementById('login-btn').textContent = 'Log in';
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('reg-btn').textContent = 'Create';
  document.getElementById('reg-btn').disabled = false;
  document.getElementById('reg-name').value = '';
  document.getElementById('reg-surname').value = '';
  document.getElementById('reg-preferred-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-password').value = '';
  setCurrentUserProfile(null);
  // onAuthStateChanged will call showAuthScreen()
};

window.togglePasswordVisibility = function(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
};
