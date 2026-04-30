<#import "template.ftl" as layout>
<@layout.registrationLayout; section>

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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <div class="kc-title">Nouveau mot de passe</div>
            <div class="kc-subtitle">RAG Assistant · ${realm.displayName!''}</div>
          </div>
        </div>

        <!-- Alert -->
        <#if message?has_content>
          <div class="alert alert-${message.type}">
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <!-- Form -->
        <form action="${url.loginAction}" method="post">
          <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>
          <#if isAppInitiatedAction??>
            <input type="hidden" name="logout-sessions" value="on"/>
          </#if>

          <!-- New password -->
          <div class="form-group">
            <label class="form-label" for="password-new">Nouveau mot de passe <span class="required">*</span></label>
            <input
              id="password-new"
              name="password-new"
              type="password"
              class="form-control <#if messagesPerField.existsError('password-new','password-confirm')>error</#if>"
              autofocus
              autocomplete="new-password"
              placeholder="Choisissez un mot de passe"
            />
            <#if messagesPerField.existsError('password-new')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password-new'))?no_esc}</div>
            </#if>
          </div>

          <!-- Confirm password -->
          <div class="form-group">
            <label class="form-label" for="password-confirm">Confirmer le mot de passe <span class="required">*</span></label>
            <input
              id="password-confirm"
              name="password-confirm"
              type="password"
              class="form-control <#if messagesPerField.existsError('password-confirm')>error</#if>"
              autocomplete="new-password"
              placeholder="Répétez le mot de passe"
            />
            <#if messagesPerField.existsError('password-confirm')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</div>
            </#if>
          </div>

          <button class="btn-primary" type="submit">Enregistrer le mot de passe</button>
        </form>

      </div>
    </div>
  </div>
  </#if>

</@layout.registrationLayout>
