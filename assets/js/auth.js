// Simple auth functionality - minimal code
document.addEventListener("DOMContentLoaded", function () {
  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      // Update active tab button
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update active tab content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      document.getElementById(tab).classList.add("active");
    });
  });

  // Password strength indicator
  const passwordInput = document.querySelector(
    '#register input[type="password"]'
  );
  if (passwordInput) {
    passwordInput.addEventListener("input", (e) => {
      const password = e.target.value;
      const strengthEl = document.querySelector(".password-strength");

      if (strengthEl) {
        let strength = "weak";
        if (
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[0-9]/.test(password)
        ) {
          strength = "strong";
        } else if (password.length >= 6) {
          strength = "good";
        } else if (password.length >= 4) {
          strength = "fair";
        }

        strengthEl.className = `password-strength strength-${strength}`;
      }
    });
  }

  // Form submission (demo only)
  document.querySelectorAll(".btn-primary").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Đây chỉ là demo - chức năng thực tế cần kết nối API");
    });
  });
});
