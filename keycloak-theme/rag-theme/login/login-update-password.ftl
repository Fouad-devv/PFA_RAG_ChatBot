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

        <div class="kc-mobile-brand">
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
                class="form-control has-toggle <#if messagesPerField.existsError('password-new','password-confirm')>error</#if>"
                autofocus autocomplete="new-password" placeholder="••••••••"/>
              <button type="button" class="pw-toggle" aria-label="Afficher le mot de passe">
                <svg class="eye-show" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg class="eye-hide" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
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
                class="form-control has-toggle <#if messagesPerField.existsError('password-confirm')>error</#if>"
                autocomplete="new-password" placeholder="••••••••"/>
              <button type="button" class="pw-toggle" aria-label="Afficher le mot de passe">
                <svg class="eye-show" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg class="eye-hide" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
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
  <script src="${url.resourcesPath}/js/login.js"></script>
  </#if>

</@layout.registrationLayout>
