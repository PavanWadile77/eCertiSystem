// ===== DB.JS – localStorage-based data layer =====

const DB = (() => {
  const PREFIX = 'certiflow_';

  function get(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)) || []; }
    catch { return []; }
  }

  function set(key, val) {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  }

  function getObj(key, def = null) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)) || def; }
    catch { return def; }
  }

  function setObj(key, val) {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  }

  // ---- Users ----
  function getUsers() { return get('users'); }
  function saveUsers(users) { set('users', users); }

  function createUser({ name, email, password, role }) {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { error: 'Email already registered.' };
    const user = {
      id: 'usr_' + Date.now() + Math.random().toString(36).slice(2, 7),
      name, email, password, role,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    return { user };
  }

  function findUser(email, password) {
    const users = getUsers();
    return users.find(u => u.email === email && u.password === password) || null;
  }

  // ---- Certificates ----
  function getCerts() { return get('certs'); }
  function saveCerts(certs) { set('certs', certs); }

  function createCert({ studentId, studentName, certificateType, issueDate }) {
    const certs = getCerts();
    const cert = {
      id: 'cert_' + Date.now() + Math.random().toString(36).slice(2, 7),
      uniqueCertId: 'CF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      studentId, studentName, certificateType, issueDate,
      status: 'Pending',
      pdf_url: null, qr_link: null,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    certs.push(cert);
    saveCerts(certs);
    return cert;
  }

  function getCertsByStudent(studentId) {
    return getCerts().filter(c => c.studentId === studentId);
  }

  function getCertById(id) {
    return getCerts().find(c => c.id === id) || null;
  }

  function getCertByUniqueId(uniqueCertId) {
    return getCerts().find(c => c.uniqueCertId === uniqueCertId) || null;
  }

  function updateCert(id, updates) {
    const certs = getCerts();
    const idx = certs.findIndex(c => c.id === id);
    if (idx === -1) return null;
    certs[idx] = { ...certs[idx], ...updates, updatedAt: new Date().toISOString() };
    saveCerts(certs);
    return certs[idx];
  }

  // ---- Fake Reports ----
  function getReports() { return get('reports'); }
  function addReport({ reportedBy, verdict, checksResult, fileName }) {
    const reports = getReports();
    const report = {
      id: 'rep_' + Date.now(),
      reportedBy: reportedBy || 'Anonymous',
      verdict, checksResult, fileName,
      reportedAt: new Date().toISOString()
    };
    reports.push(report);
    set('reports', reports);
    return report;
  }

  // ---- Session ----
  function getSession() { return getObj('session'); }
  function setSession(user) { setObj('session', user); }
  function clearSession() { localStorage.removeItem(PREFIX + 'session'); }

  // ---- Seed admin if none exists ----
  function seedAdmin() {
    const users = getUsers();
    if (!users.find(u => u.role === 'admin')) {
      createUser({ name: 'Admin', email: 'admin@certiflow.com', password: 'Admin@123', role: 'admin' });
    }
  }

  seedAdmin();

  return {
    createUser, findUser, getUsers,
    createCert, getCerts, getCertsByStudent, getCertById, getCertByUniqueId, updateCert,
    getReports, addReport,
    getSession, setSession, clearSession
  };
})();
