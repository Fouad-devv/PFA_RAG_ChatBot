<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=realm.registrationAllowed && !registrationDisabled??; section>

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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <div>
            <div class="kc-title">Mot de passe oublié</div>
            <div class="kc-subtitle">RAG Assistant · ${realm.displayName!''}</div>
          </div>
        </div>

        <!-- Alert -->
        <#if message?has_content>
          <div class="alert alert-${message.type}">
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <p class="reset-info">
          Entrez votre email ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        <!-- Form -->
        <form action="${url.loginAction}" method="post">
          <div class="form-group">
            <label class="form-label" for="username">
              <#if realm.loginWithEmailAllowed && !realm.registrationEmailAsUsername>
                Nom d'utilisateur ou email
              <#else>
                Email
              </#if>
            </label>
            <input
              id="username"
              name="username"
              type="<#if realm.registrationEmailAsUsername>email<#else>text</#if>"
              class="form-control <#if messagesPerField.existsError('username')>error</#if>"
              value="${(auth.attemptedUsername)!''}"
              autofocus
              autocomplete="email"
              placeholder="votre@email.com"
            />
            <#if messagesPerField.existsError('username')>
              <div class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</div>
            </#if>
          </div>

          <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>
          <button class="btn-primary" type="submit">Envoyer le lien</button>
        </form>

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
