// ===== PAGES-VERIFY-UPLOAD.JS – Certificate Upload & Authenticity Check UI =====

const VerifyUploadPage = (() => {

  let _droppedFile = null;

  // ── Public nav entry (no login needed) ──────────────────────────────
  function renderPublicShell() {
    return `
    <div class="page active fade-in" id="page-verify-upload"
      style="min-height:100vh;background:radial-gradient(ellipse at 20% 30%,rgba(108,99,255,0.1) 0%,transparent 60%),
             radial-gradient(ellipse at 80% 70%,rgba(0,212,170,0.07) 0%,transparent 50%),var(--bg);
             flex-direction:column;">

      <!-- TOP NAV -->
      <nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 32px;
                  border-bottom:1px solid var(--border);background:var(--bg2);">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--primary),var(--accent));
                      border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🎓</div>
          <span style="font-family:var(--font-display);font-size:18px;font-weight:800;
                        background:linear-gradient(135deg,#fff,var(--primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            CertiFlow</span>
        </div>
        <div style="display:flex;gap:10px;">
          <span style="font-size:13px;color:var(--text2);display:flex;align-items:center;gap:6px;">
            🔒 Secure Verification Portal</span>
          <button class="btn btn-ghost btn-sm" onclick="App.route()">← Back to App</button>
        </div>
      </nav>

      <!-- CONTENT -->
      <div style="flex:1;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;">
        <div style="width:100%;max-width:720px;">

          <!-- HEADER -->
          <div style="text-align:center;margin-bottom:40px;">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(108,99,255,0.12);
                        border:1px solid rgba(108,99,255,0.3);border-radius:999px;padding:6px 16px;
                        font-size:12px;color:var(--primary);font-weight:600;margin-bottom:20px;">
              🛡️ AI-Powered Authenticity Engine
            </div>
            <h1 style="font-family:var(--font-display);font-size:36px;font-weight:800;margin-bottom:12px;
                        background:linear-gradient(135deg,#fff 40%,var(--primary));
                        -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              Certificate Verification
            </h1>
            <p style="color:var(--text2);font-size:16px;max-width:480px;margin:0 auto;">
              Upload any certificate to instantly detect if it is <strong style="color:var(--accent);">ORIGINAL</strong>
              or <strong style="color:var(--danger);">FAKE</strong> using 5 independent checks.
            </p>
          </div>

          <!-- UPLOAD ZONE -->
          <div id="upload-section">
            <div id="dropzone"
              style="border:2px dashed var(--border);border-radius:var(--radius);padding:60px 32px;
                     text-align:center;cursor:pointer;transition:var(--transition);
                     background:var(--card);position:relative;"
              onclick="document.getElementById('cert-file-input').click()"
              ondragover="VerifyUploadPage.onDragOver(event)"
              ondragleave="VerifyUploadPage.onDragLeave(event)"
              ondrop="VerifyUploadPage.onDrop(event)">
              <input type="file" id="cert-file-input" accept=".pdf,.jpg,.jpeg,.png" style="display:none;"
                onchange="VerifyUploadPage.onFileSelect(this.files[0])" />
              <div style="font-size:48px;margin-bottom:16px;">📄</div>
              <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Drop your certificate here</div>
              <div style="color:var(--text2);font-size:14px;margin-bottom:16px;">or click to browse</div>
              <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                ${['PDF', 'JPG', 'PNG'].map(t => `<span style="background:var(--bg2);border:1px solid var(--border);
                  border-radius:6px;padding:4px 10px;font-size:12px;color:var(--text2);">.${t}</span>`).join('')}
              </div>
              <div style="font-size:12px;color:var(--text3);margin-top:12px;">Max file size: 5 MB</div>
            </div>

            <!-- CHECKS PREVIEW -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-top:24px;">
              ${[
                { icon: '🔲', label: 'QR Code Scan' },
                { icon: '📝', label: 'Metadata Match' },
                { icon: '🖼️', label: 'Template Check' },
                { icon: '#️⃣', label: 'Hash Verify' },
                { icon: '🔍', label: 'Tamper Detect' }
              ].map(c => `
                <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);
                            padding:14px;text-align:center;">
                  <div style="font-size:22px;margin-bottom:6px;">${c.icon}</div>
                  <div style="font-size:12px;color:var(--text2);font-weight:500;">${c.label}</div>
                </div>`).join('')}
            </div>
          </div>

          <!-- RESULT SECTION (hidden until check runs) -->
          <div id="result-section" style="display:none;"></div>
        </div>
      </div>
    </div>`;
  }

  // ── Drag & Drop handlers ─────────────────────────────────────────────
  function onDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById('dropzone');
    if (dz) { dz.style.borderColor = 'var(--primary)'; dz.style.background = 'rgba(108,99,255,0.05)'; }
  }
  function onDragLeave(e) {
    const dz = document.getElementById('dropzone');
    if (dz) { dz.style.borderColor = 'var(--border)'; dz.style.background = 'var(--card)'; }
  }
  function onDrop(e) {
    e.preventDefault();
    onDragLeave(e);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function onFileSelect(file) {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type) &&
        !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      UI.toast('Only PDF, JPG, or PNG files are accepted.', 'error'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      UI.toast('File size must be under 5 MB.', 'error'); return;
    }
    _droppedFile = file;
    showFilePreview(file);
  }

  function showFilePreview(file) {
    const isImg = file.type.startsWith('image/');
    const section = document.getElementById('upload-section');
    if (!section) return;

    const previewHtml = isImg ? `
      <div style="text-align:center;">
        <img id="cert-preview-img" src="${URL.createObjectURL(file)}"
          style="max-width:100%;max-height:300px;border-radius:var(--radius);border:1px solid var(--border);object-fit:contain;" />
      </div>` : `
      <div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--bg2);
                  border-radius:var(--radius);border:1px solid var(--border);">
        <div style="font-size:48px;">📑</div>
        <div>
          <div style="font-weight:700;margin-bottom:4px;">${file.name}</div>
          <div style="color:var(--text2);font-size:13px;">PDF Document · ${(file.size / 1024).toFixed(1)} KB</div>
        </div>
      </div>`;

    section.innerHTML = `
      <div style="margin-bottom:20px;">${previewHtml}</div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-primary" style="flex:1;min-width:200px;" onclick="VerifyUploadPage.runVerification()">
          🔍 Run Verification (5 Checks)
        </button>
        <button class="btn btn-ghost btn-sm" onclick="VerifyUploadPage.reset()">✕ Clear</button>
      </div>`;
  }

  // ── Run verification ─────────────────────────────────────────────────
  async function runVerification() {
    if (!_droppedFile) { UI.toast('Please upload a certificate first.', 'error'); return; }

    const section = document.getElementById('upload-section');
    if (section) section.innerHTML = renderProgress(0, 'Initializing…');

    try {
      const result = await VerifyEngine.run(_droppedFile, (pct, msg) => {
        const s = document.getElementById('upload-section');
        if (s) s.innerHTML = renderProgress(pct, msg);
      });
      showResults(result, _droppedFile.name);
    } catch (e) {
      UI.toast('Verification error: ' + e.message, 'error');
      reset();
    }
  }

  function renderProgress(pct, msg) {
    return `
    <div style="text-align:center;padding:40px;">
      <div style="font-size:40px;margin-bottom:16px;animation:pulse 1s infinite;">🔬</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Analysing Certificate…</div>
      <div style="color:var(--text2);font-size:13px;margin-bottom:20px;">${msg}</div>
      <div style="background:var(--bg2);border-radius:999px;height:8px;overflow:hidden;max-width:360px;margin:0 auto;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--accent));
                    border-radius:999px;transition:width 0.3s ease;"></div>
      </div>
      <div style="color:var(--text3);font-size:12px;margin-top:8px;">${pct}%</div>
    </div>`;
  }

  function showResults({ checks, verdict, cert }, fileName) {
    const rs = document.getElementById('result-section');
    const us = document.getElementById('upload-section');
    if (us) us.style.display = 'none';
    if (!rs) return;
    rs.style.display = '';

    const checkDefs = [
      { key: 'qr',        icon: '🔲', label: 'QR / Certificate ID Valid' },
      { key: 'metadata',  icon: '📝', label: 'Metadata Matches Record'   },
      { key: 'template',  icon: '🖼️',  label: 'Template Intact'           },
      { key: 'hash',      icon: '#️⃣', label: 'File Hash Verified'        },
      { key: 'tampering', icon: '🔍', label: 'No Tampering Detected'      }
    ];

    const passedCount = Object.values(checks).filter(c => c.pass === true).length;
    const failedCount = Object.values(checks).filter(c => c.pass === false).length;
    const skipCount   = Object.values(checks).filter(c => c.pass === null || c.pass === undefined).length;

    // Helper: per-check badge + row styling based on pass / fail / null
    function checkRow(def) {
      const c = checks[def.key];
      const isPass = c.pass === true;
      const isSkip = c.pass === null || c.pass === undefined;
      const bg     = isSkip ? 'rgba(150,150,180,0.05)'   : isPass ? 'rgba(0,212,170,0.05)'    : 'rgba(255,92,114,0.05)';
      const border = isSkip ? 'rgba(150,150,180,0.2)'    : isPass ? 'rgba(0,212,170,0.2)'     : 'rgba(255,92,114,0.2)';
      const badgeBg= isSkip ? 'rgba(150,150,180,0.15)'   : isPass ? 'rgba(0,212,170,0.15)'    : 'rgba(255,92,114,0.15)';
      const badgeFg= isSkip ? 'var(--text2)'             : isPass ? 'var(--accent)'           : 'var(--danger)';
      const label  = isSkip ? '— SKIP'                   : isPass ? '✓ PASS'                 : '✗ FAIL';
      return `
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;
                  background:${bg};border:1px solid ${border};border-radius:var(--radius-sm);">
        <div style="font-size:20px;margin-top:2px;">${def.icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">
            <span style="font-weight:600;font-size:14px;">${def.label}</span>
            <span style="background:${badgeBg};color:${badgeFg};
                         font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;
                         letter-spacing:0.3px;">${label}</span>
          </div>
          <div style="font-size:12px;color:var(--text2);white-space:pre-wrap;word-break:break-word;line-height:1.6;">${c.detail || ''}</div>
        </div>
      </div>`;
    }

    const verdictIcon = { ORIGINAL: '✅', SUSPICIOUS: '⚠️', FAKE: '❌', INCONCLUSIVE: '❓' };

    rs.innerHTML = `
    <!-- VERDICT BANNER -->
    <div style="background:${verdict.bg};border:2px solid ${verdict.color};border-radius:var(--radius);
                padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:52px;margin-bottom:10px;">${verdictIcon[verdict.verdict] || '❓'}</div>
      <div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:${verdict.color};margin-bottom:8px;">
        ${verdict.label}
      </div>
      <div style="color:var(--text2);font-size:13px;">
        ${passedCount} passed · ${failedCount} failed · ${skipCount} skipped
      </div>
    </div>

    <!-- CHECKS BREAKDOWN -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
                padding:24px;margin-bottom:24px;">
      <div style="font-family:var(--font-display);font-size:17px;font-weight:700;margin-bottom:16px;">
        📋 Verification Checks
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${checkDefs.map(checkRow).join('')}
      </div>
      ${skipCount > 0 ? `<div style="margin-top:14px;padding:10px 14px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--text3);">
        ℹ️ <strong>SKIP</strong> means a check could not run (e.g. template/tampering need PDF.js rendering; metadata needs PDF text). Upload a CertiFlow-generated PDF for all 5 checks.
      </div>` : ''}
    </div>

    <!-- CERTIFICATE DETAILS (if ORIGINAL or SUSPICIOUS with cert) -->
    ${cert && (verdict.verdict === 'ORIGINAL' || verdict.verdict === 'SUSPICIOUS') ? `
    <div style="background:var(--card);border:1px solid ${verdict.verdict === 'ORIGINAL' ? 'rgba(0,212,170,0.3)' : 'rgba(255,181,71,0.3)'};
                border-radius:var(--radius);padding:24px;margin-bottom:24px;">
      <div style="font-family:var(--font-display);font-size:17px;font-weight:700;margin-bottom:16px;
                  color:${verdict.verdict === 'ORIGINAL' ? 'var(--accent)' : 'var(--warning)'};">
        ${verdict.verdict === 'ORIGINAL' ? '✅' : '⚠️'} Certificate Record
      </div>
      <div style="display:grid;gap:8px;">
        ${[
          ['👤 Holder',        cert.studentName],
          ['🎓 Type',          cert.certificateType],
          ['📅 Issue Date',    UI.fmtDate(cert.issueDate)],
          ['🔑 Certificate ID',cert.uniqueCertId],
          ['🏛️ Issued By',    'CertiFlow Platform'],
          ['📊 Status',        cert.status]
        ].map(([l, v]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;
                      padding:9px 12px;background:var(--bg2);border-radius:8px;flex-wrap:wrap;gap:6px;">
            <span style="color:var(--text2);font-size:13px;">${l}</span>
            <span style="font-weight:600;font-size:13px;">${v}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- WARNING for FAKE/SUSPICIOUS -->
    ${verdict.verdict === 'FAKE' || verdict.verdict === 'SUSPICIOUS' ? `
    <div style="background:rgba(255,92,114,0.08);border:1px solid rgba(255,92,114,0.25);
                border-radius:var(--radius);padding:20px;margin-bottom:24px;">
      <div style="font-weight:700;color:var(--danger);margin-bottom:6px;">⚠️ Warning</div>
      <div style="font-size:14px;color:var(--text2);">
        ${verdict.verdict === 'SUSPICIOUS'
          ? 'This certificate raised red flags. Some checks failed — it may have been modified or not issued through CertiFlow. Manual review is recommended before accepting.'
          : 'This certificate could not be verified as genuine. It may be fraudulent, tampered with, or not issued through CertiFlow. Do not accept it without further investigation.'}
      </div>
    </div>` : ''}

    <!-- ACTIONS -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn btn-ghost" onclick="VerifyUploadPage.reset()" style="flex:1;">
        🔄 Verify Another Certificate
      </button>
      ${verdict.verdict !== 'ORIGINAL' ? `
      <button class="btn btn-danger" onclick="VerifyUploadPage.reportFake('${fileName.replace(/'/g,"\\'")}','${verdict.verdict}',{})" style="flex:1;">
        🚨 Report Fake Certificate
      </button>` : ''}
    </div>`;
  }
  }

  // ── Report fake ──────────────────────────────────────────────────────
  function reportFake(fileName, verdict, checks) {
    UI.modal({
      title: '🚨 Report Fake Certificate',
      body: `<div>
        <p style="margin-bottom:14px;">Submit a report for admin review. The analysis results will be attached.</p>
        <label class="form-label">Your Name / Organisation (optional)</label>
        <input class="form-input" id="reporter-name" placeholder="e.g. HR Dept, University Name" style="margin-top:8px;" />
      </div>`,
      confirmText: 'Submit Report',
      danger: true,
      onConfirm: () => {
        const name = document.getElementById('reporter-name')?.value || 'Anonymous';
        DB.addReport({ reportedBy: name, verdict, checksResult: checks, fileName });
        UI.toast('Report submitted. Admin has been alerted.', 'success');
      }
    });
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    _droppedFile = null;
    init();
  }

  function init() {
    document.getElementById('app').innerHTML = renderPublicShell();
  }

  return { init, onDragOver, onDragLeave, onDrop, onFileSelect, runVerification, reportFake, reset };
})();
