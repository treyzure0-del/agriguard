/* =========================================================
   SECTION 11: AUTH — Slide-in Panel + Advisor Lock
   ========================================================= */
 
// ─── STORAGE ──────────────────────────────────────────────
function loadAuth() {
  try {
    const t = localStorage.getItem('ag_token');
    const u = localStorage.getItem('ag_user');
    if (t && u) { authToken = t; currentUser = JSON.parse(u); }
  } catch (e) { clearAuth(); }
}
 
function saveAuth(token, user) {
  localStorage.setItem('ag_token', token);
  localStorage.setItem('ag_user', JSON.stringify(user));
  authToken = token;
  currentUser = user;
}
 
function clearAuth() {
  localStorage.removeItem('ag_token');
  localStorage.removeItem('ag_user');
  authToken = null;
  currentUser = null;
}
 
// ─── PANEL OPEN / CLOSE ───────────────────────────────────
function openAuthPanel(tab) {
  const panel = document.getElementById('authPanel');
  const backdrop = document.getElementById('authBackdrop');
  if (panel) panel.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (tab) switchTab(tab);
  clearAuthErrors();
}
 
function closeAuthPanel() {
  const panel = document.getElementById('authPanel');
  const backdrop = document.getElementById('authBackdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
  clearAuthErrors();
}
 
function switchTab(tab) {
  const loginEl = document.getElementById('panelLogin');
  const signupEl = document.getElementById('panelSignup');
  const histEl = document.getElementById('panelHistory');
  const tLogin = document.getElementById('tabLogin');
  const tSignup = document.getElementById('tabSignup');
 
  if (loginEl) loginEl.style.display = 'none';
  if (signupEl) signupEl.style.display = 'none';
  if (histEl) histEl.style.display = 'none';
  if (tLogin) tLogin.classList.remove('active');
  if (tSignup) tSignup.classList.remove('active');
 
  if (tab === 'login') {
    if (loginEl) loginEl.style.display = 'block';
    if (tLogin) tLogin.classList.add('active');
  } else if (tab === 'signup') {
    if (signupEl) signupEl.style.display = 'block';
    if (tSignup) tSignup.classList.add('active');
  } else if (tab === 'history') {
    if (histEl) histEl.style.display = 'block';
    loadChatHistoryPanel();
  }
  clearAuthErrors();
}
 
function showChatHistory() {
  openAuthPanel(null);
  const loginEl = document.getElementById('panelLogin');
  const signupEl = document.getElementById('panelSignup');
  const histEl = document.getElementById('panelHistory');
  const tLogin = document.getElementById('tabLogin');
  const tSignup = document.getElementById('tabSignup');
  if (loginEl) loginEl.style.display = 'none';
  if (signupEl) signupEl.style.display = 'none';
  if (histEl) histEl.style.display = 'block';
  if (tLogin) tLogin.classList.remove('active');
  if (tSignup) tSignup.classList.remove('active');
  loadChatHistoryPanel();
}
 
// ─── USER DROPDOWN ────────────────────────────────────────
function toggleUserMenu() {
  const dd = document.getElementById('userDropdown');
  const pill = document.getElementById('navUserPill');
  if (dd) dd.classList.toggle('open');
  if (pill) pill.classList.toggle('open');
}
 
function closeUserMenu() {
  const dd = document.getElementById('userDropdown');
  const pill = document.getElementById('navUserPill');
  if (dd) dd.classList.remove('open');
  if (pill) pill.classList.remove('open');
}
 
// ─── UPDATE UI ────────────────────────────────────────────
function updateAuthUI() {
  const authBtn = document.getElementById('navAuthBtn');
  const userPill = document.getElementById('navUserPill');
  const navAvatar = document.getElementById('navAvatar');
  const navUserName = document.getElementById('navUserName');
  const dropAvatar = document.getElementById('dropAvatar');
  const dropName = document.getElementById('dropName');
  const dropEmail = document.getElementById('dropEmail');
  const advisorLock = document.getElementById('advisorLock');
  const advisorChat = document.getElementById('advisorChat');
 
  if (currentUser) {
    if (authBtn) authBtn.style.display = 'none';
    if (userPill) userPill.style.display = 'flex';
    const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
    if (navAvatar) navAvatar.textContent = initial;
    if (navUserName) navUserName.textContent = currentUser.name.split(' ')[0];
    if (dropAvatar) dropAvatar.textContent = initial;
    if (dropName) dropName.textContent = currentUser.name;
    if (dropEmail) dropEmail.textContent = currentUser.email;
    if (advisorLock) advisorLock.style.display = 'none';
    if (advisorChat) advisorChat.style.display = 'grid';
  } else {
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (userPill) userPill.style.display = 'none';
    if (advisorLock) advisorLock.style.display = 'flex';
    if (advisorChat) advisorChat.style.display = 'none';
  }
}
 
// ─── SIGN UP ──────────────────────────────────────────────
async function handleSignup() {
  const name = document.getElementById('signupName')?.value?.trim();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const password = document.getElementById('signupPassword')?.value;
 
  if (!name || !email || !password) {
    showAuthError('signup', 'Please fill in all fields');
    return;
  }
 
  setAuthBtnLoading('signupBtn', true, 'Creating account...');
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { showAuthError('signup', data.error || 'Signup failed'); return; }
 
    saveAuth(data.token, data.user);
    updateAuthUI();
    closeAuthPanel();
    showSuccess('Welcome to AgriGuard AI, ' + data.user.name + '! 🌿');
 
    if (document.getElementById('page-advisor').classList.contains('active')) {
      setTimeout(() => {
        addMessage('Hi ' + data.user.name + '! 👋 I\'m your personal AI farming advisor. Ask me anything about crops, pests, soil, or diseases in East Africa.', 'assistant');
      }, 400);
    }
  } catch (err) {
    showAuthError('signup', 'Network error. Please try again.');
  } finally {
    setAuthBtnLoading('signupBtn', false, 'Create Free Account');
  }
}
 
// ─── LOG IN ───────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;
 
  if (!email || !password) {
    showAuthError('login', 'Please enter your email and password');
    return;
  }
 
  setAuthBtnLoading('loginBtn', true, 'Signing in...');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { showAuthError('login', data.error || 'Login failed'); return; }
 
    saveAuth(data.token, data.user);
    updateAuthUI();
    closeAuthPanel();
    showSuccess('Welcome back, ' + data.user.name + '! 👋');
 
    if (document.getElementById('page-advisor').classList.contains('active')) {
      setTimeout(() => {
        addMessage('Welcome back, ' + data.user.name + '! 🌿 Ready to help with your crops.', 'assistant');
      }, 400);
    }
  } catch (err) {
    showAuthError('login', 'Network error. Please try again.');
  } finally {
    setAuthBtnLoading('loginBtn', false, 'Sign In');
  }
}
 
// ─── LOG OUT ──────────────────────────────────────────────
async function handleLogout() {
  closeUserMenu();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authToken ? { 'Authorization': 'Bearer ' + authToken } : {}
    });
  } catch (e) {}
 
  clearAuth();
  conversationHistory = [];
  const msgs = document.getElementById('chatMessages');
  if (msgs) {
    msgs.innerHTML = '<div class="typing-indicator" id="typingIndicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  }
  updateAuthUI();
  showSuccess('Signed out. See you next time! 👋');
}
 
// ─── CHAT HISTORY ─────────────────────────────────────────
async function loadChatHistoryPanel() {
  const container = document.getElementById('historyList');
  if (!container || !authToken) return;
  container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px 0">Loading...</p>';
  try {
    const res = await fetch('/api/auth/chat-history', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    if (!res.ok) throw new Error('Failed');
    const history = await res.json();
    if (history.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px 0">No saved chats yet.<br>Start a conversation with the AI Advisor!</p>';
      return;
    }
    container.innerHTML = '';
    history.slice(-40).forEach(msg => {
      const item = document.createElement('div');
      item.className = 'chat-history-item';
      item.innerHTML = '<span class="chi-role ' + msg.role + '">' + (msg.role === 'user' ? 'You' : 'AI') + '</span><span class="chi-text">' + escapeHtml(msg.content) + '</span>';
      container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
  } catch (e) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px 0">Could not load history.</p>';
  }
}
 
// ─── AI ADVISOR with AUTH ─────────────────────────────────
// Override sendAdvisorMessage to require login and send token
const _origSendAdvisor = sendAdvisorMessage;
sendAdvisorMessage = async function(text) {
  if (!text || !text.trim()) return;
 
  if (!currentUser) {
    openAuthPanel('login');
    showError('Please sign in to use the AI Advisor');
    return;
  }
 
  const input = document.getElementById('chatInput');
  if (input) { input.value = ''; input.style.height = 'auto'; }
 
  addMessage(escapeHtml(text), 'user');
  conversationHistory.push({ role: 'user', content: text });
  showTypingIndicator();
 
  try {
    const res = await fetch('/api/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify({ messages: conversationHistory })
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const reply = data.response || "Sorry, I couldn't process that.";
    conversationHistory.push({ role: 'assistant', content: reply });
    hideTypingIndicator();
    addMessage(renderMarkdown(reply), 'assistant', true);
  } catch (err) {
    hideTypingIndicator();
    if (err.message === '401') {
      addMessage('Your session expired. Please sign in again.', 'assistant');
      clearAuth();
      updateAuthUI();
      setTimeout(() => openAuthPanel('login'), 800);
    } else {
      addMessage("I'm having trouble connecting. Please try again.", 'assistant');
    }
  }
};
 
// ─── HELPERS ──────────────────────────────────────────────
function showAuthError(form, msg) {
  const el = document.getElementById(form + 'Error');
  if (el) { el.textContent = msg; el.classList.add('visible'); }
}
 
function clearAuthErrors() {
  ['loginError', 'signupError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  });
}
 
function setAuthBtnLoading(id, loading, text) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
  if (loading) btn.classList.add('loading');
  else btn.classList.remove('loading');
}
 
// ─── EVENTS ───────────────────────────────────────────────
document.addEventListener('click', function(e) {
  const dd = document.getElementById('userDropdown');
  const pill = document.getElementById('navUserPill');
  if (dd && pill && !dd.contains(e.target) && !pill.contains(e.target)) {
    closeUserMenu();
  }
  const panel = document.getElementById('authPanel');
  const backdrop = document.getElementById('authBackdrop');
  if (backdrop && e.target === backdrop) closeAuthPanel();
});
 
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthPanel();
  if (e.key === 'Enter') {
    const panel = document.getElementById('authPanel');
    if (!panel || !panel.classList.contains('open')) return;
    const loginEl = document.getElementById('panelLogin');
    const signupEl = document.getElementById('panelSignup');
    if (loginEl && loginEl.style.display !== 'none') handleLogin();
    else if (signupEl && signupEl.style.display !== 'none') handleSignup();
  }
});
 
// ─── INIT AUTH ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadAuth();
  updateAuthUI();
});
