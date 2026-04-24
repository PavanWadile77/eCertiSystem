// ===== PAGES-VERIFY.JS – Public Certificate Verification =====

const VerifyPage = (() => {

  function render(uniqueCertId) {
    const cert = DB.getCertByUniqueId(uniqueCertId);
    const isValid = cert && cert.status === 'Issued';

    if (!cert) {
      return `
      <div class="verify-page page active fade-in" id="page-verify">
        <div class="verify-card">
          <div class="logo-icon" style="width:64px;height:64px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 24px;box-shadow:0 8px 24px rgba(108,99,255,0.4);">🎓</div>
          <div style="font-family:var(--font-display);font-size:22px;font-weight:800;margin-bottom:6px;">CertiFlow</div>
          <div style="color:var(--text2);font-size:13px;margin-bottom:32px;">Certificate Verification</div>
          <div class="verify-icon invalid">❌</div>
          <div class="verify-status-invalid">Certificate Not Found</div>
          <p style="color:var(--text2);font-size:14px;margin:12px 0 28px;">
            No certificate found with ID: <code style="color:var(--danger);">${uniqueCertId}</code>
          </p>
          <button class="btn btn-ghost btn-block" onclick="App.route()">← Back to CertiFlow</button>
        </div>
      </div>`;
    }

    const qrId = 'verify-qr-' + Date.now();
    const verifyUrl = `${window.location.origin}${window.location.pathname}?verify=${cert.uniqueCertId}`;

    setTimeout(() => {
      const el = document.getElementById(qrId);
      if (el && typeof QRCode !== 'undefined') {
        new QRCode(el, { text: verifyUrl, width: 120, height: 120, correctLevel: QRCode.CorrectLevel.M });
      }
    }, 100);

    return `
    <div class="verify-page page active fade-in" id="page-verify">
      <div class="verify-card">
        <div class="logo-icon" style="width:64px;height:64px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 20px;box-shadow:0 8px 24px rgba(108,99,255,0.4);">🎓</div>
        <div style="font-family:var(--font-display);font-size:20px;font-weight:800;margin-bottom:4px;">CertiFlow</div>
        <div style="color:var(--text2);font-size:12px;margin-bottom:28px;">Certificate Verification Portal</div>

        <div class="verify-icon ${isValid ? 'valid' : 'invalid'}">${isValid ? '✅' : '⚠️'}</div>
        <div class="${isValid ? 'verify-status-valid' : 'verify-status-invalid'}">
          ${isValid ? '✔ Valid Certificate' : '⚠ Certificate Not Issued'}
        </div>
        <p style="color:var(--text2);font-size:13px;margin:8px 0 20px;">
          ${isValid ? 'This certificate has been officially issued by CertiFlow.' : 'This certificate has not been issued yet or was rejected.'}
        </p>

        <div class="verify-info-grid">
          <div class="verify-info-row">
            <span class="verify-info-label">👤 Certificate Holder</span>
            <span class="verify-info-value">${cert.studentName}</span>
          </div>
          <div class="verify-info-row">
            <span class="verify-info-label">🎓 Certificate Type</span>
            <span class="verify-info-value">${cert.certificateType}</span>
          </div>
          <div class="verify-info-row">
            <span class="verify-info-label">📅 Issue Date</span>
            <span class="verify-info-value">${UI.fmtDate(cert.issueDate)}</span>
          </div>
          <div class="verify-info-row">
            <span class="verify-info-label">🔑 Certificate ID</span>
            <span class="verify-info-value" style="font-family:monospace;font-size:12px;">${cert.uniqueCertId}</span>
          </div>
          <div class="verify-info-row">
            <span class="verify-info-label">📊 Status</span>
            <span class="verify-info-value">${UI.badge(cert.status)}</span>
          </div>
        </div>

        ${isValid ? `<div class="qr-container" id="${qrId}"></div>
        <p style="color:var(--text3);font-size:11px;margin-top:10px;">Scan QR to re-verify</p>` : ''}

        <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;">
          ${isValid && cert.pdf_url ? `<button class="btn btn-success" style="flex:1;" onclick="VerifyPage.downloadFromVerify('${cert.id}')">⬇ Download PDF</button>` : ''}
          <button class="btn btn-ghost" style="flex:1;" onclick="App.route()">← Back to CertiFlow</button>
        </div>
      </div>
    </div>`;
  }

  function downloadFromVerify(certId) {
    const cert = DB.getCertById(certId);
    if (!cert) { UI.toast('Certificate not found.', 'error'); return; }
    PDFGen.downloadCert(cert);
    UI.toast('Downloading…', 'success');
  }

  function init(uniqueCertId) {
    document.getElementById('app').innerHTML = render(uniqueCertId);
  }

  return { init, downloadFromVerify };
})();
