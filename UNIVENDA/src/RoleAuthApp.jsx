import { startTransition, useEffect, useState } from "react";

const ROUTES = ["/", "/dashboard", "/products", "/services"];
const PRODUCT_CATEGORIES = ["Handmade crafts", "Art", "Clothing", "Decor", "Other self-made items"];
const THEME_STORAGE_KEY = "univenda-theme";

const authDefaults = { email: "", password: "" };
const productDefaults = { title: "", description: "", price: "", category: PRODUCT_CATEGORIES[0], images: "" };
const serviceDefaults = { skillTitle: "", description: "", pricing: "", deliveryTime: "" };

const formatMoney = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function pathNow() {
  if (typeof window === "undefined") {
    return "/";
  }

  return ROUTES.includes(window.location.pathname) ? window.location.pathname : "/";
}

function go(path, replace = false) {
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Status({ value }) {
  return value.message ? <p className={`status-message ${value.type || ""}`}>{value.message}</p> : null;
}

function Section({ eyebrow, title, copy, children }) {
  return (
    <section className="content-section">
      <div className="section-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {copy ? <p className="section-copy">{copy}</p> : null}
      </div>
      {children}
    </section>
  );
}

function RoleAuthApp() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [route, setRoute] = useState(pathNow);
  const [authMode, setAuthMode] = useState("signup");
  const [authForm, setAuthForm] = useState(authDefaults);
  const [authStatus, setAuthStatus] = useState({ type: "", message: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [productForm, setProductForm] = useState(productDefaults);
  const [serviceForm, setServiceForm] = useState(serviceDefaults);
  const [productStatus, setProductStatus] = useState({ type: "", message: "" });
  const [serviceStatus, setServiceStatus] = useState({ type: "", message: "" });
  const [productBusy, setProductBusy] = useState(false);
  const [serviceBusy, setServiceBusy] = useState(false);
  const [productEditId, setProductEditId] = useState("");
  const [serviceEditId, setServiceEditId] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onPop = () => setRoute(pathNow());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const payload = await response.json();
        if (!active) {
          return;
        }

        setUser(payload.user || null);
        if (payload.user) {
          await refreshWorkspace();
        }
      } finally {
        if (active) {
          setSessionLoading(false);
        }
      }
    }

    boot();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionLoading && !user && route !== "/") {
      go("/", true);
    }
  }, [route, sessionLoading, user]);

  async function refreshWorkspace() {
    const [a, b, c] = await Promise.all([
      fetch("/api/student/dashboard"),
      fetch("/api/products"),
      fetch("/api/services"),
    ]);
    const [dashboardPayload, productPayload, servicePayload] = await Promise.all([a.json(), b.json(), c.json()]);

    if (!a.ok) throw new Error(dashboardPayload.error || "Could not load dashboard.");
    if (!b.ok) throw new Error(productPayload.error || "Could not load products.");
    if (!c.ok) throw new Error(servicePayload.error || "Could not load services.");

    startTransition(() => {
      setDashboard(dashboardPayload);
      setProducts(productPayload.items || []);
      setServices(servicePayload.items || []);
    });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthStatus({ type: "", message: "" });

    try {
      const endpoint = authMode === "signup" ? "/api/auth/student/signup" : "/api/auth/student/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Authentication failed.");

      setUser(payload.user || null);
      setAuthForm(authDefaults);
      setAuthStatus({ type: "success", message: payload.message || "Student account ready." });
      await refreshWorkspace();
      go("/dashboard");
    } catch (error) {
      setAuthStatus({ type: "error", message: error.message });
    } finally {
      setAuthLoading(false);
      setSessionLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setDashboard(null);
    setProducts([]);
    setServices([]);
    go("/", true);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setProductBusy(true);
    setProductStatus({ type: "", message: "" });

    try {
      const response = await fetch(productEditId ? `/api/products/${productEditId}` : "/api/products", {
        method: productEditId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save product.");
      await refreshWorkspace();
      setProductForm(productDefaults);
      setProductEditId("");
      setProductStatus({ type: "success", message: payload.message || "Product saved." });
    } catch (error) {
      setProductStatus({ type: "error", message: error.message });
    } finally {
      setProductBusy(false);
    }
  }

  async function saveService(event) {
    event.preventDefault();
    setServiceBusy(true);
    setServiceStatus({ type: "", message: "" });

    try {
      const response = await fetch(serviceEditId ? `/api/services/${serviceEditId}` : "/api/services", {
        method: serviceEditId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save service.");
      await refreshWorkspace();
      setServiceForm(serviceDefaults);
      setServiceEditId("");
      setServiceStatus({ type: "success", message: payload.message || "Service saved." });
    } catch (error) {
      setServiceStatus({ type: "error", message: error.message });
    } finally {
      setServiceBusy(false);
    }
  }

  async function removeProduct(id) {
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setProductStatus({ type: "error", message: payload.error || "Could not delete product." });
      return;
    }
    await refreshWorkspace();
    setProductStatus({ type: "success", message: payload.message || "Product deleted." });
  }

  async function removeService(id) {
    const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setServiceStatus({ type: "error", message: payload.error || "Could not delete service." });
      return;
    }
    await refreshWorkspace();
    setServiceStatus({ type: "success", message: payload.message || "Service deleted." });
  }

  const nav = (
    <nav aria-label="Primary">
      <ul className="nav-links">
        <li><button className={`nav-button ${route === "/" ? "active" : ""}`} onClick={() => go("/")} type="button">Home</button></li>
        {user ? <li><button className={`nav-button ${route === "/dashboard" ? "active" : ""}`} onClick={() => go("/dashboard")} type="button">Dashboard</button></li> : null}
        {user ? <li><button className={`nav-button ${route === "/products" ? "active" : ""}`} onClick={() => go("/products")} type="button">Products</button></li> : null}
        {user ? <li><button className={`nav-button ${route === "/services" ? "active" : ""}`} onClick={() => go("/services")} type="button">Services</button></li> : null}
      </ul>
    </nav>
  );

  let body = null;

  if (!user || route === "/") {
    body = (
      <>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Student seller module</p>
            <h1>One account for self-made products and freelance services.</h1>
            <p className="hero-body">
              Signup automatically stores the <strong>student</strong> role and enables both
              product selling and freelancing. No extra onboarding happens after login.
            </p>
          </div>
          <div className="hero-panel">
            <div className="hero-card hero-card-primary">
              <p>Routes</p>
              <strong>/dashboard, /products, /services</strong>
              <span>Protected for logged-in students only.</span>
            </div>
          </div>
        </section>

        <Section
          eyebrow="Student access"
          title="Register once, manage both modules."
          copy="The same user ID is reused for the products table and the freelance services table."
        >
          <div className="auth-layout">
            <div className="auth-panel">
              <div className="auth-switcher" role="tablist" aria-label="Authentication mode">
                <button className={`auth-tab ${authMode === "login" ? "active" : ""}`} onClick={() => setAuthMode("login")} type="button">Login</button>
                <button className={`auth-tab ${authMode === "signup" ? "active" : ""}`} onClick={() => setAuthMode("signup")} type="button">Signup</button>
              </div>
              <form className="auth-form" onSubmit={submitAuth}>
                <label>Email<input name="email" onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required type="email" value={authForm.email} /></label>
                <label>Password<input minLength="8" name="password" onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required type="password" value={authForm.password} /></label>
                <button className="button button-primary" disabled={authLoading} type="submit">
                  {authLoading ? "Please wait..." : authMode === "signup" ? "Create Student Account" : "Login"}
                </button>
                <Status value={authStatus} />
              </form>
            </div>
            <div className="auth-panel auth-info-panel">
              <strong>Product module</strong>
              <p>Add title, description, price, category, and images for self-made physical items.</p>
              <strong>Freelance module</strong>
              <p>Add skill title, description, pricing, and delivery time under the same account.</p>
            </div>
          </div>
        </Section>
      </>
    );
  } else if (sessionLoading) {
    body = <Section eyebrow="Loading" title="Checking student session." copy="Loading protected workspace." />;
  } else if (route === "/dashboard") {
    body = (
      <Section
        eyebrow="Dashboard"
        title="Unified student dashboard."
        copy={`Authenticated as ${user.email}. Same account, same user ID, two separate modules.`}
      >
        <div className="dashboard-stat-grid">
          {Object.entries(dashboard?.quickStats || {}).map(([label, value]) => (
            <article key={label} className="hero-card">
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
        <div className="management-grid">
          <article className="dashboard-module-card">
            <p className="eyebrow">Product selling</p>
            <h3>Self-made physical products only</h3>
            <p>{dashboard?.guidance?.productRule}</p>
            <button className="button button-primary" onClick={() => go("/products")} type="button">Manage Products</button>
          </article>
          <article className="dashboard-module-card">
            <p className="eyebrow">Freelancing</p>
            <h3>Create and manage gigs</h3>
            <p>Offer services with transparent pricing and delivery time.</p>
            <button className="button button-primary" onClick={() => go("/services")} type="button">Manage Services</button>
          </article>
        </div>
      </Section>
    );
  } else if (route === "/products") {
    body = (
      <Section
        eyebrow="Products"
        title="Manage product listings."
        copy="Restriction: only self-created physical items can be listed in this section."
      >
        <div className="management-grid">
          <form className="application-form manager-form" onSubmit={saveProduct}>
            <div className="form-banner"><strong>Restriction</strong><p>Only self-made items are allowed.</p></div>
            <div className="field-grid">
              <label>Title<input name="title" onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} required type="text" value={productForm.title} /></label>
              <label>Price<input min="1" name="price" onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required step="0.01" type="number" value={productForm.price} /></label>
              <label>Category<select name="category" onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} value={productForm.category}>{PRODUCT_CATEGORIES.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
            </div>
            <label>Description<textarea name="description" onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required rows="4" value={productForm.description} /></label>
            <label>Images<textarea name="images" onChange={(e) => setProductForm({ ...productForm, images: e.target.value })} rows="3" value={productForm.images} /></label>
            <div className="form-actions">
              <button className="button button-primary" disabled={productBusy} type="submit">{productBusy ? "Saving..." : productEditId ? "Update Product" : "Add Product"}</button>
              {productEditId ? <button className="button button-secondary" onClick={() => { setProductEditId(""); setProductForm(productDefaults); }} type="button">Cancel</button> : null}
            </div>
            <Status value={productStatus} />
          </form>
          <div className="card-stack">
            {products.length ? products.map((item) => (
              <article key={item.id} className="manager-card">
                <div className="manager-card-header">
                  <div><h3>{item.title}</h3><p>{item.category}</p></div>
                  <strong>{formatMoney.format(Number(item.price || 0))}</strong>
                </div>
                <p>{item.description}</p>
                <div className="inline-actions">
                  <button className="button button-secondary" onClick={() => { setProductEditId(item.id); setProductForm({ title: item.title, description: item.description, price: String(item.price), category: item.category, images: (item.images || []).join("\n") }); }} type="button">Edit</button>
                  <button className="button button-ghost" onClick={() => removeProduct(item.id)} type="button">Delete</button>
                </div>
              </article>
            )) : <div className="dashboard-card dashboard-card-compact"><strong>No products yet</strong><p className="section-copy">Create your first listing.</p></div>}
          </div>
        </div>
      </Section>
    );
  } else {
    body = (
      <Section
        eyebrow="Services"
        title="Manage freelance gigs."
        copy="Service data is separate from product data, but both belong to the same student account."
      >
        <div className="management-grid">
          <form className="application-form manager-form" onSubmit={saveService}>
            <div className="field-grid">
              <label>Skill Title<input name="skillTitle" onChange={(e) => setServiceForm({ ...serviceForm, skillTitle: e.target.value })} required type="text" value={serviceForm.skillTitle} /></label>
              <label>Pricing<input min="1" name="pricing" onChange={(e) => setServiceForm({ ...serviceForm, pricing: e.target.value })} required step="0.01" type="number" value={serviceForm.pricing} /></label>
              <label>Delivery Time (days)<input min="1" name="deliveryTime" onChange={(e) => setServiceForm({ ...serviceForm, deliveryTime: e.target.value })} required type="number" value={serviceForm.deliveryTime} /></label>
            </div>
            <label>Description<textarea name="description" onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} required rows="4" value={serviceForm.description} /></label>
            <div className="form-actions">
              <button className="button button-primary" disabled={serviceBusy} type="submit">{serviceBusy ? "Saving..." : serviceEditId ? "Update Gig" : "Create Service"}</button>
              {serviceEditId ? <button className="button button-secondary" onClick={() => { setServiceEditId(""); setServiceForm(serviceDefaults); }} type="button">Cancel</button> : null}
            </div>
            <Status value={serviceStatus} />
          </form>
          <div className="card-stack">
            {services.length ? services.map((item) => (
              <article key={item.id} className="manager-card">
                <div className="manager-card-header">
                  <div><h3>{item.skillTitle}</h3><p>{item.deliveryTime} day delivery</p></div>
                  <strong>{formatMoney.format(Number(item.pricing || 0))}</strong>
                </div>
                <p>{item.description}</p>
                <div className="inline-actions">
                  <button className="button button-secondary" onClick={() => { setServiceEditId(item.id); setServiceForm({ skillTitle: item.skillTitle, description: item.description, pricing: String(item.pricing), deliveryTime: String(item.deliveryTime) }); }} type="button">Edit</button>
                  <button className="button button-ghost" onClick={() => removeService(item.id)} type="button">Delete</button>
                </div>
              </article>
            )) : <div className="dashboard-card dashboard-card-compact"><strong>No services yet</strong><p className="section-copy">Create your first gig.</p></div>}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">U</span>
          <div>
            <p className="brand-name">UNIVENDA</p>
            <p className="brand-meta">Student e-commerce + freelancing platform</p>
          </div>
        </div>
        {nav}
        <div className="header-actions">
          {user ? <button className="button button-secondary header-button" onClick={logout} type="button">Logout</button> : null}
          <button aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} type="button">
            <span aria-hidden="true">{theme === "dark" ? "Light" : "Dark"}</span>
            <span className="theme-toggle-track" aria-hidden="true"><span className="theme-toggle-thumb" /></span>
          </button>
        </div>
      </header>
      <main id="main-content">{body}</main>
    </div>
  );
}

export default RoleAuthApp;
