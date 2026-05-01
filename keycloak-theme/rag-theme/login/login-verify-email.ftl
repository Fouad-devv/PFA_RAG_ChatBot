<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>

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
      <h1 class="kc-welcome">Vérifiez<br><span>votre email</span></h1>
      <p class="kc-tagline">Vous avez reçu un email de vérification. Cliquez sur le lien pour activer votre compte RAG Assistant.</p>
      <div class="kc-features">
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Vérifiez votre boîte mail</div>
            <div class="kc-feature-desc">Y compris les spams et courriers indésirables</div>
          </div>
        </div>
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Lien valable 24h</div>
            <div class="kc-feature-desc">Renvoyez si vous ne le trouvez pas</div>
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

        <div class="kc-auth-badge"><span class="dot"></span>VÉRIFICATION EMAIL</div>
        <h2 class="kc-form-title">Email envoyé !</h2>
        <p class="kc-form-subtitle">Un lien de vérification a été envoyé à votre adresse email</p>

        <#if message?has_content>
          <div class="alert alert-${message.type}">${kcSanitize(message.summary)?no_esc}</div>
        </#if>

        <div class="verify-info-box">
          <p>Email envoyé à : <strong>${(auth.attemptedUsername)!''}</strong></p>
          <p>Cliquez sur le lien dans l'email pour activer votre compte.</p>
        </div>

        <div class="verify-actions">
          <p class="verify-note">Vous n'avez pas reçu l'email ?</p>
          <form action="${url.loginAction}" method="post">
            <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>
            <button class="btn-primary" type="submit">
              Renvoyer l'email
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </form>
        </div>

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
