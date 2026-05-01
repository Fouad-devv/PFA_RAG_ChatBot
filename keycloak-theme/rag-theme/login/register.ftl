<#import "template.ftl" as layout>
<@layout.registrationLayout; section>

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

      <h1 class="kc-welcome">Rejoignez<br><span>RAG Assistant</span></h1>
      <p class="kc-tagline">Créez votre compte pour accéder à l'assistant juridique basé sur le droit du travail marocain.</p>

      <div class="kc-features">
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Gratuit & Illimité</div>
            <div class="kc-feature-desc">Posez autant de questions que vous voulez</div>
          </div>
        </div>
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Sécurisé</div>
            <div class="kc-feature-desc">Authentification SSO avec Keycloak</div>
          </div>
        </div>
        <div class="kc-feature">
          <div class="kc-feature-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div>
            <div class="kc-feature-title">Historique</div>
            <div class="kc-feature-desc">Retrouvez toutes vos conversations</div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL -->
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

        <div class="kc-auth-badge">
          <span class="dot"></span>
          CRÉER UN COMPTE
        </div>

        <h2 class="kc-form-title">Inscription</h2>
        <p class="kc-form-subtitle">Remplissez le formulaire pour créer votre compte</p>

        <#if message?has_content>
          <div class="alert alert-${message.type}">${kcSanitize(message.summary)?no_esc}</div>
        </#if>

        <form action="${url.registrationAction}" method="post">

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">PRÉNOM <span class="required">*</span></label>
              <div class="input-wrap">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <input id="firstName" name="firstName" type="text"
                  class="form-control <#if messagesPerField.existsError('firstName')>error</#if>"
                  value="${(register.firstName!'')}" placeholder="Prénom"/>
              </div>
              <#if messagesPerField.existsError('firstName')>
                <div class="field-error">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</div>
              </#if>
            </div>
            <div class="form-group">
              <label class="form-label" for="lastName">NOM <span class="required">*</span></label>
              <div class="input-wrap">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <input id="lastName" name="lastName" type="text"
                  class="form-control <#if messagesPerField.existsError('lastName')>error</#if>"
                  value="${(register.lastName!'')}" placeholder="Nom"/>
              </div>
              <#if messagesPerField.existsError('lastName')>
                <div class="field-error">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</div>
              </#if>
            </div>
          </div>

          <#if !realm.registrationEmailAsUsername>
          <div class="form-group">
            <label class="form-label" for="username">NOM D'UTILISATEUR <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <input id="username" name="username" type="text"
                class="form-control <#if messagesPerField.existsError('username')>error</#if>"
                value="${(register.username!'')}" placeholder="Nom d'utilisateur" autocomplete="username"/>
            </div>
            <#if messagesPerField.existsError('username')>
              <div class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</div>
            </#if>
          </div>
          </#if>

          <div class="form-group">
            <label class="form-label" for="email">EMAIL <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
              </svg>
              <input id="email" name="email" type="email"
                class="form-control <#if messagesPerField.existsError('email')>error</#if>"
                value="${(register.email!'')}" placeholder="votre@email.com" autocomplete="email"/>
            </div>
            <#if messagesPerField.existsError('email')>
              <div class="field-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</div>
            </#if>
          </div>

          <#if passwordRequired??>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="password">MOT DE PASSE <span class="required">*</span></label>
              <div class="input-wrap">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input id="password" name="password" type="password"
                  class="form-control has-toggle <#if messagesPerField.existsError('password','password-confirm')>error</#if>"
                  placeholder="••••••••" autocomplete="new-password"/>
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
              <#if messagesPerField.existsError('password')>
                <div class="field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</div>
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
                  placeholder="••••••••" autocomplete="new-password"/>
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
          </div>
          </#if>

          <#if csrf??><input type="hidden" name="${csrf.paramName}" value="${csrf.token}"/></#if>

          <button class="btn-primary" type="submit">
            Créer mon compte
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </form>

        <div class="kc-footer">
          Déjà un compte ?<a href="${url.loginUrl}">Se connecter</a>
        </div>

      </div>
    </div>

  </div>
  <script src="${url.resourcesPath}/js/login.js"></script>
  </#if>

</@layout.registrationLayout>
