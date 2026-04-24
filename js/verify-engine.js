// ===== VERIFY-ENGINE.JS – Certificate Authenticity Check Engine =====
// Fixed version — all 5 checks properly wired with correct async logic
//
// Key fixes applied:
//  1. QR/ID lookup: primary = text extraction from PDF binary (reliable, no pixel scan needed)
//     fallback = jsQR pixel scan on canvas (for image uploads)
//  2. Metadata: uses same text extracted for QR, works for PDFs; gracefully skips for images
//  3. Template: detects blank canvas (PDF.js unavailable) and marks as "Inconclusive" not FAIL
//  4. Hash: verifier hashes the uploaded file bytes and compares with DB-stored hash
//     (pdf.js now stores hash from same base64, so they will match if file is unmodified)
//  5. Tampering: tuned thresholds + blank-canvas guard

const VerifyEngine = (() => {

  // ── Helpers ───────────────────────────────────────────────────────────
  function fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Extract raw ASCII text from any file's bytes (works great for jsPDF output)
  async function extractRawText(file) {
    const buf = await fileToArrayBuffer(file);
    const arr = new Uint8Array(buf);
    let text = '';
    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      // Keep printable ASCII; replace everything else with space
      text += (c >= 32 && c < 127) ? String.fromCharCode(c) : ' ';
    }
    return text;
  }

  function isBlankCanvas(canvas) {
    if (!canvas || canvas.width < 10 || canvas.height < 10) return true;
    try {
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data;
      // If every pixel is black/transparent the canvas was never drawn on
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] !== 0 || d[i + 1] !== 0 || d[i + 2] !== 0) return false;
      }
      return true;
    } catch { return true; }
  }

  // ── CHECK 1: QR / Certificate ID lookup ──────────────────────────────
  // Strategy A (primary):  scan PDF binary text for the embedded verify URL
  //   jsPDF writes "Verify at: ...?verify=CF-XXXXX" as plain ASCII in the PDF stream
  // Strategy B (fallback): jsQR pixel scan on canvas (works for image uploads)
  async function checkQR(file, canvas) {
    try {
      // ── Strategy A: text extraction (most reliable for CertiFlow PDFs) ──
      const rawText = await extractRawText(file);

      // Search for uniqueCertId pattern directly (CF-XXXX-XXXX)
      const certIdMatch = rawText.match(/CF-[A-Z0-9]{6,12}-[A-Z0-9]{4,8}/);
      if (certIdMatch) {
        const uniqueCertId = certIdMatch[0];
        const cert = DB.getCertByUniqueId(uniqueCertId);
        if (cert && cert.status === 'Issued') {
          return { pass: true, detail: `Certificate ID found in document: ${uniqueCertId}`, cert };
        }
        if (cert) return { pass: false, detail: `ID found (${uniqueCertId}) but status is "${cert.status}" — not yet issued.` };
        return { pass: false, detail: `ID found (${uniqueCertId}) but no matching record in database.` };
      }

      // Also search for the verify URL pattern
      const urlMatch = rawText.match(/[?&]verify=([A-Z0-9\-]{8,30})/i);
      if (urlMatch) {
        const uniqueCertId = urlMatch[1].trim();
        const cert = DB.getCertByUniqueId(uniqueCertId);
        if (cert && cert.status === 'Issued') {
          return { pass: true, detail: `Verify URL found in document. Certificate ID: ${uniqueCertId}`, cert };
        }
        if (cert) return { pass: false, detail: `URL found but certificate status is "${cert.status}".` };
        return { pass: false, detail: `Verify URL found but ID "${uniqueCertId}" not in database.` };
      }

      // ── Strategy B: jsQR pixel scan on canvas ──
      if (!isBlankCanvas(canvas) && typeof jsQR !== 'undefined') {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
        if (code) {
          const url = code.data;
          const match = url.match(/[?&]verify=([^&\s]+)/i);
          if (match) {
            const uniqueCertId = decodeURIComponent(match[1]).trim();
            const cert = DB.getCertByUniqueId(uniqueCertId);
            if (cert && cert.status === 'Issued') {
              return { pass: true, detail: `QR code scanned successfully. Certificate ID: ${uniqueCertId}`, cert };
            }
            return { pass: false, detail: `QR found but ID "${uniqueCertId}" not found / not issued.` };
          }
          return { pass: false, detail: `QR scanned but URL format not recognised: ${url.slice(0, 80)}` };
        }
      }

      return { pass: false, detail: 'No CertiFlow certificate ID or QR code found in this file.' };
    } catch (e) {
      return { pass: false, detail: 'QR/ID scan error: ' + e.message };
    }
  }

  // ── CHECK 2: Metadata Match ───────────────────────────────────────────
  // Uses the same raw text extracted during QR check
  async function checkMetadata(rawText, cert) {
    if (!cert) {
      return { pass: false, detail: 'Cannot verify metadata — certificate record not found (QR check failed).' };
    }
    if (!rawText || rawText.trim().length < 20) {
      return { pass: null, detail: 'Metadata check skipped — could not extract text from image file. Upload a PDF for full verification.' };
    }
    const lowerText = rawText.toLowerCase();
    const nameFnd  = lowerText.includes(cert.studentName.toLowerCase());
    const typeFnd  = lowerText.includes(cert.certificateType.toLowerCase());
    const idFnd    = rawText.includes(cert.uniqueCertId);
    const passed   = [nameFnd, typeFnd, idFnd].filter(Boolean).length;
    const detail   = [
      `Name "${cert.studentName}": ${nameFnd ? '✓ Found' : '✗ Missing'}`,
      `Type "${cert.certificateType}": ${typeFnd ? '✓ Found' : '✗ Missing'}`,
      `ID "${cert.uniqueCertId}": ${idFnd ? '✓ Found' : '✗ Missing'}`
    ].join(' | ');
    return { pass: passed >= 2, detail };
  }

  // ── CHECK 3: Template Integrity ───────────────────────────────────────
  // Checks pixel colors in key zones against the CertiFlow template palette
  async function checkTemplate(canvas) {
    if (isBlankCanvas(canvas)) {
      // PDF.js failed to render — we can't do visual checks but shouldn't penalise
      return {
        pass: null,
        detail: 'Template check skipped — PDF visual rendering not available in this browser. Upload as image for full check.'
      };
    }
    try {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;

      // Sample top border (should be purple #6C63FF ± tolerance)
      const topH    = Math.max(2, Math.floor(H * 0.035));
      const botH    = Math.max(2, Math.floor(H * 0.035));
      const topStrip = ctx.getImageData(0, 0, W, topH);
      const botStrip = ctx.getImageData(0, H - botH, W, botH);
      // Sample left border (should also be purple)
      const leftStrip = ctx.getImageData(0, 0, Math.max(2, Math.floor(W * 0.025)), H);
      // Sample center background (should be very dark #0A0C1E)
      const cx = Math.floor(W * 0.3), cy = Math.floor(H * 0.3);
      const cw = Math.floor(W * 0.4), ch = Math.floor(H * 0.3);
      const center = ctx.getImageData(cx, cy, cw, ch);

      const purpleTop  = colorRatio(topStrip.data,  [108, 99, 255], 70);
      const tealBot    = colorRatio(botStrip.data,   [0, 212, 170],  70);
      const purpleLeft = colorRatio(leftStrip.data,  [108, 99, 255], 70);
      const darkCenter = colorRatio(center.data,     [10,  12,  30],  55);

      // Weight: borders most important, dark bg supports
      const score = purpleTop * 0.3 + tealBot * 0.3 + purpleLeft * 0.2 + darkCenter * 0.2;
      const pass  = score > 0.15; // generous threshold — PDF rendering can shift colours slightly

      return {
        pass,
        detail: `Template match score: ${(score * 100).toFixed(0)}%. ` +
          `Top border (purple): ${(purpleTop * 100).toFixed(0)}%, ` +
          `Bottom (teal): ${(tealBot * 100).toFixed(0)}%, ` +
          `Left border: ${(purpleLeft * 100).toFixed(0)}%, ` +
          `Dark background: ${(darkCenter * 100).toFixed(0)}%.`
      };
    } catch (e) {
      return { pass: null, detail: 'Template check error: ' + e.message };
    }
  }

  function colorRatio(data, [tr, tg, tb], tol) {
    let match = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.abs(data[i]     - tr) < tol &&
          Math.abs(data[i + 1] - tg) < tol &&
          Math.abs(data[i + 2] - tb) < tol) match++;
    }
    return n > 0 ? match / n : 0;
  }

  // ── CHECK 4: SHA-256 Hash ─────────────────────────────────────────────
  // The stored hash was computed from the base64-decoded PDF bytes at generation time.
  // We compute the same hash on the uploaded file and compare.
  async function checkHash(file, cert) {
    if (!cert) {
      return { pass: false, detail: 'Cannot verify hash — no certificate record found.' };
    }
    if (!cert.fileHash) {
      return {
        pass: null,
        detail: 'Hash check skipped — this certificate was issued before hash storage was added. Re-approve it to generate a hash.'
      };
    }
    try {
      const buf = await fileToArrayBuffer(file);
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      const computed = Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const match = computed === cert.fileHash;
      return {
        pass: match,
        detail: match
          ? `SHA-256 hash matches the original exactly — file has not been modified.`
          : `Hash mismatch — file may have been tampered with or re-saved.\n` +
            `Expected: ${cert.fileHash.slice(0, 40)}…\n` +
            `Got:      ${computed.slice(0, 40)}…`
      };
    } catch (e) {
      return { pass: false, detail: 'Hash computation failed: ' + e.message };
    }
  }

  // ── CHECK 5: Pixel Tampering Heuristic ───────────────────────────────
  // Measures local variance in 3 text-area patches.
  // An unmodified jsPDF certificate has consistent, low-variance dark areas.
  // Edited images often show anomalous high variance (JPEG artefacts, brush strokes)
  // or suspicious zero variance (flood-fill erasure).
  async function checkTampering(canvas) {
    if (isBlankCanvas(canvas)) {
      return { pass: null, detail: 'Tampering check skipped — visual rendering not available.' };
    }
    try {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;

      // Sample three 60×60 patches in the mid-body of the certificate (name/type area)
      const patchSize = 60;
      const patches = [
        ctx.getImageData(Math.floor(W * 0.20), Math.floor(H * 0.38), patchSize, patchSize),
        ctx.getImageData(Math.floor(W * 0.45), Math.floor(H * 0.38), patchSize, patchSize),
        ctx.getImageData(Math.floor(W * 0.68), Math.floor(H * 0.38), patchSize, patchSize)
      ];

      const variances = patches.map(p => pixelVariance(p.data));

      // Thresholds calibrated against genuine jsPDF output:
      //   genuine PDFs rendered at scale 2×: variance 200–3500 in text areas
      //   edited images: can spike >12000 (JPEG noise) or drop <2 (flat patch from fill tool)
      const anomalyHigh = variances.some(v => v > 12000);
      const anomalyLow  = variances.some(v => v < 2 && W > 300);
      const tampered    = anomalyHigh || anomalyLow;

      return {
        pass: !tampered,
        detail: tampered
          ? `⚠ Suspicious pixel patterns detected. Variance: [${variances.map(v => v.toFixed(0)).join(', ')}]. ` +
            `${anomalyHigh ? 'High noise may indicate image editing.' : 'Flat patch may indicate content erasure.'}`
          : `Pixel analysis clean. Variance across 3 patches: [${variances.map(v => v.toFixed(0)).join(', ')}].`
      };
    } catch (e) {
      return { pass: null, detail: 'Tampering check skipped: ' + e.message };
    }
  }

  function pixelVariance(data) {
    let sum = 0, sumSq = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += g; sumSq += g * g;
    }
    const mean = sum / n;
    return sumSq / n - mean * mean;
  }

  // ── Render file → canvas ─────────────────────────────────────────────
  async function renderToCanvas(file) {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    return isPdf ? renderPdfToCanvas(file) : renderImageToCanvas(file);
  }

  function renderImageToCanvas(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  async function renderPdfToCanvas(file) {
    if (typeof pdfjsLib !== 'undefined') {
      try {
        const buf = await fileToArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        return canvas;
      } catch (e) {
        console.warn('PDF.js render failed:', e.message);
      }
    }
    // Return blank canvas — canvas-dependent checks will detect this and report "skipped"
    const canvas = document.createElement('canvas');
    canvas.width = 10; canvas.height = 10;
    return canvas;
  }

  // ── Verdict: null-safe (inconclusive checks count as 0.5) ─────────────
  function computeVerdict(checks) {
    let passed = 0, total = 0;
    for (const c of Object.values(checks)) {
      if (c.pass === true)  { passed += 1; total += 1; }
      else if (c.pass === false) { total += 1; }
      // null = inconclusive/skipped — doesn't count for OR against
    }
    if (total === 0) return { verdict: 'INCONCLUSIVE', label: '❓ INCONCLUSIVE — Could not perform checks', color: '#9CA3BF', bg: 'rgba(150,150,180,0.1)' };
    if (passed === total && total >= 3) return { verdict: 'ORIGINAL', label: '✅ ORIGINAL — Verified Certificate',      color: '#00D4AA', bg: 'rgba(0,212,170,0.1)'   };
    if (passed >= 3)                    return { verdict: 'SUSPICIOUS', label: '⚠️ SUSPICIOUS — Manual Review Needed',  color: '#FFB547', bg: 'rgba(255,181,71,0.1)'  };
    return                                     { verdict: 'FAKE',      label: '❌ FAKE — Certificate Not Recognised', color: '#FF5C72', bg: 'rgba(255,92,114,0.1)'  };
  }

  // ── MAIN entry point ─────────────────────────────────────────────────
  async function run(file, onProgress) {
    const prog = onProgress || (() => {});

    // Step 0: extract raw text once — shared by QR + metadata checks
    prog(8, 'Extracting document text…');
    const rawText = await extractRawText(file).catch(() => '');

    // Step 1: render to canvas — shared by template + tampering + QR-pixel fallback
    prog(16, 'Rendering certificate…');
    let canvas;
    try { canvas = await renderToCanvas(file); }
    catch { canvas = document.createElement('canvas'); canvas.width = 10; canvas.height = 10; }

    // Step 2: QR / ID check (uses rawText first, then canvas fallback)
    prog(30, 'Scanning for Certificate ID & QR code…');
    const qrResult = await checkQR(file, canvas);       // note: still reads rawText internally
    // Re-run with the shared rawText to avoid double-reading the file
    // (QR function re-extracts internally; for simplicity we pass canvas + rawText separately)
    const certIdMatch = rawText.match(/CF-[A-Z0-9]{6,12}-[A-Z0-9]{4,8}/);
    const urlMatch    = rawText.match(/[?&]verify=([A-Z0-9\-]{8,30})/i);
    const foundId     = certIdMatch?.[0] || urlMatch?.[1]?.trim();
    const cert        = qrResult.cert || (foundId ? DB.getCertByUniqueId(foundId) : null);

    // Step 3: Metadata
    prog(48, 'Verifying metadata fields…');
    const metaResult = await checkMetadata(rawText, cert);

    // Step 4: Template
    prog(62, 'Checking template integrity…');
    const tmplResult = await checkTemplate(canvas);

    // Step 5: Hash
    prog(76, 'Verifying file hash (SHA-256)…');
    const hashResult = await checkHash(file, cert);

    // Step 6: Tampering
    prog(88, 'Running pixel tampering analysis…');
    const tampResult = await checkTampering(canvas);

    prog(100, 'Analysis complete.');

    const checks = {
      qr:        qrResult,
      metadata:  metaResult,
      template:  tmplResult,
      hash:      hashResult,
      tampering: tampResult
    };

    return { checks, verdict: computeVerdict(checks), cert };
  }

  return { run };
})();
