// ===== PAGES-STUDENT.JS – Student Dashboard =====

const StudentPages = (() => {

  let activeSection = 'overview';

  function renderShell(user) {
    const stats = Certs.getStudentStats(user.id);
    return `
    <div class="dashboard page active fade-in" id="page-student">
      <!-- SIDEBAR -->
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
            <div class="user-role">Student</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item active" id="nav-overview" onclick="StudentPages.showSection('overview')">
            <span class="nav-icon">📊</span> Overview
          </button>
          <button class="nav-item" id="nav-apply" onclick="StudentPages.showSection('apply')">
            <span class="nav-icon">➕</span> Apply for Certificate
          </button>
          <button class="nav-item" id="nav-mycerts" onclick="StudentPages.showSection('mycerts')">
            <span class="nav-icon">📜</span> My Certificates
          </button>
          <button class="nav-item" id="nav-verify" onclick="App.showVerifyUpload()">
            <span class="nav-icon">🛡️</span> Verify Certificate
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-block" onclick="App.logout()">🚪 Sign Out</button>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="main-content">
        <div class="topbar">
          <div class="topbar-title" id="topbar-title">Overview</div>
          <div class="topbar-actions">
            <span style="font-size:13px;color:var(--text2);">👋 ${user.name}</span>
          </div>
        </div>
        <div class="content-area" id="student-content"></div>
      </main>
    </div>`;
  }

  function showSection(section) {
    activeSection = section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.getElementById('nav-' + section);
    if (navEl) navEl.classList.add('active');
    const titles = { overview: 'Overview', apply: 'Apply for Certificate', mycerts: 'My Certificates' };
    UI.setTitle(titles[section] || '');
    const content = document.getElementById('student-content');
    if (!content) return;
    if (section === 'overview') content.innerHTML = renderOverview();
    else if (section === 'apply') content.innerHTML = renderApply();
    else if (section === 'mycerts') content.innerHTML = renderMyCerts();
  }

  function renderOverview() {
    const user = Auth.getUser();
    const stats = Certs.getStudentStats(user.id);
    const certs = DB.getCertsByStudent(user.id).slice(-3).reverse();
    return `
    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">${stats.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${stats.issued}</div>
        <div class="stat-label">Issued</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">❌</div>
        <div class="stat-value">${stats.rejected}</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Recent Applications</div>
        <div class="section-subtitle">Your latest certificate requests</div></div>
        <button class="btn btn-primary btn-sm" onclick="StudentPages.showSection('apply')">+ Apply Now</button>
      </div>
      ${certs.length === 0 ? `<div class="empty-state"><div class="empty-icon">📜</div>
        <h3>No applications yet</h3><p>Apply for your first certificate to get started.</p></div>` :
      `<div class="table-container"><table>
        <thead><tr><th>Certificate Type</th><th>Applied On</th><th>Issue Date</th><th>Status</th></tr></thead>
        <tbody>${certs.map(c => `<tr>
          <td><strong>${c.certificateType}</strong></td>
          <td>${UI.fmtDate(c.appliedAt)}</td>
          <td>${UI.fmtDate(c.issueDate)}</td>
          <td>${UI.badge(c.status)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  }

  function renderApply() {
    const typeOpts = Certs.TYPES.map(t =>
      `<option value="${t.value}">${t.icon} ${t.value}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    return `
    <div class="card apply-form">
      <div class="section-header">
        <div><div class="section-title">New Certificate Application</div>
        <div class="section-subtitle">Fill in the details below</div></div>
      </div>
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input class="form-input" type="text" id="apply-name" value="${Auth.getUser().name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Certificate Type</label>
        <select class="form-select" id="apply-type">${typeOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Issue Date</label>
        <input class="form-input" type="date" id="apply-date" value="${today}" />
      </div>
      <button class="btn btn-primary" onclick="StudentPages.submitApply()">🚀 Submit Application</button>
    </div>`;
  }

  function submitApply() {
    const user = Auth.getUser();
    const name = document.getElementById('apply-name').value.trim();
    const type = document.getElementById('apply-type').value;
    const date = document.getElementById('apply-date').value;
    const result = Certs.apply(user.id, name || user.name, type, date);
    if (result.error) { UI.toast(result.error, 'error'); return; }
    UI.toast('Application submitted! The admin will review it shortly.', 'success');
    showSection('mycerts');
  }

  function renderMyCerts() {
    const user = Auth.getUser();
    const certs = DB.getCertsByStudent(user.id).reverse();
    const filterHtml = `
    <div class="filter-tabs" id="cert-filters">
      <button class="filter-tab active" onclick="StudentPages.filterCerts('All', this)">All</button>
      <button class="filter-tab" onclick="StudentPages.filterCerts('Pending', this)">Pending</button>
      <button class="filter-tab" onclick="StudentPages.filterCerts('Approved', this)">Approved</button>
      <button class="filter-tab" onclick="StudentPages.filterCerts('Issued', this)">Issued</button>
      <button class="filter-tab" onclick="StudentPages.filterCerts('Rejected', this)">Rejected</button>
    </div>`;
    if (certs.length === 0) return filterHtml + `<div class="empty-state">
      <div class="empty-icon">📜</div><h3>No certificates yet</h3>
      <p>Submit an application to get started.</p></div>`;
    return filterHtml + `<div class="cert-grid" id="cert-grid">${certs.map(certCard).join('')}</div>`;
  }

  function certCard(c) {
    const icon = Certs.getTypeIcon(c.certificateType);
    const canDownload = c.status === 'Issued' && c.pdf_url;
    return `<div class="cert-card" data-status="${c.status}">
      <div class="cert-type-icon">${icon}</div>
      <div class="cert-id">ID: ${c.uniqueCertId}</div>
      <div class="cert-name">${c.studentName}</div>
      <div class="cert-type">${c.certificateType}</div>
      <div style="margin-bottom:12px;">${UI.badge(c.status)}</div>
      <div class="cert-date">📅 Applied: ${UI.fmtDate(c.appliedAt)}</div>
      <div class="cert-date">📅 Issue Date: ${UI.fmtDate(c.issueDate)}</div>
      <div class="cert-actions">
        ${canDownload ? `<button class="btn btn-success btn-sm" onclick="StudentPages.download('${c.id}')">⬇ Download PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="StudentPages.viewVerify('${c.uniqueCertId}')">🔍 Verify</button>` : ''}
      </div>
    </div>`;
  }

  function filterCerts(status, btn) {
    document.querySelectorAll('#cert-filters .filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const grid = document.getElementById('cert-grid');
    if (!grid) return;
    grid.querySelectorAll('.cert-card').forEach(card => {
      const show = status === 'All' || card.dataset.status === status;
      card.style.display = show ? '' : 'none';
    });
  }

  function download(certId) {
    const cert = DB.getCertById(certId);
    if (!cert) { UI.toast('Certificate not found.', 'error'); return; }
    PDFGen.downloadCert(cert);
    UI.toast('Downloading certificate PDF…', 'success');
  }

  function viewVerify(uniqueCertId) {
    App.showVerify(uniqueCertId);
  }

  function init(user) {
    document.getElementById('app').innerHTML = renderShell(user);
    showSection('overview');
  }

  return { init, showSection, submitApply, filterCerts, download, viewVerify };
})();
