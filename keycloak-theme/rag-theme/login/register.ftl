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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>
          <div>
            <div class="kc-title">Créer un compte</div>
            <div class="kc-subtitle">RAG Assistant · ${realm.displayName!''}</div>
          </div>
        </div>

        <!-- Required note -->
        <div class="kc-required-note"><span>*</span> Champs obligatoires</div>

        <!-- Alert -->
        <#if message?has_content>
          <div class="alert alert-${message.type}">
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <!-- Form -->
        <form action="${url.registrationAction}" method="post">

          <!-- First name + Last name -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">Prénom <span class="required">*</span></label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                class="form-control <#if messagesPerField.existsError('firstName')>error</#if>"
                value="${(register.firstName!'')}"
                placeholder="Prénom"
              />
              <#if messagesPerField.existsError('firstName')>
                <div class="field-error">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</div>
              </#if>
            </div>

            <div class="form-group">
              <label class="form-label" for="lastName">Nom <span class="required">*</span></label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                class="form-control <#if messagesPerField.existsError('lastName')>error</#if>"
                value="${(register.lastName!'')}"
                placeholder="Nom"
              />
              <#if messagesPerField.existsError('lastName')>
                <div class="field-error">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</div>
              </#if>
            </div>
          </div>

          <!-- Username -->
          <#if !realm.registrationEmailAsUsername>
          <div class="form-group">
            <label class="form-label" for="username">Nom d'utilisateur <span class="required">*</span></label>
            <input
              id="username"
              name="username"
              type="text"
              class="form-control <#if messagesPerField.existsError('username')>error</#if>"
              value="${(register.username!'')}"
              placeholder="Choisissez un nom d'utilisateur"
              autocomplete="username"
            />
            <#if messagesPerField.existsError('username')>
              <div class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</div>
            </#if>
          </div>
          </#if>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Email <span class="required">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              class="form-control <#if messagesPerField.existsError('email')>error</#if>"
              value="${(register.email!'')}"
              placeholder="votre@email.com"
              autocomplete="email"
            />
            <#if messagesPerField.existsError('email')>
              <div class="field-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</div>
            </#if>
          </div>

          <!-- Password -->
          <#if passwordRequired??>
          <div class="form-group">
            <label class="form-label" for="password">Mot de passe <span class="required">*</span></label>
            <input
              id="password"
              name="password"
              type="password"
              class="form-control <#if messagesPerField.existsError('password','password-confirm')>error</#if>"
              placeholder="Choisissez un mot de passe"
              autocomplete="new-password"
            />
            <#if messagesPerField.existsError('password')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</div>
            </#if>
          </div>

          <div class="form-group">
            <label class="form-label" for="password-confirm">Confirmer le mot de passe <span class="required">*</span></label>
            <input
              id="password-confirm"
              name="password-confirm"
              type="password"
              class="form-control <#if messagesPerField.existsError('password-confirm')>error</#if>"
              placeholder="Répétez le mot de passe"
              autocomplete="new-password"
            />
            <#if messagesPerField.existsError('password-confirm')>
              <div class="field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</div>
            </#if>
          </div>
          </#if>

          <input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/>

          <!-- Submit -->
          <button class="btn-primary" type="submit">Créer mon compte</button>
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
