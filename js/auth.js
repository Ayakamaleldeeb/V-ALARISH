function getCurrentUser() {
  try {
    const raw = localStorage.getItem("va_current_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem("va_current_user", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("va_current_user");
}

function ensureLogoutDropdownStyles() {
  if (document.getElementById("va-auth-style")) return;

  const style = document.createElement("style");
  style.id = "va-auth-style";
  style.textContent = `
    .va-user-dropdown { position: relative; }
    .va-user-dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 160px;
      padding: 8px 0;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: none;
      z-index: 9999;
    }
    .va-user-dropdown-menu a {
      display: block;
      padding: 10px 14px;
      color: #111;
      text-decoration: none;
    }
    .va-user-dropdown-menu a:hover { background: rgba(0,0,0,0.05); }
    .va-user-dropdown.open .va-user-dropdown-menu { display: block; }
  `;
  document.head.appendChild(style);
}

function initNavbarAuth() {
  const host = document.getElementById("va-auth-slot");
  if (!host) return;

  ensureLogoutDropdownStyles();

  const user = getCurrentUser();
  if (!user || !user.name) {
    host.innerHTML = `<a class="nav-link" href="login.html">Login</a>`;
    return;
  }

  host.innerHTML = `
    <div class="nav-link va-user-dropdown" id="vaUserDropdown" style="cursor:pointer;">
      <span id="vaUserName">${user.name}</span>
      <div class="va-user-dropdown-menu" id="vaUserDropdownMenu">
        <a href="#" id="vaLogoutBtn">Logout</a>
      </div>
    </div>
  `;

  const dropdown = document.getElementById("vaUserDropdown");
  const logoutBtn = document.getElementById("vaLogoutBtn");

  dropdown.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    clearCurrentUser();
    window.location.href = "index.html";
  });

  document.addEventListener("click", () => dropdown.classList.remove("open"));
}

window.VAAuth = {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  initNavbarAuth
};

