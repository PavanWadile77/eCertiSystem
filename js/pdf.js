// ===== PDF.JS – Certificate PDF Generation =====

const PDFGen = (() => {

  // Generate QR code as data URL
  function generateQR(text) {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;background:#fff;padding:8px;';
      document.body.appendChild(div);
      const qr = new QRCode(div, {
        text, width: 120, height: 120,
        correctLevel: QRCode.CorrectLevel.M
      });
      setTimeout(() => {
        const canvas = div.querySelector('canvas');
        const imgEl = div.querySelector('img');
        let dataUrl = '';
        if (canvas) {
          dataUrl = canvas.toDataURL('image/png');
        } else if (imgEl) {
          dataUrl = imgEl.src;
        }
        document.body.removeChild(div);
        resolve(dataUrl);
      }, 350);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  async function generateAndStore(cert) {
    const verifyUrl = `${window.location.origin}${window.location.pathname}?verify=${cert.uniqueCertId}`;
    const qrDataUrl = await generateQR(verifyUrl);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210;

    // Background
    doc.setFillColor(10, 12, 30);
    doc.rect(0, 0, W, H, 'F');

    // Gradient border effect (top & bottom bars)
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, W, 6, 'F');
    doc.setFillColor(0, 212, 170);
    doc.rect(0, H - 6, W, 6, 'F');

    // Side borders
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, 6, H, 'F');
    doc.setFillColor(0, 212, 170);
    doc.rect(W - 6, 0, 6, H, 'F');

    // Inner border
    doc.setDrawColor(108, 99, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, 12, W - 24, H - 24, 4, 4, 'S');

    // Decorative circles
    doc.setFillColor(108, 99, 255);
    doc.setGState(new doc.GState({ opacity: 0.06 }));
    doc.circle(50, 50, 60, 'F');
    doc.circle(W - 50, H - 50, 50, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Logo / Brand at top
    doc.setFontSize(11);
    doc.setTextColor(150, 140, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFLOW', W / 2, 28, { align: 'center' });

    // Decorative line under brand
    doc.setDrawColor(108, 99, 255);
    doc.setLineWidth(0.3);
    doc.line(W / 2 - 30, 31, W / 2 + 30, 31);

    // "Certificate of" label
    doc.setFontSize(13);
    doc.setTextColor(180, 175, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Certificate of', W / 2, 48, { align: 'center' });

    // Certificate type
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(cert.certificateType.toUpperCase(), W / 2, 62, { align: 'center' });

    // Horizontal rule
    doc.setDrawColor(108, 99, 255);
    doc.setLineWidth(0.4);
    doc.line(60, 67, W - 60, 67);

    // "Proudly Presented to"
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('This is to proudly certify that', W / 2, 78, { align: 'center' });

    // Student Name
    doc.setFontSize(28);
    doc.setTextColor(0, 212, 170);
    doc.setFont('helvetica', 'bold');
    doc.text(cert.studentName, W / 2, 96, { align: 'center' });

    // Description
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 200);
    doc.setFont('helvetica', 'normal');
    const desc = `has successfully completed the requirements for the ${cert.certificateType} certificate.`;
    doc.text(desc, W / 2, 108, { align: 'center', maxWidth: 160 });

    // Issue date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 180);
    doc.text(`Issue Date: ${formatDate(cert.issueDate)}`, W / 2 - 40, 126, { align: 'center' });

    // Certificate ID
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 160);
    doc.setFont('courier', 'normal');
    doc.text(`Certificate ID: ${cert.uniqueCertId}`, W / 2, 135, { align: 'center' });

    // Signature line
    doc.setDrawColor(100, 100, 140);
    doc.setLineWidth(0.3);
    doc.line(60, 158, 120, 158);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', 90, 164, { align: 'center' });
    doc.text('CertiFlow Platform', 90, 170, { align: 'center' });

    // Seal circle
    doc.setDrawColor(0, 212, 170);
    doc.setLineWidth(0.8);
    doc.setFillColor(10, 12, 30);
    doc.circle(W / 2, 157, 14, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(0, 212, 170);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL', W / 2, 154, { align: 'center' });
    doc.text('SEAL', W / 2, 160, { align: 'center' });

    // QR Code
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', W - 55, 138, 36, 36);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 160);
        doc.setFont('helvetica', 'normal');
        doc.text('Scan to verify', W - 37, 177, { align: 'center' });
      } catch (e) { /* ignore QR image error */ }
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 110);
    doc.text(`Verify at: ${verifyUrl}`, W / 2, H - 14, { align: 'center', maxWidth: 200 });

    // Save as data URL (base64)
    const pdfDataUrl = doc.output('datauristring');

    // Compute SHA-256 hash from the SAME base64 bytes that become the download.
    // We MUST NOT call doc.output() again — jsPDF embeds a creation timestamp so
    // a second call produces different bytes, making the stored hash unmatchable.
    let fileHash = '';
    try {
      const base64 = pdfDataUrl.split(',')[1];           // strip "data:application/pdf;base64,"
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const hashBuf = await crypto.subtle.digest('SHA-256', bytes.buffer);
      fileHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { /* crypto not available */ }

    // Store in DB
    const updated = DB.updateCert(cert.id, {
      status: 'Issued',
      pdf_url: pdfDataUrl,
      qr_link: verifyUrl,
      fileHash,
      templateVersion: 'v1'
    });

    return updated;
  }

  function downloadCert(cert) {
    if (!cert.pdf_url) { UI.toast('PDF not available yet.', 'error'); return; }
    const { jsPDF } = window.jspdf;
    // Re-trigger download from stored data URL
    const link = document.createElement('a');
    link.href = cert.pdf_url;
    link.download = `CertiFlow_${cert.uniqueCertId}.pdf`;
    link.click();
  }

  return { generateAndStore, generateQR, downloadCert };
})();
