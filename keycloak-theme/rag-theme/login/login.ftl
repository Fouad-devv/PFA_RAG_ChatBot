<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

  <#if section = "header"></#if>

  <#if section = "form">
  <div id="kc-container-wrapper">

    <!-- LEFT PANEL -->
    <div class="kc-left">
      <div class="kc-brand">
        <div class="kc-brand-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
          </svg>
        </div>
        <div class="kc-brand-text">
          <div class="kc-brand-name">RAG Assistant</div>
          <div class="kc-brand-ver">v1.0</div>
        </div>
      </div>

      <div class="kc-sso-badge">
        <span class="dot"></span>
        ACCÈS SÉCURISÉ – SSO KEYCLOAK
      </div>

      <h1 class="kc-welcome">Bienvenue sur votre<br><span>assistant juridique</span></h1>
      <p class="kc-tagline">Posez vos questions sur le droit du travail marocain et obtenez des réponses précises basées sur les textes officiels.</p>

      <div class="kc-features">
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">RAG Intelligent</div>
            <div class="kc-feature-desc">Recherche sémantique dans les textes juridiques</div>
          </div>
        </div>
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Droit du Travail</div>
            <div class="kc-feature-desc">Code du travail marocain intégral</div>
          </div>
        </div>
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Réponses Précises</div>
            <div class="kc-feature-desc">Basées sur les sources officielles</div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="kc-right">
      <div class="kc-form-box">

        <div class="kc-auth-badge">
          <span class="dot"></span>
          AUTHENTIFICATION SÉCURISÉE
        </div>

        <h2 class="kc-form-title">Connectez-vous</h2>
        <p class="kc-form-subtitle">Entrez vos identifiants pour accéder à RAG Assistant</p>

        <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
          <div class="alert alert-${message.type}">${kcSanitize(message.summary)?no_esc}</div>
        </#if>

        <form action="${url.loginAction}" method="post">
          <input type="hidden" name="credentialId" value="${(auth.selectedCredential)!''}"/>

          <!-- Username -->
          <div class="form-group">
            <label class="form-label" for="username">
              <#if realm.registrationEmailAsUsername>EMAIL<#else>NOM D'UTILISATEUR</#if>
            </label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
              </svg>
              <input
                id="username" name="username"
                type="<#if realm.registrationEmailAsUsername>email<#else>text</#if>"
                class="form-control <#if messagesPerField.existsError('username','password')>error</#if>"
                value="${(login.username!'')}"
                autofocus autocomplete="<#if realm.registrationEmailAsUsername>email<#else>username</#if>"
                placeholder="<#if realm.registrationEmailAsUsername>votre@email.com<#else>Nom d'utilisateur</#if>"
              />
            </div>
            <#if messagesPerField.existsError('username')>
              <div class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</div>
            </#if>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label" for="password">MOT DE PASSE</label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input
                id="password" name="password" type="password"
                class="form-control <#if messagesPerField.existsError('username','password')>error</#if>"
                autocomplete="current-password" placeholder="••••••••"
              />
            </div>
            <#if messagesPerField.existsError('password')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</div>
            </#if>
          </div>

          <!-- Remember me + Forgot -->
          <div class="kc-options">
            <#if realm.rememberMe && !usernameEditDisabled??>
              <label class="kc-remember">
                <input type="checkbox" name="rememberMe" <#if login.rememberMe??>checked</#if>>
                Se souvenir de moi
              </label>
            <#else><span></span></#if>
            <#if realm.resetPasswordAllowed>
              <a class="kc-forgot" href="${url.loginResetCredentialsUrl}">Mot de passe oublié ?</a>
            </#if>
          </div>

          <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>

          <button class="btn-primary" type="submit">
            Se connecter
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </form>

        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
          <div class="kc-footer">
            Pas encore de compte ?<a href="${url.registrationUrl}">Créer un compte</a>
          </div>
        </#if>

      </div>
    </div>

  </div>
  </#if>

</@layout.registrationLayout>
