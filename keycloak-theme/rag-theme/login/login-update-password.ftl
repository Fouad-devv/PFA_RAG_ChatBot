<#import "template.ftl" as layout>
<@layout.registrationLayout; section>

  <#if section = "header"></#if>

  <#if section = "form">
  <div id="kc-container-wrapper">

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
      <div class="kc-sso-badge"><span class="dot"></span>ACCÈS SÉCURISÉ – SSO KEYCLOAK</div>
      <h1 class="kc-welcome">Nouveau<br><span>mot de passe</span></h1>
      <p class="kc-tagline">Choisissez un mot de passe fort pour sécuriser votre compte RAG Assistant.</p>
      <div class="kc-features">
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Minimum 8 caractères</div>
            <div class="kc-feature-desc">Mélangez lettres, chiffres et symboles</div>
          </div>
        </div>
      </div>
    </div>

    <div class="kc-right">
      <div class="kc-form-box">

        <div class="kc-auth-badge"><span class="dot"></span>SÉCURITÉ DU COMPTE</div>
        <h2 class="kc-form-title">Nouveau mot de passe</h2>
        <p class="kc-form-subtitle">Choisissez un nouveau mot de passe sécurisé</p>

        <#if message?has_content>
          <div class="alert alert-${message.type}">${kcSanitize(message.summary)?no_esc}</div>
        </#if>

        <form action="${url.loginAction}" method="post">
          <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>
          <#if isAppInitiatedAction??><input type="hidden" name="logout-sessions" value="on"/></#if>

          <div class="form-group">
            <label class="form-label" for="password-new">NOUVEAU MOT DE PASSE <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input id="password-new" name="password-new" type="password"
                class="form-control <#if messagesPerField.existsError('password-new','password-confirm')>error</#if>"
                autofocus autocomplete="new-password" placeholder="••••••••"/>
            </div>
            <#if messagesPerField.existsError('password-new')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password-new'))?no_esc}</div>
            </#if>
          </div>

          <div class="form-group">
            <label class="form-label" for="password-confirm">CONFIRMER <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input id="password-confirm" name="password-confirm" type="password"
                class="form-control <#if messagesPerField.existsError('password-confirm')>error</#if>"
                autocomplete="new-password" placeholder="••••••••"/>
            </div>
            <#if messagesPerField.existsError('password-confirm')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</div>
            </#if>
          </div>

          <button class="btn-primary" type="submit">
            Enregistrer le mot de passe
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </form>

      </div>
    </div>

  </div>
  </#if>

</@layout.registrationLayout>
