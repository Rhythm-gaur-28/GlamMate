document.addEventListener('DOMContentLoaded', function () {
  // These variables are injected by EJS in the template
  // var loginError = ...;
  // var signupError = ...;

  const showLogin = document.getElementById('showLogin');
  const showSignup = document.getElementById('showSignup');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Show signup form by default only if there's a signup error and no login error
  if (
    typeof signupError !== "undefined" && signupError &&
    (!loginError || loginError === "") &&
    showSignup && signupForm && loginForm
  ) {
    showSignup.classList.add('active');
    showLogin.classList.remove('active');
    loginForm.style.display = 'none';
    signupForm.style.display = '';
  } else {
    // Default: show login form
    showLogin.classList.add('active');
    showSignup.classList.remove('active');
    loginForm.style.display = '';
    signupForm.style.display = 'none';
  }

  // Toggle between login and signup forms
  if (showLogin && showSignup && loginForm && signupForm) {
    showLogin.addEventListener('click', function () {
      showLogin.classList.add('active');
      showSignup.classList.remove('active');
      loginForm.style.display = '';
      signupForm.style.display = 'none';
      clearSignupErrors();
    });

    showSignup.addEventListener('click', function () {
      showSignup.classList.add('active');
      showLogin.classList.remove('active');
      loginForm.style.display = 'none';
      signupForm.style.display = '';
      clearLoginErrors();
    });
  }

  // Clear signup errors
  function clearSignupErrors() {
    const passwordError = document.getElementById("passwordError");
    const confirmError = document.getElementById("confirmError");
    const signupErrorDiv = document.getElementById("signupError");
    if (passwordError) passwordError.innerText = "";
    if (confirmError) confirmError.innerText = "";
    if (signupErrorDiv) signupErrorDiv.innerText = "";
  }

  // Clear login errors
  function clearLoginErrors() {
    const loginError = document.getElementById("loginError");
    if (loginError) loginError.innerText = "";
  }

  // Handle password validation live for signup
  const signupFormEl = document.querySelector('#signupForm');
  const passwordInput = document.getElementById("signupPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");

  if (signupFormEl && passwordInput && confirmInput) {
    // Live validation
    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      const regex = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$/;
      if (!regex.test(password)) {
        passwordError.innerText =
          "Password must be at least 8 characters, include one uppercase, one number, and one special symbol.";
      } else {
        passwordError.innerText = "";
      }
    });

    confirmInput.addEventListener("input", () => {
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      if (password !== confirm) {
        confirmError.innerText = "Passwords do not match.";
      } else {
        confirmError.innerText = "";
      }
    });

    // Prevent submit if invalid
    signupFormEl.addEventListener("submit", function (e) {
      const pwd = passwordInput.value;
      const cpwd = confirmInput.value;
      const regex = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$/;

      if (!regex.test(pwd)) {
        e.preventDefault();
        passwordError.innerText =
          "Password must be at least 8 characters, include one uppercase, one number, and one special symbol.";
      }

      if (pwd !== cpwd) {
        e.preventDefault();
        confirmError.innerText = "Passwords do not match.";
      }
    });
  }
});