// authentification Supabase

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  const SUPABASE_URL = 'https://vqnyrjxnsyndnvmxoqzr.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_BjjvJlNPGP1mT_ypqaAvYA_B_0yyr8F';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function signUp(email, password, name) {
    return supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { display_name: name } }
    });
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email: email, password: password });
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

  function getUserName(session) {
    if (!session || !session.user) return null;
    const meta = session.user.user_metadata || {};
    return meta.display_name || meta.full_name || meta.name
           || session.user.email.split('@')[0];
  }

  // met a jour le header sur toutes les pages si connecte
  async function updateAuthUI() {
    const session = await getSession();
    if (!session) return;

    const name = getUserName(session);

    const actions = document.querySelector('.site-header__actions');
    if (actions) {
      const ghostBtn = actions.querySelector('.btn--ghost');
      const primaryBtn = actions.querySelector('.btn--primary');
      if (ghostBtn) ghostBtn.remove();
      if (primaryBtn) primaryBtn.remove();

      const userSpan = document.createElement('span');
      userSpan.className = 'auth-user';
      userSpan.textContent = name;

      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn btn--ghost btn--sm';
      logoutBtn.textContent = 'Déconnexion';
      logoutBtn.addEventListener('click', signOut);

      actions.appendChild(userSpan);
      actions.appendChild(logoutBtn);
    }

    // menu mobile
    const mobileActions = document.querySelector('.mobile-menu__actions');
    if (mobileActions) {
      VillaNova.clearChildren(mobileActions);

      const userP = document.createElement('p');
      userP.className = 'auth-user auth-user--mobile';
      userP.textContent = 'Bonjour, ' + name;
      mobileActions.appendChild(userP);

      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'btn btn--ghost btn--full';
      logoutLink.textContent = 'Déconnexion';
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        signOut();
      });
      mobileActions.appendChild(logoutLink);
    }

    const bottomAccount = document.querySelector('.bottom-nav__item[href="connexion.html"]');
    if (bottomAccount) bottomAccount.href = 'compte.html';
  }

  // formulaires de la page connexion.html
  function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (!loginForm && !signupForm) return;

    getSession().then(function (session) {
      if (session) window.location.href = 'index.html';
    });

    // onglets
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const panelLogin = document.getElementById('panel-login');
    const panelSignup = document.getElementById('panel-signup');

    if (tabLogin && tabSignup) {
      tabLogin.addEventListener('click', function () {
        tabLogin.classList.add('auth-tabs__tab--active');
        tabLogin.setAttribute('aria-selected', 'true');
        tabSignup.classList.remove('auth-tabs__tab--active');
        tabSignup.setAttribute('aria-selected', 'false');
        panelLogin.hidden = false;
        panelSignup.hidden = true;
      });

      tabSignup.addEventListener('click', function () {
        tabSignup.classList.add('auth-tabs__tab--active');
        tabSignup.setAttribute('aria-selected', 'true');
        tabLogin.classList.remove('auth-tabs__tab--active');
        tabLogin.setAttribute('aria-selected', 'false');
        panelSignup.hidden = false;
        panelLogin.hidden = true;
      });

      if (window.location.hash === '#inscription') tabSignup.click();
    }

    if (loginForm) {
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

    if (signupForm) {
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

    const googleBtn = document.getElementById('google-login');
    if (googleBtn) googleBtn.addEventListener('click', signInWithGoogle);
  }

  function showMsg(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function clearFormErrors(form) {
    const errors = form.querySelectorAll('.auth-form__error, .auth-form__success');
    for (let i = 0; i < errors.length; i++) {
      errors[i].hidden = true;
      errors[i].textContent = '';
    }
  }

  function setLoading(btnId, loading, label) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Chargement…' : label;
  }

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
