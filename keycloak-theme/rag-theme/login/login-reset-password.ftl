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
      <h1 class="kc-welcome">Récupérez<br><span>votre accès</span></h1>
      <p class="kc-tagline">Ne vous inquiétez pas, entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
      <div class="kc-features">
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Email de récupération</div>
            <div class="kc-feature-desc">Lien envoyé en quelques secondes</div>
          </div>
        </div>
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Lien sécurisé</div>
            <div class="kc-feature-desc">Valable 5 minutes uniquement</div>
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

        <div class="kc-auth-badge"><span class="dot"></span>RÉINITIALISATION</div>
        <h2 class="kc-form-title">Mot de passe oublié</h2>
        <p class="kc-form-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>

        <#if message?has_content>
          <div class="alert alert-${message.type}">${kcSanitize(message.summary)?no_esc}</div>
        </#if>

        <form action="${url.loginAction}" method="post">
          <div class="form-group">
            <label class="form-label" for="username">EMAIL</label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
              </svg>
              <input id="username" name="username"
                type="<#if realm.registrationEmailAsUsername>email<#else>text</#if>"
                class="form-control <#if messagesPerField.existsError('username')>error</#if>"
                value="${(auth.attemptedUsername)!''}" autofocus autocomplete="email"
                placeholder="votre@email.com"/>
            </div>
            <#if messagesPerField.existsError('username')>
              <div class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</div>
            </#if>
          </div>

          <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>

          <button class="btn-primary" type="submit">
            Envoyer le lien
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </form>

        <div style="text-align:center">
          <a class="kc-back" href="${url.loginUrl}">
            <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Retour à la connexion
          </a>
        </div>

      </div>
    </div>

  </div>
  </#if>

</@layout.registrationLayout>
