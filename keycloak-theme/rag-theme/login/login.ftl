<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

  <#if section = "header"></#if>

  <#if section = "form">
  <div id="kc-container-wrapper">
    <div id="kc-container">
      <div class="kc-card">

        <!-- Logo -->
        <div class="kc-logo">
          <div class="kc-logo-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>
          <div>
            <div class="kc-title">Connectez-vous</div>
            <div class="kc-subtitle">RAG Assistant · ${realm.displayName!''}</div>
          </div>
        </div>

        <!-- Alert -->
        <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
          <div class="alert alert-${message.type}">
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <!-- Form -->
        <form action="${url.loginAction}" method="post">
          <input type="hidden" name="credentialId" value="${(auth.selectedCredential)!''}"/>

          <!-- Username -->
          <div class="form-group">
            <label class="form-label" for="username">
              <#if !realm.loginWithEmailAllowed>Nom d'utilisateur
              <#elseif !realm.registrationEmailAsUsername>Nom d'utilisateur ou email
              <#else>Email
              </#if>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              class="form-control <#if messagesPerField.existsError('username','password')>error</#if>"
              value="${(login.username!'')}"
              autofocus
              autocomplete="username"
              placeholder="Votre nom d'utilisateur"
            />
            <#if messagesPerField.existsError('username')>
              <div class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</div>
            </#if>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              class="form-control <#if messagesPerField.existsError('username','password')>error</#if>"
              autocomplete="current-password"
              placeholder="Votre mot de passe"
            />
            <#if messagesPerField.existsError('password')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</div>
            </#if>
          </div>

          <!-- Remember me + Forgot password -->
          <div class="kc-options">
            <#if realm.rememberMe && !usernameEditDisabled??>
              <label class="kc-remember">
                <input type="checkbox" name="rememberMe" <#if login.rememberMe??>checked</#if>>
                Se souvenir de moi
              </label>
            <#else>
              <span></span>
            </#if>

            <#if realm.resetPasswordAllowed>
              <a class="kc-forgot" href="${url.loginResetCredentialsUrl}">Mot de passe oublié ?</a>
            </#if>
          </div>

          <!-- Submit -->
          <input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/>
          <button class="btn-primary" type="submit">Se connecter</button>
        </form>

        <!-- Register link -->
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
          <div class="kc-divider"><span>ou</span></div>
          <div class="kc-footer">
            Nouvel utilisateur ?<a href="${url.registrationUrl}">Créer un compte</a>
          </div>
        </#if>

      </div>
    </div>
  </div>
  </#if>

</@layout.registrationLayout>
