import { useEffect, useMemo, useState } from "react";
import { categories, departments, metrics, signals, steps } from "./data";

const initialForm = {
  fullName: "",
  email: "",
  university: "",
  rollNumber: "",
  department: departments[0],
  offeringType: "Freelance services",
  portfolioUrl: "",
  notes: "",
};

const initialAuthForm = {
  email: "",
  password: "",
};

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const THEME_STORAGE_KEY = "univenda-theme";

function App() {
  const [formData, setFormData] = useState(initialForm);
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authStatus, setAuthStatus] = useState({ type: "", message: "" });
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const verificationFee = useMemo(() => {
    const amount = Number(import.meta.env.VITE_STRIPE_PRICE_AMOUNT || 29900);
    return moneyFormatter.format(amount / 100);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return undefined;
    }

    const syncSystemTheme = (event) => {
      setTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => mediaQuery.removeEventListener("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });

        if (!response.ok) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const payload = await response.json();

        if (active) {
          setUser(payload.user || null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsSessionLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/submit-seller-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "We could not submit the application.");
      }

      setFormStatus({
        type: "success",
        message:
          payload.message ||
          "Application received. Review can begin as soon as your backend credentials are configured.",
      });
      setFormData(initialForm);
    } catch (error) {
      setFormStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setIsAuthSubmitting(true);
    setAuthStatus({ type: "", message: "" });

    try {
      const endpoint = authMode === "login" ? "/api/login" : "/api/register";
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Authentication failed.");
      }

      setUser(payload.user || null);
      setAuthForm(initialAuthForm);
      setAuthStatus({
        type: "success",
        message: payload.message || "Authentication successful.",
      });

      window.location.assign(payload.redirectTo || "/?view=dashboard");
    } catch (error) {
      setAuthStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setAuthStatus({ type: "", message: "" });

    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      window.location.assign("/#auth");
    }
  };

  const startCheckout = async () => {
    setIsCheckoutLoading(true);
    setFormStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName:
            import.meta.env.VITE_STRIPE_PRICE_DESCRIPTION ||
            "Priority seller verification",
          amount: Number(import.meta.env.VITE_STRIPE_PRICE_AMOUNT || 29900),
          currency: (import.meta.env.VITE_STRIPE_CURRENCY || "INR").toLowerCase(),
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(
          payload.error ||
            "Stripe Checkout is not configured yet. Add your environment variables and try again.",
        );
      }

      window.location.assign(payload.url);
    } catch (error) {
      setFormStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            U
          </span>
          <div>
            <p className="brand-name">UNIVENDA</p>
            <p className="brand-meta">Verified student marketplace</p>
          </div>
        </div>

        <nav aria-label="Primary">
          <ul className="nav-links">
            <li>
              <a href="#auth">Auth</a>
            </li>
            <li>
              <a href="#dashboard">Dashboard</a>
            </li>
            <li>
              <a href="#apply">Apply</a>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          {user ? (
            <button className="button button-secondary header-button" onClick={handleLogout} type="button">
              Logout
            </button>
          ) : null}

          <button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            <span aria-hidden="true">{theme === "dark" ? "Light" : "Dark"}</span>
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-thumb" />
            </span>
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Authentication-first marketplace access.</p>
            <h1>Register, log in, and keep protected routes behind a real session.</h1>
            <p className="hero-body">
              This setup now includes hashed passwords, JWT-backed authentication in an
              HttpOnly cookie, error handling for invalid credentials, and a dashboard
              redirect after successful login.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#auth">
                Open Auth
              </a>
              <a className="button button-secondary" href="#dashboard">
                View Protected State
              </a>
            </div>
          </div>

          <div className="hero-panel" aria-label="Authentication status">
            <div className="hero-card hero-card-primary">
              <p>Session Strategy</p>
              <strong>JWT in HttpOnly cookie</strong>
              <span>Passwords are hashed with scrypt before storage.</span>
            </div>
            <div className="hero-grid">
              <article className="hero-card">
                <strong>{user ? "Authenticated" : "Signed out"}</strong>
                <span>{user ? user.email : "Login required for dashboard access."}</span>
              </article>
              {metrics.map((metric) => (
                <article key={metric.label} className="hero-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-section content-section" id="auth">
          <div className="section-intro">
            <p className="eyebrow">Authentication</p>
            <h2>Basic register and login flow with secure storage.</h2>
            <p className="section-copy">
              Use the form below to create an account or sign in. The backend validates the
              credentials, hashes passwords before saving them, and returns clear errors for
              invalid login attempts.
            </p>
          </div>

          <div className="auth-layout">
            <div className="auth-panel">
              <div className="auth-switcher" role="tablist" aria-label="Authentication mode">
                <button
                  className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                  onClick={() => setAuthMode("register")}
                  type="button"
                >
                  Signup
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    name="email"
                    onChange={handleAuthChange}
                    required
                    type="email"
                    value={authForm.email}
                  />
                </label>

                <label>
                  Password
                  <input
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    minLength="8"
                    name="password"
                    onChange={handleAuthChange}
                    required
                    type="password"
                    value={authForm.password}
                  />
                </label>

                <button className="button button-primary" disabled={isAuthSubmitting} type="submit">
                  {isAuthSubmitting
                    ? authMode === "login"
                      ? "Logging in..."
                      : "Creating account..."
                    : authMode === "login"
                      ? "Login"
                      : "Signup"}
                </button>

                <p aria-live="polite" className={`status-message ${authStatus.type || ""}`}>
                  {authStatus.message}
                </p>
              </form>
            </div>

            <div className="auth-panel auth-info-panel">
              <strong>API endpoints included</strong>
              <p>`POST /api/register`, `POST /api/login`, `GET /api/me`, `POST /api/logout`</p>
              <strong>Security basics included</strong>
              <p>Password hashing, HttpOnly cookie storage, input validation, and session checks.</p>
            </div>
          </div>
        </section>

        <section className="content-section" id="dashboard">
          <div className="section-intro">
            <p className="eyebrow">Protected state</p>
            <h2>Redirect users here after successful login.</h2>
          </div>

          <div className="dashboard-card">
            {isSessionLoading ? (
              <p className="section-copy">Checking current session...</p>
            ) : user ? (
              <>
                <strong>Logged in as {user.email}</strong>
                <p className="section-copy">
                  The browser session is active and backed by a signed JWT cookie. This is the
                  area you can protect for authenticated users.
                </p>
              </>
            ) : (
              <>
                <strong>Authentication required</strong>
                <p className="section-copy">
                  Login failed or no session exists yet. Use the auth form above to access this
                  area.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="trust-band" aria-label="Trust signals">
          {signals.map((signal) => (
            <p key={signal}>{signal}</p>
          ))}
        </section>

        <section className="content-section" id="marketplace">
          <div className="section-intro">
            <p className="eyebrow">Marketplace coverage</p>
            <h2>Focused categories that feel useful on day one.</h2>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <article key={category.title} className="category-row">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section split-section" id="workflow">
          <div className="section-intro">
            <p className="eyebrow">Operational workflow</p>
            <h2>Simple seller onboarding, now wired for real systems.</h2>
            <p className="section-copy">
              The frontend submits a structured application payload to a Vercel API route.
              Authentication is now handled by dedicated auth routes backed by Supabase and
              signed session cookies.
            </p>
          </div>

          <div className="step-stack">
            {steps.map((step) => (
              <article key={step.number} className="step-card">
                <p className="step-number">{step.number}</p>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section application-section" id="apply">
          <div className="section-intro">
            <p className="eyebrow">Seller application</p>
            <h2>Collect the right details once, then send them somewhere real.</h2>
            <p className="section-copy">
              The seller form remains available, while authentication is handled separately by
              the new register and login endpoints.
            </p>
          </div>

          <form className="application-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Full Name
                <input
                  autoComplete="name"
                  name="fullName"
                  onChange={handleChange}
                  placeholder="Aanya Sharma..."
                  required
                  type="text"
                  value={formData.fullName}
                />
              </label>

              <label>
                Email Address
                <input
                  autoComplete="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="student@college.edu..."
                  required
                  spellCheck={false}
                  type="email"
                  value={formData.email}
                />
              </label>

              <label>
                University
                <input
                  autoComplete="organization"
                  name="university"
                  onChange={handleChange}
                  placeholder="AKTU, DU, VIT..."
                  required
                  type="text"
                  value={formData.university}
                />
              </label>

              <label>
                Roll Number
                <input
                  autoComplete="off"
                  name="rollNumber"
                  onChange={handleChange}
                  placeholder="240032015..."
                  required
                  spellCheck={false}
                  type="text"
                  value={formData.rollNumber}
                />
              </label>

              <label>
                Department
                <select name="department" onChange={handleChange} value={formData.department}>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Offering Type
                <select
                  name="offeringType"
                  onChange={handleChange}
                  value={formData.offeringType}
                >
                  <option value="Freelance services">Freelance services</option>
                  <option value="Digital products">Digital products</option>
                  <option value="Physical goods">Physical goods</option>
                  <option value="Tutoring">Tutoring</option>
                </select>
              </label>
            </div>

            <label>
              Portfolio URL
              <input
                autoComplete="url"
                inputMode="url"
                name="portfolioUrl"
                onChange={handleChange}
                placeholder="https://portfolio.site..."
                type="url"
                value={formData.portfolioUrl}
              />
            </label>

            <label>
              What do you want to sell?
              <textarea
                name="notes"
                onChange={handleChange}
                placeholder="Describe your services, products, target buyers, and why your work stands out..."
                rows="5"
                value={formData.notes}
              />
            </label>

            <div className="form-actions">
              <button className="button button-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
              <button
                className="button button-secondary"
                disabled={isCheckoutLoading}
                onClick={startCheckout}
                type="button"
              >
                {isCheckoutLoading ? "Preparing Checkout..." : `Pay ${verificationFee} & Get Priority Review`}
              </button>
            </div>

            <p aria-live="polite" className={`status-message ${formStatus.type || ""}`}>
              {formStatus.message}
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
