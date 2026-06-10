// authentification VillaNova via Supabase

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  // --- configuration Supabase ---
 
  var SUPABASE_URL = 'https://vqnyrjxnsyndnvmxoqzr.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_BjjvJlNPGP1mT_ypqaAvYA_B_0yyr8F';

  // --- client Supabase (singleton) ---
  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // utilitaire local (au cas ou event-card.js n'est pas charge)
  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // ============================================================
  // FONCTIONS D'AUTHENTIFICATION
  // ============================================================

  // inscription avec email/mot de passe
  async function signUp(email, password, name) {
    return supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { display_name: name }
      }
    });
  }

  // connexion avec email/mot de passe
  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
  }

  // connexion avec Google OAuth
  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/index.html'
      }
    });
  }

  // deconnexion
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  }

  // recupere la session courante
  async function getSession() {
    var result = await supabase.auth.getSession();
    return result.data.session;
  }

  // extrait le nom affichable depuis la session
  function getUserName(session) {
    if (!session || !session.user) return null;
    var meta = session.user.user_metadata || {};
    return meta.display_name || meta.full_name || meta.name
           || session.user.email.split('@')[0];
  }

  // ============================================================
  // MISE A JOUR DU HEADER (toutes les pages)
  // ============================================================

  async function updateAuthUI() {
    var session = await getSession();
    if (!session) return;

    var name = getUserName(session);

    // header desktop
    var actions = document.querySelector('.site-header__actions');
    if (actions) {
      var ghostBtn = actions.querySelector('.btn--ghost');
      var primaryBtn = actions.querySelector('.btn--primary');
      if (ghostBtn) ghostBtn.remove();
      if (primaryBtn) primaryBtn.remove();

      var userSpan = document.createElement('span');
      userSpan.className = 'auth-user';
      userSpan.textContent = name;

      var logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn btn--ghost btn--sm';
      logoutBtn.textContent = 'Déconnexion';
      logoutBtn.addEventListener('click', signOut);

      actions.appendChild(userSpan);
      actions.appendChild(logoutBtn);
    }

    // menu mobile
    var mobileActions = document.querySelector('.mobile-menu__actions');
    if (mobileActions) {
      clearChildren(mobileActions);

      var userP = document.createElement('p');
      userP.className = 'auth-user auth-user--mobile';
      userP.textContent = 'Bonjour, ' + name;
      mobileActions.appendChild(userP);

      var logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'btn btn--ghost btn--full';
      logoutLink.textContent = 'Déconnexion';
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        signOut();
      });
      mobileActions.appendChild(logoutLink);
    }

    // bottom nav mobile
    var bottomAccount = document.querySelector('.bottom-nav__item[href="connexion.html"]');
    if (bottomAccount) {
      bottomAccount.href = 'compte.html';
    }
  }

  // ============================================================
  // FORMULAIRES DE CONNEXION (page connexion.html)
  // ============================================================

  function initAuthForms() {
    var loginForm = document.getElementById('login-form');
    var signupForm = document.getElementById('signup-form');
    if (!loginForm && !signupForm) return;

    // si deja connecte, rediriger
    getSession().then(function (session) {
      if (session) window.location.href = 'index.html';
    });

    // onglets
    var tabLogin = document.getElementById('tab-login');
    var tabSignup = document.getElementById('tab-signup');
    var panelLogin = document.getElementById('panel-login');
    var panelSignup = document.getElementById('panel-signup');

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

      // ouvrir l'onglet inscription si #inscription dans l'URL
      if (window.location.hash === '#inscription') {
        tabSignup.click();
      }
    }

    // soumission du formulaire de connexion
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearFormErrors(loginForm);

        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;

        if (!email || !password) {
          showError('login-global-error', 'Veuillez remplir tous les champs.');
          return;
        }

        setLoading('login-submit', true, 'Se connecter');
        var result = await signIn(email, password);
        setLoading('login-submit', false, 'Se connecter');

        if (result.error) {
          showError('login-global-error', 'Email ou mot de passe incorrect.');
        } else {
          window.location.href = 'index.html';
        }
      });
    }

    // soumission du formulaire d'inscription
    if (signupForm) {
      signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearFormErrors(signupForm);

        var name = document.getElementById('signup-name').value.trim();
        var email = document.getElementById('signup-email').value.trim();
        var password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
          showError('signup-global-error', 'Veuillez remplir tous les champs.');
          return;
        }
        if (password.length < 6) {
          showError('signup-password-error', 'Le mot de passe doit contenir au moins 6 caractères.');
          return;
        }

        setLoading('signup-submit', true, 'Créer mon compte');
        var result = await signUp(email, password, name);
        setLoading('signup-submit', false, 'Créer mon compte');

        if (result.error) {
          showError('signup-global-error', result.error.message);
        } else if (result.data.session) {
          // email confirmation desactivee : connexion directe
          window.location.href = 'index.html';
        } else {
          // email confirmation activee
          showSuccess('signup-success', 'Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
        }
      });
    }

    // bouton Google OAuth
    var googleBtn = document.getElementById('google-login');
    if (googleBtn) {
      googleBtn.addEventListener('click', signInWithGoogle);
    }
  }

  // --- utilitaires formulaires ---

  function showError(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function showSuccess(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function clearFormErrors(form) {
    var errors = form.querySelectorAll('.auth-form__error, .auth-form__success');
    for (var i = 0; i < errors.length; i++) {
      errors[i].hidden = true;
      errors[i].textContent = '';
    }
  }

  function setLoading(btnId, loading, label) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Chargement…' : label;
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  updateAuthUI();
  initAuthForms();

  // export sur le namespace
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
