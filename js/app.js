// ===== APP.JS – Main router & entry point =====

const App = (() => {

  function route() {
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get('verify');
    const verifyUpload = params.get('verify-upload');

    // Public: QR-based verification
    if (verifyId) { VerifyPage.init(verifyId); return; }
    // Public: upload-based verification
    if (verifyUpload !== null) { VerifyUploadPage.init(); return; }

    const user = Auth.init();
    if (!user) {
      document.getElementById('app').innerHTML = AuthPages.render();
      return;
    }
    if (user.role === 'admin') AdminPages.init(user);
    else StudentPages.init(user);
  }

  function logout() {
    Auth.logout();
    UI.toast('Signed out successfully.', 'info');
    window.history.replaceState({}, '', window.location.pathname);
    route();
  }

  function showVerify(uniqueCertId) {
    VerifyPage.init(uniqueCertId);
  }

  function showVerifyUpload() {
    VerifyUploadPage.init();
  }

  window.addEventListener('popstate', route);
  document.addEventListener('DOMContentLoaded', route);

  return { route, logout, showVerify, showVerifyUpload };
})();

