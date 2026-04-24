// ===== PAGES-ADMIN.JS – Admin Dashboard =====

const AdminPages = (() => {

  let activeSection = 'overview';
  let activeFilter = 'All';

  function renderShell(user) {
    return `
    <div class="dashboard page active fade-in" id="page-admin">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon">🎓</div>
            <span>CertiFlow</span>
          </div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">Administrator</div>
          </div>
        </div>
        <nav class="sidebar-nav" id="admin-sidebar-nav">
          <button class="nav-item active" id="nav-overview" data-section="overview">
            <span class="nav-icon">📊</span> Overview
          </button>
          <button class="nav-item" id="nav-requests" data-section="requests">
            <span class="nav-icon">📋</span> All Requests
          </button>
          <button class="nav-item" id="nav-users" data-section="users">
            <span class="nav-icon">👥</span> Users
          </button>
          <button class="nav-item" id="nav-reports" data-section="reports">
            <span class="nav-icon">🚨</span> Fake Reports
          </button>
          <button class="nav-item" id="nav-verify" data-action="verify">
            <span class="nav-icon">🛡</span> Verify Certificate
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-block" id="admin-signout-btn">🚪 Sign Out</button>
        </div>
      </aside>
      <main class="main-content">
        <div class="topbar">
          <div class="topbar-title" id="topbar-title">Overview</div>
          <div class="topbar-actions">
            <span style="font-size:13px;color:var(--text2);">⚙️ Admin Panel</span>
          </div>
        </div>
        <div class="content-area" id="admin-content"></div>
      </main>
    </div>`;
  }

  function showSection(section) {
    activeSection = section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.getElementById('nav-' + section);
    if (navEl) navEl.classList.add('active');
    const titles = { overview: 'Overview', requests: 'All Certificate Requests', users: 'Registered Users', reports: 'Fake Certificate Reports' };
    UI.setTitle(titles[section] || '');
    const content = document.getElementById('admin-content');
    if (!content) return;
    if (section === 'overview') content.innerHTML = renderOverview();
    else if (section === 'requests') content.innerHTML = renderRequests();
    else if (section === 'users') content.innerHTML = renderUsers();
    else if (section === 'reports') content.innerHTML = renderReports();
  }

  function renderOverview() {
    const s = Certs.getStats();
    const recent = DB.getCerts().slice(-5).reverse();
    return `
    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${s.total}</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">${s.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${s.issued}</div>
        <div class="stat-label">Issued</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">❌</div>
        <div class="stat-value">${s.rejected}</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Recent Requests</div>
        <div class="section-subtitle">Latest certificate applications</div></div>
        <button class="btn btn-primary btn-sm" onclick="AdminPages.showSection('requests')">View All</button>
      </div>
      ${recent.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📋</div><h3>No requests yet</h3></div>`
        : `<div class="table-container"><table>
          <thead><tr><th>Student</th><th>Type</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${recent.map(c => `<tr>
            <td><strong>${c.studentName}</strong></td>
            <td>${c.certificateType}</td>
            <td>${UI.fmtDate(c.appliedAt)}</td>
            <td>${UI.badge(c.status)}</td>
            <td>${actionButtons(c)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`}
    </div>`;
  }

  function renderRequests() {
    const all = DB.getCerts().reverse();
    const filters = ['All', 'Pending', 'Approved', 'Issued', 'Rejected'];
    const filtered = activeFilter === 'All' ? all : all.filter(c => c.status === activeFilter);
    return `
    <div class="filter-tabs" id="req-filters">
      ${filters.map(f => `<button class="filter-tab ${f === activeFilter ? 'active' : ''}"
        onclick="AdminPages.filterRequests('${f}', this)">${f}</button>`).join('')}
    </div>
    <div style="margin-bottom:16px;">
      <div class="search-box">
        <input class="form-input" type="text" id="req-search" placeholder="Search student name…"
          oninput="AdminPages.searchRequests(this.value)" />
      </div>
    </div>
    <div class="card" style="padding:0;">
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Cert ID</th><th>Student</th><th>Type</th>
            <th>Applied</th><th>Issue Date</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody id="requests-tbody">
            ${filtered.length === 0
              ? `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text2);">No records found.</td></tr>`
              : filtered.map(c => reqRow(c)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function reqRow(c) {
    return `<tr id="row-${c.id}">
      <td><code style="font-size:11px;color:var(--text2);">${c.uniqueCertId}</code></td>
      <td><strong>${c.studentName}</strong></td>
      <td>${c.certificateType}</td>
      <td>${UI.fmtDate(c.appliedAt)}</td>
      <td>${UI.fmtDate(c.issueDate)}</td>
      <td>${UI.badge(c.status)}</td>
      <td>${actionButtons(c)}</td>
    </tr>`;
  }

  function actionButtons(c) {
    if (c.status === 'Pending') return `
      <div style="display:flex;gap:6px;">
        <button class="btn btn-success btn-sm" onclick="AdminPages.approve('${c.id}')">✅ Approve</button>
        <button class="btn btn-danger btn-sm" onclick="AdminPages.reject('${c.id}')">❌ Reject</button>
      </div>`;
    if (c.status === 'Issued') return `<button class="btn btn-ghost btn-sm" onclick="AdminPages.viewCert('${c.uniqueCertId}')">🔍 Verify</button>`;
    return `<span style="color:var(--text3);font-size:12px;">—</span>`;
  }

  function filterRequests(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('#req-filters .filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('admin-content').innerHTML = renderRequests();
  }

  function searchRequests(query) {
    const tbody = document.getElementById('requests-tbody');
    if (!tbody) return;
    const all = DB.getCerts().reverse();
    const filtered = all.filter(c =>
      c.studentName.toLowerCase().includes(query.toLowerCase()) &&
      (activeFilter === 'All' || c.status === activeFilter));
    tbody.innerHTML = filtered.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text2);">No matching records.</td></tr>`
      : filtered.map(reqRow).join('');
  }

  function approve(certId) {
    UI.modal({
      title: '✅ Approve Certificate',
      body: 'This will generate a PDF certificate with embedded QR code and mark it as Issued.',
      confirmText: 'Approve & Generate PDF',
      onConfirm: async () => {
        const cert = DB.getCertById(certId);
        if (!cert) { UI.toast('Not found.', 'error'); return; }
        const row = document.getElementById('row-' + certId);
        if (row) row.innerHTML = `<td colspan="7" style="text-align:center;color:var(--text2);">⏳ Generating certificate…</td>`;
        try {
          const result = await Certs.approve(certId);
          if (result.error) { UI.toast(result.error, 'error'); return; }
          UI.toast('✅ Certificate approved and PDF generated!', 'success');
          showSection('requests');
        } catch (e) {
          UI.toast('Error generating PDF: ' + e.message, 'error');
          showSection('requests');
        }
      }
    });
  }

  function reject(certId) {
    UI.modal({
      title: '❌ Reject Certificate',
      body: 'Are you sure you want to reject this certificate request?',
      confirmText: 'Reject',
      danger: true,
      onConfirm: () => {
        Certs.reject(certId);
        UI.toast('Certificate rejected.', 'info');
        showSection(activeSection);
      }
    });
  }

  function viewCert(uniqueCertId) {
    App.showVerify(uniqueCertId);
  }

  function renderReports() {
    const reports = DB.getReports().reverse();
    if (reports.length === 0) return `<div class="empty-state"><div class="empty-icon">🚨</div>
      <h3>No Fake Reports Yet</h3><p>Fake certificate reports will appear here when submitted via the verification page.</p></div>`;
    return `<div class="card" style="padding:0;"><div class="table-container"><table>
      <thead><tr><th>#</th><th>File</th><th>Reported By</th><th>Verdict</th><th>Checks (Pass/Total)</th><th>Reported At</th></tr></thead>
      <tbody>${reports.map((r, i) => {
        const passed = Object.values(r.checksResult || {}).filter(c => c && c.pass).length;
        const total = Object.keys(r.checksResult || {}).length;
        return `<tr>
          <td style="color:var(--text3);">${i + 1}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;">${r.fileName || '—'}</td>
          <td>${r.reportedBy}</td>
          <td><span class="badge ${r.verdict === 'FAKE' ? 'badge-rejected' : 'badge-pending'}">${r.verdict}</span></td>
          <td style="color:${passed < 3 ? 'var(--danger)' : 'var(--warning)'}">${passed}/${total} passed</td>
          <td>${UI.fmtDate(r.reportedAt)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  }

  function renderUsers() {
    const users = DB.getUsers();
    return `<div class="card" style="padding:0;">
      <div class="table-container"><table>
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>${users.map((u, i) => `<tr>
          <td style="color:var(--text3);">${i + 1}</td>
          <td><div style="display:flex;align-items:center;gap:10px;">
            <div class="user-avatar" style="width:30px;height:30px;font-size:12px;">${u.name.charAt(0).toUpperCase()}</div>
            <strong>${u.name}</strong></div></td>
          <td style="color:var(--text2);">${u.email}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-approved' : 'badge-issued'}">${u.role}</span></td>
          <td>${UI.fmtDate(u.createdAt)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  }

  function init(user) {
    document.getElementById('app').innerHTML = renderShell(user);

    // Wire sidebar navigation via addEventListener (avoids inline onclick emoji issues)
    const nav = document.getElementById('admin-sidebar-nav');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-section],[data-action]');
        if (!btn) return;
        if (btn.dataset.section) showSection(btn.dataset.section);
        else if (btn.dataset.action === 'verify') App.showVerifyUpload();
      });
    }

    const signoutBtn = document.getElementById('admin-signout-btn');
    if (signoutBtn) signoutBtn.addEventListener('click', () => App.logout());

    showSection('overview');
  }

  return { init, showSection, filterRequests, searchRequests, approve, reject, viewCert };
})();
