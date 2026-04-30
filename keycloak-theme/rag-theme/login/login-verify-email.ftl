<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>

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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div class="kc-title">Vérifiez votre email</div>
            <div class="kc-subtitle">RAG Assistant · ${realm.displayName!''}</div>
          </div>
        </div>

        <!-- Info box -->
        <div class="verify-info-box">
          <p>Un email de vérification a été envoyé à <strong>${(auth.attemptedUsername)!''}</strong>.</p>
          <p>Cliquez sur le lien dans l'email pour activer votre compte.</p>
        </div>

        <!-- Alert -->
        <#if message?has_content>
          <div class="alert alert-${message.type}">
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <!-- Resend -->
        <div class="verify-actions">
          <p class="verify-note">Vous n'avez pas reçu l'email ?</p>
          <form action="${url.loginAction}" method="post">
            <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>
            <button class="btn-primary" type="submit">Renvoyer l'email</button>
          </form>
        </div>

        <!-- Back to login -->
        <div style="text-align:center">
          <a class="kc-back" href="${url.loginUrl}">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Retour à la connexion
          </a>
        </div>

      </div>
    </div>
  </div>
  </#if>

</@layout.registrationLayout>
