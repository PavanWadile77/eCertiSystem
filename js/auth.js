// ===== AUTH.JS =====

const Auth = (() => {
  let currentUser = null;

  function init() {
    currentUser = DB.getSession();
    return currentUser;
  }

  function login(email, password) {
    const user = DB.findUser(email, password);
    if (!user) return { error: 'Invalid email or password.' };
    currentUser = user;
    DB.setSession(user);
    return { user };
  }

  function signup(name, email, password, role) {
    if (!name || !email || !password) return { error: 'All fields are required.' };
    if (password.length < 6) return { error: 'Password must be at least 6 characters.' };
    const result = DB.createUser({ name, email, password, role: role || 'student' });
    if (result.error) return result;
    currentUser = result.user;
    DB.setSession(result.user);
    return { user: result.user };
  }

  function logout() {
    currentUser = null;
    DB.clearSession();
  }

  function getUser() { return currentUser; }
  function isAdmin() { return currentUser && currentUser.role === 'admin'; }
  function isStudent() { return currentUser && currentUser.role === 'student'; }

  return { init, login, signup, logout, getUser, isAdmin, isStudent };
})();
