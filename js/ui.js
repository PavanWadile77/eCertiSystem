// ===== UI.JS – Reusable UI helpers =====

const UI = (() => {

  // ---- Toast Notifications ----
  function toast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ---- Modal ----
  function modal({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-cancel">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#modal-confirm').onclick = () => { overlay.remove(); if (onConfirm) onConfirm(); };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  // ---- Badge HTML ----
  function badge(status) {
    const map = {
      Pending: 'badge-pending', Approved: 'badge-approved',
      Issued: 'badge-issued', Rejected: 'badge-rejected'
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
  }

  // ---- Format date ----
  function fmtDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ---- Set page title in topbar ----
  function setTitle(t) {
    const el = document.getElementById('topbar-title');
    if (el) el.textContent = t;
  }

  // ---- Spinner HTML ----
  function spinner() {
    return `<div style="text-align:center;padding:40px;color:var(--text2);">
      <div style="font-size:28px;animation:pulse 1s infinite">⏳</div>
      <div style="margin-top:8px;font-size:13px;">Processing…</div>
    </div>`;
  }

  return { toast, modal, badge, fmtDate, setTitle, spinner };
})();
