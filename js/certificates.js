// ===== CERTIFICATES.JS =====

const Certs = (() => {

  const TYPES = [
    { value: 'Course Completion', icon: '🎓' },
    { value: 'Participation', icon: '🏅' },
    { value: 'Achievement', icon: '🏆' },
    { value: 'Training', icon: '📚' },
    { value: 'Internship', icon: '💼' },
    { value: 'Workshop', icon: '🔬' },
    { value: 'Excellence', icon: '⭐' },
    { value: 'Merit', icon: '🥇' }
  ];

  function getTypeIcon(type) {
    const t = TYPES.find(x => x.value === type);
    return t ? t.icon : '📜';
  }

  function apply(studentId, studentName, certificateType, issueDate) {
    if (!certificateType || !issueDate) return { error: 'Please fill all fields.' };
    return { cert: DB.createCert({ studentId, studentName, certificateType, issueDate }) };
  }

  function approve(certId) {
    const cert = DB.updateCert(certId, { status: 'Approved' });
    if (!cert) return { error: 'Certificate not found.' };
    // Trigger PDF generation
    return PDFGen.generateAndStore(cert).then(updated => ({ cert: updated }));
  }

  function reject(certId) {
    const cert = DB.updateCert(certId, { status: 'Rejected' });
    return cert ? { cert } : { error: 'Not found.' };
  }

  function getStats() {
    const all = DB.getCerts();
    return {
      total: all.length,
      pending: all.filter(c => c.status === 'Pending').length,
      approved: all.filter(c => c.status === 'Approved').length,
      issued: all.filter(c => c.status === 'Issued').length,
      rejected: all.filter(c => c.status === 'Rejected').length
    };
  }

  function getStudentStats(studentId) {
    const all = DB.getCertsByStudent(studentId);
    return {
      total: all.length,
      pending: all.filter(c => c.status === 'Pending').length,
      issued: all.filter(c => c.status === 'Issued').length,
      rejected: all.filter(c => c.status === 'Rejected').length
    };
  }

  return { TYPES, getTypeIcon, apply, approve, reject, getStats, getStudentStats };
})();
