
import { startTransition, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "univenda-theme";
const ROLE_STORAGE_KEY = "univenda-selected-role";

const USER_ROLES = {
  seller: {
    id: "seller",
    label: "Student/Seller",
    authPath: "/auth/seller",
    registerPath: "/register/seller",
    dashboardPath: "/seller/dashboard",
    loginEndpoint: "/api/auth/seller/login",
    signupEndpoint: "/api/auth/seller/signup",
    dashboardEndpoint: "/api/seller/dashboard",
    title: "Detailed onboarding for verified student sellers",
    subtitle: "Sell products and freelance services with role-aware verification.",
  },
  customer: {
    id: "customer",
    label: "Customer",
    authPath: "/auth/customer",
    registerPath: "/register/customer",
    dashboardPath: "/customer/dashboard",
    loginEndpoint: "/api/auth/customer/login",
    signupEndpoint: "/api/auth/customer/signup",
    dashboardEndpoint: "/api/customer/dashboard",
    title: "Quick signup for buyers and clients",
    subtitle: "Browse, purchase, and hire with minimal friction.",
  },
};

const ROLE_LIST = Object.values(USER_ROLES);
const STACK_ITEMS = [
  "React 18 + Vite SPA frontend",
  "Vercel serverless API routes",
  "Supabase Postgres user storage",
  "Node.js crypto.scrypt password hashing",
  "AES-encrypted sensitive student profile fields",
  "JWT session stored in an HttpOnly cookie",
];

const LOGIN_DEFAULTS = { email: "", password: "" };
const CUSTOMER_DEFAULTS = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  address: "",
};
const SELLER_DEFAULTS = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  alternatePhoneNumber: "",
  collegeName: "",
  course: "",
  graduationYear: "",
  aadhaarNumber: "",
  accountNumber: "",
  ifscCode: "",
  purpose: "",
  profilePhoto: null,
  approvalDocument: null,
};

function getSavedTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredRole() {
  if (typeof window === "undefined") {
    return null;
  }

  const role = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return USER_ROLES[role] ? role : null;
}

function persistRole(role) {
  if (typeof window === "undefined" || !USER_ROLES[role]) {
    return;
  }

  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

function parseRoute(pathname) {
  if (pathname === "/") {
    return { name: "home", role: null };
  }

  if (pathname === "/register") {
    return { name: "register-role", role: null };
  }

  for (const role of ROLE_LIST) {
    if (pathname === role.authPath) {
      return { name: "login", role: role.id };
    }

    if (pathname === role.registerPath) {
      return { name: "register", role: role.id };
    }

    if (pathname === role.dashboardPath) {
      return { name: "dashboard", role: role.id };
    }
  }

  return { name: "not-found", role: null };
}

function getCurrentRoute() {
  if (typeof window === "undefined") {
    return { name: "home", role: null };
  }

  return parseRoute(window.location.pathname);
}

function navigateTo(path, setRoute, replace = false) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== path) {
    const historyMethod = replace ? window.history.replaceState : window.history.pushState;
    historyMethod.call(window.history, {}, "", path);
  }

  startTransition(() => {
    setRoute(parseRoute(path));
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getDashboardPath(role) {
  return USER_ROLES[role]?.dashboardPath || "/";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function ThemeButton({ theme, onToggle }) {
  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="theme-toggle"
      onClick={onToggle}
      type="button"
    >
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}

function Header({ currentRoute, onLogout, onNavigate, theme, toggleTheme, user }) {
  const savedRole = user?.role || getStoredRole();
  const authPath = savedRole ? USER_ROLES[savedRole]?.authPath || "/" : "/";
  const registerPath = savedRole ? USER_ROLES[savedRole]?.registerPath || "/register" : "/register";
  const dashboardPath = user?.role ? getDashboardPath(user.role) : "/";

  return (
    <header className="site-header">
      <button className="brand-lockup brand-button" onClick={() => onNavigate("/")} type="button">
        <span className="brand-mark" aria-hidden="true">
          U
        </span>
        <span className="brand-text">
          <span className="brand-name">UNIVENDA</span>
          <span className="brand-meta">Role-based registration and secure onboarding</span>
        </span>
      </button>

      <nav aria-label="Primary">
        <ul className="nav-links">
          <li><button className={currentRoute.name === "home" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("/")} type="button">Home</button></li>
          <li><button className={currentRoute.name === "login" ? "nav-link active" : "nav-link"} onClick={() => onNavigate(authPath)} type="button">Login</button></li>
          <li><button className={currentRoute.name === "register" || currentRoute.name === "register-role" ? "nav-link active" : "nav-link"} onClick={() => onNavigate(registerPath)} type="button">Register</button></li>
          <li><button className={currentRoute.name === "dashboard" ? "nav-link active" : "nav-link"} onClick={() => onNavigate(dashboardPath)} type="button">Dashboard</button></li>
        </ul>
      </nav>

      <div className="header-actions">
        {user ? <button className="button button-secondary" onClick={onLogout} type="button">Logout</button> : null}
        <ThemeButton theme={theme} onToggle={toggleTheme} />
      </div>
    </header>
  );
}

function HomeView({ onLogin, onRegister, user }) {
  return (
    <section className="hero-layout">
      <div className="hero-copy">
        <p className="eyebrow">Complete authentication system</p>
        <h1>Login, register by role, and route every user to the correct dashboard.</h1>
        <p className="hero-body">
          Tech stack: React 18 + Vite, Vercel serverless APIs, Supabase Postgres, Node.js crypto,
          and encrypted storage for student-only sensitive registration data.
        </p>

        <div className="hero-inline-card">
          <strong>Current session</strong>
          <span>{user ? `${user.fullName || user.email} is signed in as ${USER_ROLES[user.role]?.label}.` : "No active session yet."}</span>
        </div>

        <div className="button-row hero-actions-row">
          <button className="button button-primary" onClick={() => onRegister(null)} type="button">Start Registration</button>
          <button className="button button-secondary" onClick={() => onLogin("seller")} type="button">Seller Login</button>
          <button className="button button-secondary" onClick={() => onLogin("customer")} type="button">Customer Login</button>
        </div>
      </div>

      <div className="panel-grid">
        {ROLE_LIST.map((role) => (
          <article className="role-card" key={role.id}>
            <p className="role-chip">{role.label}</p>
            <h2>{role.title}</h2>
            <p>{role.subtitle}</p>
            <div className="button-row compact-actions">
              <button className="button button-primary" onClick={() => onRegister(role.id)} type="button">Register</button>
              <button className="button button-secondary" onClick={() => onLogin(role.id)} type="button">Login</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoleSelectionView({ onSelectRole }) {
  return (
    <section className="content-grid auth-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Step 1</p>
        <h1>Select a role before registration.</h1>
        <p className="section-copy">
          Choose the onboarding path first so we can show the right form, save the correct role,
          and route you to the matching dashboard after signup.
        </p>
        <div className="role-choice-grid">
          {ROLE_LIST.map((role) => (
            <button className="role-choice-card" key={role.id} onClick={() => onSelectRole(role.id)} type="button">
              <strong>{role.label}</strong>
              <span>{role.subtitle}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Security</p>
        <h2>Registration rules</h2>
        <ul className="feature-list">
          <li>Passwords are hashed with scrypt before storage.</li>
          <li>Student Aadhaar, bank details, and uploaded files are encrypted before insert.</li>
          <li>Role is stored server-side and checked again on login and dashboard access.</li>
          <li>Student sellers are marked unverified by default and can still log in immediately.</li>
        </ul>
      </article>
    </section>
  );
}
function LoginView({ form, onChange, onSubmit, role, status, submitting, onRegister }) {
  const roleConfig = USER_ROLES[role];

  if (!roleConfig) {
    return <RoleSelectionView onSelectRole={onRegister} />;
  }

  return (
    <section className="content-grid auth-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Login</p>
        <h1>{roleConfig.label} login</h1>
        <p className="section-copy">
          Use your registered email and password to continue. Successful login restores your role
          and sends you to the correct dashboard automatically.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input autoComplete="email" name="email" onChange={onChange} required type="email" value={form.email} />
          </label>

          <label>
            Password
            <input autoComplete="current-password" minLength="8" name="password" onChange={onChange} required type="password" value={form.password} />
          </label>

          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? "Logging in..." : "Login"}
          </button>

          <button className="button button-link" onClick={() => onRegister(role)} type="button">
            Register if you are new
          </button>

          <p aria-live="polite" className={`status-message ${status.type || ""}`}>
            {status.message}
          </p>
        </form>
      </article>

      <article className="panel">
        <p className="eyebrow">Role routing</p>
        <h2>{roleConfig.label} users stay in their own flow</h2>
        <ul className="feature-list">
          <li>Login posts to {roleConfig.loginEndpoint}.</li>
          <li>Session state preserves the selected role in local storage and in the signed cookie.</li>
          <li>Dashboard access is denied if the user role does not match the route.</li>
        </ul>
      </article>
    </section>
  );
}

function FileSummary({ file }) {
  if (!file) {
    return <span className="field-hint">No file selected yet.</span>;
  }

  return <span className="field-hint">{file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)</span>;
}

function RegistrationView({
  customerForm,
  customerStatus,
  onCustomerChange,
  onCustomerSubmit,
  onFileChange,
  onRoleChange,
  onSellerChange,
  onSellerSubmit,
  role,
  sellerForm,
  sellerStatus,
  submitting,
}) {
  const roleConfig = USER_ROLES[role];

  if (!roleConfig) {
    return <RoleSelectionView onSelectRole={onRoleChange} />;
  }

  const isSeller = role === USER_ROLES.seller.id;
  const status = isSeller ? sellerStatus : customerStatus;

  return (
    <section className="content-grid auth-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Step 2</p>
        <h1>{isSeller ? "Student seller registration" : "Customer registration"}</h1>
        <p className="section-copy">
          {isSeller
            ? "Detailed onboarding collects identity, payment, and college approval data while protecting sensitive fields before database storage."
            : "Quick customer signup keeps friction low while still saving the role and shipping contact details securely."}
        </p>

        <div className="button-row compact-actions step-switcher">
          {ROLE_LIST.map((item) => (
            <button className={item.id === role ? "button button-primary" : "button button-secondary"} key={item.id} onClick={() => onRoleChange(item.id)} type="button">
              {item.label}
            </button>
          ))}
        </div>

        {isSeller ? (
          <form className="auth-form" onSubmit={onSellerSubmit}>
            <div className="form-grid-two">
              <label>Full Name<input name="fullName" onChange={onSellerChange} required type="text" value={sellerForm.fullName} /></label>
              <label>College Email<input autoComplete="email" name="email" onChange={onSellerChange} required type="email" value={sellerForm.email} /></label>
              <label>Password<input autoComplete="new-password" minLength="8" name="password" onChange={onSellerChange} required type="password" value={sellerForm.password} /></label>
              <label>Phone Number<input name="phoneNumber" onChange={onSellerChange} required type="tel" value={sellerForm.phoneNumber} /></label>
              <label>Alternate Phone Number<input name="alternatePhoneNumber" onChange={onSellerChange} required type="tel" value={sellerForm.alternatePhoneNumber} /></label>
              <label>College Name<input name="collegeName" onChange={onSellerChange} required type="text" value={sellerForm.collegeName} /></label>
              <label>Course<input name="course" onChange={onSellerChange} required type="text" value={sellerForm.course} /></label>
              <label>Year of Graduation<input name="graduationYear" onChange={onSellerChange} required type="number" value={sellerForm.graduationYear} /></label>
              <label>Aadhaar Number<input name="aadhaarNumber" onChange={onSellerChange} required type="text" value={sellerForm.aadhaarNumber} /></label>
              <label>Bank Account Number<input name="accountNumber" onChange={onSellerChange} required type="text" value={sellerForm.accountNumber} /></label>
              <label>IFSC Code<input name="ifscCode" onChange={onSellerChange} required type="text" value={sellerForm.ifscCode} /></label>
            </div>

            <label>
              Purpose of joining platform
              <textarea name="purpose" onChange={onSellerChange} required rows="4" value={sellerForm.purpose} />
            </label>

            <div className="form-grid-two file-grid">
              <label>
                Upload Profile Photo
                <input accept="image/*" onChange={(event) => onFileChange(event, "profilePhoto")} required type="file" />
                <FileSummary file={sellerForm.profilePhoto} />
              </label>
              <label>
                Upload College Approval Document
                <input accept="image/*,.pdf" onChange={(event) => onFileChange(event, "approvalDocument")} required type="file" />
                <FileSummary file={sellerForm.approvalDocument} />
              </label>
            </div>

            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? "Creating seller account..." : "Create Student/Seller Account"}
            </button>

            <p aria-live="polite" className={`status-message ${status.type || ""}`}>
              {status.message}
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onCustomerSubmit}>
            <div className="form-grid-two">
              <label>Full Name<input name="fullName" onChange={onCustomerChange} required type="text" value={customerForm.fullName} /></label>
              <label>Email<input autoComplete="email" name="email" onChange={onCustomerChange} required type="email" value={customerForm.email} /></label>
              <label>Password<input autoComplete="new-password" minLength="8" name="password" onChange={onCustomerChange} required type="password" value={customerForm.password} /></label>
              <label>Phone Number<input name="phoneNumber" onChange={onCustomerChange} required type="tel" value={customerForm.phoneNumber} /></label>
            </div>

            <label>
              Address
              <textarea name="address" onChange={onCustomerChange} required rows="4" value={customerForm.address} />
            </label>

            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? "Creating customer account..." : "Create Customer Account"}
            </button>

            <p aria-live="polite" className={`status-message ${status.type || ""}`}>
              {status.message}
            </p>
          </form>
        )}
      </article>

      <article className="panel">
        <p className="eyebrow">What happens next</p>
        <h2>{roleConfig.label} post-registration behavior</h2>
        <ul className="feature-list">
          <li>Required fields are validated on the client and on the API route.</li>
          <li>Registration auto-logs the user in and preserves the role for future sessions.</li>
          <li>{isSeller ? "Student sellers start as unverified until review is completed." : "Customers go straight to the buying dashboard after signup."}</li>
        </ul>
      </article>
    </section>
  );
}

function DashboardView({ dashboardState, role, user }) {
  const roleConfig = USER_ROLES[role];

  return (
    <section className="content-grid dashboard-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Dashboard</p>
        <h1>{roleConfig?.label} dashboard</h1>
        <p className="section-copy">
          {role === "seller"
            ? "Your role, verification status, products, and services stay tied to one protected seller account."
            : "Your customer session stays lightweight and ready for shopping or hiring flows."}
        </p>
        <div className="session-badge">
          <strong>Authenticated user</strong>
          <span>{user ? `${user.fullName || user.email} • ${roleConfig?.label} • ${user.verificationStatus || "verified"}` : "Checking session..."}</span>
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Protected API</p>
        <h2>{roleConfig?.dashboardEndpoint}</h2>
        {dashboardState.loading ? (
          <p className="section-copy">Loading protected dashboard data...</p>
        ) : dashboardState.error ? (
          <p className="status-message error">{dashboardState.error}</p>
        ) : (
          <>
            <ul className="feature-list">
              {(dashboardState.data?.capabilities || []).map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
            <div className="stats-grid">
              {Object.entries(dashboardState.data?.quickStats || {}).map(([label, value]) => (
                <article className="stat-card" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </div>
            {dashboardState.data?.guidance?.onboarding ? <p className="section-copy">{dashboardState.data.guidance.onboarding}</p> : null}
          </>
        )}
      </article>
    </section>
  );
}

function RouteGuide() {
  return (
    <section className="content-grid content-grid-tight">
      <article className="panel">
        <p className="eyebrow">Routes</p>
        <h2>Registration and login are separate now</h2>
        <ul className="route-list">
          <li><strong>/auth/seller</strong><span>Student/Seller login page</span></li>
          <li><strong>/auth/customer</strong><span>Customer login page</span></li>
          <li><strong>/register</strong><span>Role selection before registration</span></li>
          <li><strong>/register/seller</strong><span>Detailed student seller onboarding</span></li>
          <li><strong>/register/customer</strong><span>Quick customer onboarding</span></li>
          <li><strong>/seller/dashboard</strong><span>Seller-only dashboard</span></li>
          <li><strong>/customer/dashboard</strong><span>Customer-only dashboard</span></li>
        </ul>
      </article>

      <article className="panel">
        <p className="eyebrow">Tech stack</p>
        <h2>Current implementation stack</h2>
        <ul className="feature-list">
          {STACK_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function NotFoundView({ onNavigate }) {
  return (
    <section className="content-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Unknown route</p>
        <h1>This page is outside the auth flow.</h1>
        <p className="section-copy">Use the supported login, register, or dashboard routes.</p>
        <button className="button button-primary" onClick={() => onNavigate("/")} type="button">Go home</button>
      </article>
    </section>
  );
}
function AppShell() {
  const [route, setRoute] = useState(getCurrentRoute);
  const [theme, setTheme] = useState(getSavedTheme);
  const [selectedRole, setSelectedRole] = useState(getStoredRole);
  const [loginForm, setLoginForm] = useState(LOGIN_DEFAULTS);
  const [customerForm, setCustomerForm] = useState(CUSTOMER_DEFAULTS);
  const [sellerForm, setSellerForm] = useState(SELLER_DEFAULTS);
  const [loginStatus, setLoginStatus] = useState({ type: "", message: "" });
  const [customerStatus, setCustomerStatus] = useState({ type: "", message: "" });
  const [sellerStatus, setSellerStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sessionState, setSessionState] = useState({ loading: true, user: null });
  const [dashboardState, setDashboardState] = useState({ loading: false, data: null, error: "" });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
      return undefined;
    }

    const syncTheme = (event) => {
      setTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", syncTheme);
    return () => mediaQuery.removeEventListener("change", syncTheme);
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      startTransition(() => {
        setRoute(getCurrentRoute());
      });
    };

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (!response.ok) {
          if (active) {
            setSessionState({ loading: false, user: null });
          }
          return;
        }

        const payload = await response.json();
        if (active) {
          setSessionState({ loading: false, user: payload.user || null });
        }
      } catch {
        if (active) {
          setSessionState({ loading: false, user: null });
        }
      }
    };

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      return;
    }

    persistRole(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    if (sessionState.loading) {
      return;
    }

    if (sessionState.user?.role) {
      setSelectedRole(sessionState.user.role);

      if (route.name === "home" || route.name === "login" || route.name === "register" || route.name === "register-role") {
        navigateTo(getDashboardPath(sessionState.user.role), setRoute, true);
      }
      return;
    }

    if (route.name === "dashboard" && route.role) {
      setSelectedRole(route.role);
      navigateTo(USER_ROLES[route.role].authPath, setRoute, true);
      setDashboardState({ loading: false, data: null, error: "" });
    }
  }, [route.name, route.role, sessionState.loading, sessionState.user]);

  useEffect(() => {
    if (route.name !== "dashboard" || !route.role || sessionState.loading || !sessionState.user) {
      return;
    }

    if (route.role !== sessionState.user.role) {
      navigateTo(getDashboardPath(sessionState.user.role), setRoute, true);
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      setDashboardState({ loading: true, data: null, error: "" });

      try {
        const response = await fetch(USER_ROLES[route.role].dashboardEndpoint, { credentials: "include" });
        const payload = await response.json().catch(() => ({}));

        if (!active) {
          return;
        }

        if (response.status === 401) {
          setSessionState({ loading: false, user: null });
          navigateTo(USER_ROLES[route.role].authPath, setRoute, true);
          return;
        }

        if (!response.ok) {
          throw new Error(payload.error || "Could not load dashboard data.");
        }

        setDashboardState({ loading: false, data: payload, error: "" });
      } catch (error) {
        if (active) {
          setDashboardState({ loading: false, data: null, error: error.message || "Could not load dashboard data." });
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [route.name, route.role, sessionState.loading, sessionState.user]);

  const handleNavigate = (path, replace = false) => {
    navigateTo(path, setRoute, replace);
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomerForm((current) => ({ ...current, [name]: value }));
  };

  const handleSellerChange = (event) => {
    const { name, value } = event.target;
    setSellerForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = async (event, fieldName) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSellerForm((current) => ({ ...current, [fieldName]: null }));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSellerForm((current) => ({
        ...current,
        [fieldName]: {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
        },
      }));
      setSellerStatus({ type: "", message: "" });
    } catch (error) {
      setSellerStatus({ type: "error", message: error.message || "Could not read the uploaded file." });
    }
  };

  const handleSelectRoleForLogin = (role) => {
    setSelectedRole(role);
    setLoginStatus({ type: "", message: "" });
    setLoginForm(LOGIN_DEFAULTS);
    handleNavigate(USER_ROLES[role].authPath);
  };

  const handleSelectRoleForRegistration = (role) => {
    setSelectedRole(role);
    setCustomerStatus({ type: "", message: "" });
    setSellerStatus({ type: "", message: "" });
    handleNavigate(USER_ROLES[role].registerPath);
  };
  const submitLogin = async (event) => {
    event.preventDefault();

    const role = route.role || selectedRole;
    if (!role || !USER_ROLES[role]) {
      setLoginStatus({ type: "error", message: "Choose a role before logging in." });
      return;
    }

    setSubmitting(true);
    setLoginStatus({ type: "", message: "" });

    try {
      const response = await fetch(USER_ROLES[role].loginEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Login failed.");
      }

      setSessionState({ loading: false, user: payload.user || null });
      setSelectedRole(payload.user?.role || role);
      setLoginForm(LOGIN_DEFAULTS);
      setLoginStatus({ type: "success", message: payload.message || "Login successful." });
      handleNavigate(payload.redirectTo || getDashboardPath(role), true);
    } catch (error) {
      setLoginStatus({ type: "error", message: error.message || "Login failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const submitCustomerRegistration = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setCustomerStatus({ type: "", message: "" });

    try {
      const response = await fetch(USER_ROLES.customer.signupEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Customer registration failed.");
      }

      setSessionState({ loading: false, user: payload.user || null });
      setSelectedRole(USER_ROLES.customer.id);
      setCustomerForm(CUSTOMER_DEFAULTS);
      setCustomerStatus({ type: "success", message: payload.message || "Customer account created." });
      handleNavigate(payload.redirectTo || USER_ROLES.customer.dashboardPath, true);
    } catch (error) {
      setCustomerStatus({ type: "error", message: error.message || "Customer registration failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const submitSellerRegistration = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSellerStatus({ type: "", message: "" });

    try {
      const response = await fetch(USER_ROLES.seller.signupEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellerForm),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Student registration failed.");
      }

      setSessionState({ loading: false, user: payload.user || null });
      setSelectedRole(USER_ROLES.seller.id);
      setSellerForm(SELLER_DEFAULTS);
      setSellerStatus({ type: "success", message: payload.message || "Student seller account created." });
      handleNavigate(payload.redirectTo || USER_ROLES.seller.dashboardPath, true);
    } catch (error) {
      setSellerStatus({ type: "error", message: error.message || "Student registration failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      const nextRole = sessionState.user?.role || selectedRole;
      setSessionState({ loading: false, user: null });
      setDashboardState({ loading: false, data: null, error: "" });
      setLoginForm(LOGIN_DEFAULTS);
      setLoginStatus({ type: "success", message: "Logged out successfully." });
      handleNavigate(nextRole ? USER_ROLES[nextRole].authPath : "/", true);
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  let currentView = <NotFoundView onNavigate={handleNavigate} />;

  if (route.name === "home") {
    currentView = <HomeView onLogin={handleSelectRoleForLogin} onRegister={(role) => (role ? handleSelectRoleForRegistration(role) : handleNavigate("/register"))} user={sessionState.user} />;
  } else if (route.name === "register-role") {
    currentView = <RoleSelectionView onSelectRole={handleSelectRoleForRegistration} />;
  } else if (route.name === "login") {
    currentView = <LoginView form={loginForm} onChange={handleLoginChange} onRegister={handleSelectRoleForRegistration} onSubmit={submitLogin} role={route.role || selectedRole} status={loginStatus} submitting={submitting} />;
  } else if (route.name === "register") {
    currentView = <RegistrationView customerForm={customerForm} customerStatus={customerStatus} onCustomerChange={handleCustomerChange} onCustomerSubmit={submitCustomerRegistration} onFileChange={handleFileChange} onRoleChange={handleSelectRoleForRegistration} onSellerChange={handleSellerChange} onSellerSubmit={submitSellerRegistration} role={route.role || selectedRole} sellerForm={sellerForm} sellerStatus={sellerStatus} submitting={submitting} />;
  } else if (route.name === "dashboard") {
    currentView = <DashboardView dashboardState={dashboardState} role={route.role} user={sessionState.user} />;
  }

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header currentRoute={route} onLogout={handleLogout} onNavigate={handleNavigate} theme={theme} toggleTheme={toggleTheme} user={sessionState.user} />
      <main id="main-content">
        {currentView}
        <RouteGuide />
      </main>
    </div>
  );
}

export default AppShell;
