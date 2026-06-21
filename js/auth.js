// authentification Supabase

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  const supabase = window.supabase.createClient(
    VillaNova.config.supabaseUrl,
    VillaNova.config.supabaseAnonKey
  );

  // --- Appels à Supabase ---

  async function signUp(email, password, name) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } }
    });
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/index.html' }
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  }

  async function getSession() {
    const result = await supabase.auth.getSession();
    return result.data.session;
  }

  // Trouve un nom à afficher pour l'utilisateur connecté.
  function getUserName(session) {
    if (!session || !session.user) return null;
    const meta = session.user.user_metadata || {};
    return meta.display_name || meta.full_name || meta.name
           || session.user.email.split('@')[0];
  }

  // --- Petit utilitaire pour créer un élément HTML ---

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  // --- Mise à jour de l'affichage quand on est connecté ---

  async function updateAuthUI() {
    const session = await getSession();
    if (!session) return;

    const name = getUserName(session);

    updateHeaderActions(name);
    updateMobileMenu(name);
    updateBottomNav();
  }

  // En-tête du haut (version bureau).
  function updateHeaderActions(name) {
    const actions = document.querySelector('.site-header__actions');
    if (!actions) return;

    // On enlève les boutons "Connexion / Inscription".
    const ghostBtn = actions.querySelector('.btn--ghost');
    const primaryBtn = actions.querySelector('.btn--primary');
    if (ghostBtn) ghostBtn.remove();
    if (primaryBtn) primaryBtn.remove();

    // On affiche le nom + un bouton de déconnexion.
    const userSpan = createEl('span', 'auth-user', name);

    const logoutBtn = createEl('button', 'btn btn--ghost btn--sm', 'Déconnexion');
    logoutBtn.type = 'button';
    logoutBtn.addEventListener('click', signOut);

    actions.appendChild(userSpan);
    actions.appendChild(logoutBtn);
  }

  // Menu mobile.
  function updateMobileMenu(name) {
    const mobileActions = document.querySelector('.mobile-menu__actions');
    if (!mobileActions) return;

    VillaNova.clearChildren(mobileActions);

    const userP = createEl('p', 'auth-user auth-user--mobile', 'Bonjour, ' + name);
    mobileActions.appendChild(userP);

    const logoutLink = createEl('a', 'btn btn--ghost btn--full', 'Déconnexion');
    logoutLink.href = '#';
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      signOut();
    });
    mobileActions.appendChild(logoutLink);
  }

  // Barre du bas : le lien "Connexion" devient "Compte".
  function updateBottomNav() {
    const bottomAccount = document.querySelector('.bottom-nav__item[href="connexion.html"]');
    if (bottomAccount) bottomAccount.href = 'compte.html';
  }

  // --- Page connexion.html ---

  function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (!loginForm && !signupForm) return;

    // Déjà connecté ? On repart vers l'accueil.
    getSession().then(function (session) {
      if (session) window.location.href = 'index.html';
    });

    initTabs();
    initLoginForm(loginForm);
    initSignupForm(signupForm);

    const googleBtn = document.getElementById('google-login');
    if (googleBtn) googleBtn.addEventListener('click', signInWithGoogle);
  }

  // Bascule entre les onglets "Connexion" et "Inscription".
  function initTabs() {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const panelLogin = document.getElementById('panel-login');
    const panelSignup = document.getElementById('panel-signup');
    if (!tabLogin || !tabSignup) return;

    tabLogin.addEventListener('click', function () {
      showTab(tabLogin, panelLogin, tabSignup, panelSignup);
    });
    tabSignup.addEventListener('click', function () {
      showTab(tabSignup, panelSignup, tabLogin, panelLogin);
    });

    if (window.location.hash === '#inscription') tabSignup.click();
  }

  // Active un onglet + son panneau, désactive l'autre.
  function showTab(activeTab, activePanel, otherTab, otherPanel) {
    activeTab.classList.add('auth-tabs__tab--active');
    activeTab.setAttribute('aria-selected', 'true');
    otherTab.classList.remove('auth-tabs__tab--active');
    otherTab.setAttribute('aria-selected', 'false');
    activePanel.hidden = false;
    otherPanel.hidden = true;
  }

  function initLoginForm(loginForm) {
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearFormErrors(loginForm);

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        showMsg('login-global-error', 'Veuillez remplir tous les champs.');
        return;
      }

      setLoading('login-submit', true, 'Se connecter');
      const result = await signIn(email, password);
      setLoading('login-submit', false, 'Se connecter');

      if (result.error) {
        showMsg('login-global-error', 'Email ou mot de passe incorrect.');
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  function initSignupForm(signupForm) {
    if (!signupForm) return;

    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearFormErrors(signupForm);

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      if (!name || !email || !password) {
        showMsg('signup-global-error', 'Veuillez remplir tous les champs.');
        return;
      }
      if (password.length < 6) {
        showMsg('signup-password-error', 'Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }

      setLoading('signup-submit', true, 'Créer mon compte');
      const result = await signUp(email, password, name);
      setLoading('signup-submit', false, 'Créer mon compte');

      if (result.error) {
        showMsg('signup-global-error', result.error.message);
      } else if (result.data.session) {
        window.location.href = 'index.html';
      } else {
        showMsg('signup-success', 'Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
      }
    });
  }

  // --- Affichage des messages ---

  function showMsg(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function clearFormErrors(form) {
    const errors = form.querySelectorAll('.auth-form__error, .auth-form__success');
    for (const error of errors) {
      error.hidden = true;
      error.textContent = '';
    }
  }

  function setLoading(btnId, loading, label) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Chargement…' : label;
  }

  // --- Démarrage ---

  updateAuthUI();
  initAuthForms();

  VillaNova.supabase = supabase;
  VillaNova.auth = {
    signUp: signUp,
    signIn: signIn,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    getSession: getSession,
    getUserName: getUserName,
    updateAuthUI: updateAuthUI
  };
})();