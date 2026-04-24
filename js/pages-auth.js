// ===== PAGES-AUTH.JS – Login / Signup screens =====

const AuthPages = (() => {

  function render() {
    return `
    <div class="auth-page page active" id="page-auth">
      <div class="auth-container fade-in">
        <div class="auth-logo">
          <div class="logo-icon">🎓</div>
          <h1>CertiFlow</h1>
          <p>Digital Certificate Issuance &amp; Verification</p>
        </div>
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab active" id="tab-login" onclick="AuthPages.switchTab('login')">Sign In</button>
            <button class="auth-tab" id="tab-signup" onclick="AuthPages.switchTab('signup')">Sign Up</button>
          </div>

          <!-- LOGIN FORM -->
          <div id="form-login">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input class="form-input" type="email" id="login-email" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="Enter your password" />
            </div>
            <button class="btn btn-primary btn-block" onclick="AuthPages.doLogin()">Sign In →</button>
            <div class="divider">Quick Demo Access</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <button class="btn btn-ghost btn-sm" onclick="AuthPages.fillDemo('admin')">👤 Admin Demo</button>
              <button class="btn btn-ghost btn-sm" onclick="AuthPages.fillDemo('student')">🎓 Student Demo</button>
            </div>
          </div>

          <!-- SIGNUP FORM -->
          <div id="form-signup" style="display:none;">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" type="text" id="signup-name" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input class="form-input" type="email" id="signup-email" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" type="password" id="signup-password" placeholder="Min. 6 characters" />
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select class="form-select" id="signup-role">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button class="btn btn-primary btn-block" onclick="AuthPages.doSignup()">Create Account →</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function switchTab(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('form-signup').style.display = tab === 'signup' ? '' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  }

  function fillDemo(role) {
    if (role === 'admin') {
      document.getElementById('login-email').value = 'admin@certiflow.com';
      document.getElementById('login-password').value = 'Admin@123';
    } else {
      // Create demo student if missing
      const email = 'student@demo.com';
      const existing = DB.findUser(email, 'Student@123');
      if (!existing) DB.createUser({ name: 'Demo Student', email, password: 'Student@123', role: 'student' });
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = 'Student@123';
    }
    UI.toast('Demo credentials filled!', 'info');
  }

  function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const result = Auth.login(email, password);
    if (result.error) { UI.toast(result.error, 'error'); return; }
    UI.toast(`Welcome back, ${result.user.name}!`, 'success');
    App.route();
  }

  function doSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    const result = Auth.signup(name, email, password, role);
    if (result.error) { UI.toast(result.error, 'error'); return; }
    UI.toast('Account created! Welcome to CertiFlow.', 'success');
    App.route();
  }

  return { render, switchTab, fillDemo, doLogin, doSignup };
})();
