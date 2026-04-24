# CertiFlow — Digital Certificate Issuance & Verification System

A full-featured, browser-based digital certificate platform with QR code generation, PDF export, and multi-layer authenticity verification.

---

## 🚀 Live Demo

Open `index.html` directly in any modern browser — **no server required**.

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@certiflow.com | Admin@123 |
| Student | student@demo.com | Student@123 |

---

## ✨ Features

### Core Workflow
- **Student** applies for a certificate → **Admin** approves → PDF auto-generated → Student downloads → Anyone verifies via QR

### Authentication
- Student & Admin login/signup
- Role-based access control (JWT-style session via localStorage)

### Student Dashboard
- Apply for certificates (8 types: Course Completion, Achievement, Internship, etc.)
- Real-time status tracking: Pending → Approved → Issued / Rejected
- Download PDF certificate once issued
- One-click QR-based verification

### Admin Panel
- View all certificate requests in a sortable table
- Filter by status: All / Pending / Approved / Issued / Rejected
- Search by student name
- Approve (auto-generates PDF + QR) or Reject with one click
- Users management panel
- **Fake Reports** dashboard — see all flagged certificate reports

### PDF Certificate Generation
- Beautiful dark-themed certificate with purple/teal gradient borders
- Dynamically populated: student name, type, issue date, unique certificate ID
- Embedded QR code linking to the public verification page
- Unique `CF-XXXXX-XXXX` certificate ID on every certificate
- SHA-256 hash stored at generation time for tamper detection

### 🛡️ Certificate Verification Module (5-Check Engine)
Upload any certificate PDF or image and get an instant authenticity verdict:

| Check | Method |
|-------|--------|
| **QR / ID Valid** | Scans PDF binary text for `CF-XXXXX` pattern + jsQR pixel fallback |
| **Metadata Match** | Extracts raw ASCII from PDF bytes, matches name / type / ID |
| **Template Integrity** | Canvas pixel sampling of border colours vs CertiFlow template |
| **SHA-256 Hash** | Computes hash of uploaded file, compares with hash stored at issuance |
| **Tamper Detection** | Pixel variance analysis across 3 mid-body patches |

**Verdict logic:**
- ✅ All checks pass → **ORIGINAL — Verified Certificate**
- ⚠️ 3–4 pass → **SUSPICIOUS — Manual Review Needed**
- ❌ 0–2 pass → **FAKE — Certificate Not Recognised**
- Inconclusive checks (canvas not rendered) shown as **SKIP** — don't count against the verdict

### Public Verification Page
- No login required — accessible by anyone with the QR link
- Shows: holder name, certificate type, issue date, validity status
- Download button for valid certificates

---

## 🗂️ Project Structure

```
CertiFlow/
├── index.html                  # Entry point
├── css/
│   └── style.css               # Full design system (dark mode, tokens, animations)
└── js/
    ├── db.js                   # localStorage data layer (Users, Certs, Reports)
    ├── auth.js                 # Login, signup, session management
    ├── ui.js                   # Toast, modal, badge helpers
    ├── pdf.js                  # jsPDF certificate generation + SHA-256 hash
    ├── certificates.js         # Apply, approve, reject, stats
    ├── verify-engine.js        # 5-check authenticity engine
    ├── pages-auth.js           # Login/Signup UI
    ├── pages-student.js        # Student dashboard
    ├── pages-admin.js          # Admin panel
    ├── pages-verify.js         # QR-based verification page
    └── pages-verify-upload.js  # Upload-based verification UI
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (ES2020) |
| PDF Generation | [jsPDF 2.5.1](https://github.com/parallax/jsPDF) |
| QR Generation | [QRCode.js 1.0.0](https://github.com/davidshimjs/qrcodejs) |
| QR Scanning | [jsQR 1.4.0](https://github.com/cozmo/jsQR) |
| PDF Rendering | [PDF.js 3.11](https://mozilla.github.io/pdf.js/) |
| Hash | Web Crypto API (`crypto.subtle.digest`) |
| Storage | `localStorage` (zero-backend, runs offline) |
| Fonts | Google Fonts — Inter + Outfit |

---

## 📋 Data Model

### Users
```js
{ id, name, email, password, role: 'student'|'admin', createdAt }
```

### Certificates
```js
{ id, uniqueCertId, studentId, studentName, certificateType,
  issueDate, status, pdf_url, qr_link, fileHash, templateVersion,
  appliedAt, updatedAt }
```

### FakeReports
```js
{ id, reportedBy, verdict, checksResult, fileName, reportedAt }
```

---

## 🔐 Security Notes

- No backend — all data stays in browser localStorage
- Uploaded files are never persisted (processed in-memory only)
- SHA-256 hashing via native Web Crypto API (no external dependency)
- File type validation: only PDF, JPG, PNG accepted (max 5 MB)

---

## 📄 License

MIT — free to use, modify, and distribute.
