document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.pw-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.querySelector('.eye-show').style.display = isHidden ? 'none' : '';
      btn.querySelector('.eye-hide').style.display = isHidden ? '' : 'none';
      btn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    });
  });
});
