import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  CUSTOMER_MODES,
  formatIndianPrice,
  getFreelancerById,
  getProductById,
} from "../shared/customerMarketplace.js";

const THEME_STORAGE_KEY = "univenda-theme";
const ROLE_STORAGE_KEY = "univenda-selected-role";
const CUSTOMER_MODE_STORAGE_KEY = "univenda-customer-mode";
const INITIAL_AUTH_FORM = { email: "", password: "" };

const USER_ROLES = {
  seller: {
    id: "seller",
    label: "Student Seller",
    title: "Sell products and freelance services",
    subtitle: "Protected seller workspace for listings, leads, and delivery.",
    authPath: "/auth/seller",
    dashboardPath: "/seller/dashboard",
    loginEndpoint: "/api/auth/seller/login",
    signupEndpoint: "/api/auth/seller/signup",
    dashboardEndpoint: "/api/seller/dashboard",
  },
  customer: {
    id: "customer",
    label: "Customer",
    title: "Buy products or hire students",
    subtitle: "One account, two clear journeys based on buying intent.",
    authPath: "/auth/customer",
    dashboardPath: "/customer/dashboard",
    loginEndpoint: "/api/auth/customer/login",
    signupEndpoint: "/api/auth/customer/signup",
    dashboardEndpoint: "/api/customer/dashboard",
  },
};

const ROLE_LIST = Object.values(USER_ROLES);
const ROUTE_BLUEPRINTS = [
  { path: "/", purpose: "Role-aware entry screen before authentication." },
  { path: "/auth/customer", purpose: "Customer login and signup." },
  { path: "/customer/dashboard", purpose: "Customer intent selection after login." },
  { path: "/shop", purpose: "Dedicated product browsing experience." },
  { path: "/product/:id", purpose: "Focused product detail page." },
  { path: "/hire", purpose: "Dedicated freelancer discovery experience." },
  { path: "/freelancer/:id", purpose: "Professional freelancer profile page." },
];
const STACK_ITEMS = [
  "React 18 + Vite SPA",
  "Vercel serverless APIs",
  "Supabase-backed auth users",
  "JWT session in an HttpOnly cookie",
  "Protected checkout and hiring validation",
];
const SECURITY_ITEMS = [
  "Only signed-in customers can load product and freelancer data from protected routes.",
  "Checkout validates product existence, quantity, and current inventory before confirming.",
  "Hire actions validate freelancer existence and intent under the same customer session.",
  "Customer shopping and hiring surfaces stay visually and behaviorally separate.",
];
const PRODUCT_SORT_OPTIONS = {
  featured: "Featured",
  priceLow: "Price: Low to High",
  priceHigh: "Price: High to Low",
};
const FREELANCER_SORT_OPTIONS = {
  featured: "Featured",
  priceLow: "Price: Low to High",
  priceHigh: "Price: High to Low",
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

function getStoredCustomerMode() {
  if (typeof window === "undefined") {
    return CUSTOMER_MODES.SHOP;
  }

  const mode = window.localStorage.getItem(CUSTOMER_MODE_STORAGE_KEY);
  return mode === CUSTOMER_MODES.HIRE ? CUSTOMER_MODES.HIRE : CUSTOMER_MODES.SHOP;
}

function persistRole(role) {
  if (typeof window === "undefined" || !USER_ROLES[role]) {
    return;
  }

  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

function persistCustomerMode(mode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CUSTOMER_MODE_STORAGE_KEY, mode);
}

function parseRoute(pathname) {
  if (pathname === "/") {
    return { name: "role-selection", role: null, id: null };
  }

  if (pathname === USER_ROLES.seller.authPath) {
    return { name: "auth", role: USER_ROLES.seller.id, id: null };
  }

  if (pathname === USER_ROLES.customer.authPath) {
    return { name: "auth", role: USER_ROLES.customer.id, id: null };
  }

  if (pathname === USER_ROLES.seller.dashboardPath) {
    return { name: "seller-dashboard", role: USER_ROLES.seller.id, id: null };
  }

  if (pathname === USER_ROLES.customer.dashboardPath) {
    return { name: "customer-dashboard", role: USER_ROLES.customer.id, id: null };
  }

  if (pathname === "/shop") {
    return { name: "shop", role: USER_ROLES.customer.id, id: null };
  }

  if (pathname === "/hire") {
    return { name: "hire", role: USER_ROLES.customer.id, id: null };
  }

  const productMatch = pathname.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    return { name: "product-detail", role: USER_ROLES.customer.id, id: productMatch[1] };
  }

  const freelancerMatch = pathname.match(/^\/freelancer\/([^/]+)$/);
  if (freelancerMatch) {
    return { name: "freelancer-detail", role: USER_ROLES.customer.id, id: freelancerMatch[1] };
  }

  return { name: "not-found", role: null, id: null };
}

function getCurrentRoute() {
  if (typeof window === "undefined") {
    return { name: "role-selection", role: null, id: null };
  }

  return parseRoute(window.location.pathname);
}

function navigateTo(path, setRoute, replace = false) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== path) {
    const updateHistory = replace ? window.history.replaceState : window.history.pushState;
    updateHistory.call(window.history, {}, "", path);
  }

  startTransition(() => {
    setRoute(parseRoute(path));
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function getPricingLabel(pricingType, price) {
  if (pricingType === "hourly") {
    return `${formatIndianPrice(price)} / hour`;
  }

  if (pricingType === "project") {
    return `${formatIndianPrice(price)} / project`;
  }

  return `${formatIndianPrice(price)} fixed`;
}

function sortByPriceOrRating(items, sortKey) {
  const copy = [...items];

  if (sortKey === "priceLow") {
    return copy.sort((left, right) => left.price - right.price);
  }

  if (sortKey === "priceHigh") {
    return copy.sort((left, right) => right.price - left.price);
  }

  return copy.sort((left, right) => right.rating - left.rating);
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

function Header({
  currentRoute,
  customerMode,
  onNavigate,
  onLogout,
  onSwitchCustomerMode,
  theme,
  toggleTheme,
  user,
}) {
  const savedRole = getStoredRole();
  const signedInPath = user ? USER_ROLES[user.role]?.dashboardPath : null;
  const authPath = user
    ? signedInPath || "/"
    : savedRole && USER_ROLES[savedRole]
      ? USER_ROLES[savedRole].authPath
      : "/";
  const isCustomerRoute =
    currentRoute.name === "customer-dashboard" ||
    currentRoute.name === "shop" ||
    currentRoute.name === "hire" ||
    currentRoute.name === "product-detail" ||
    currentRoute.name === "freelancer-detail";

  return (
    <header className="site-header">
      <button className="brand-lockup brand-button" onClick={() => onNavigate("/")} type="button">
        <span className="brand-mark" aria-hidden="true">
          U
        </span>
        <span className="brand-text">
          <span className="brand-name">UNIVENDA</span>
          <span className="brand-meta">Dual-mode customer commerce and hiring</span>
        </span>
      </button>

      <nav aria-label="Primary">
        <ul className="nav-links">
          <li>
            <button
              className={currentRoute.name === "role-selection" ? "nav-link active" : "nav-link"}
              onClick={() => onNavigate("/")}
              type="button"
            >
              Roles
            </button>
          </li>
          <li>
            <button
              className={currentRoute.name === "auth" ? "nav-link active" : "nav-link"}
              onClick={() => onNavigate(authPath)}
              type="button"
            >
              Auth
            </button>
          </li>
          <li>
            <button
              className={classNames(
                "nav-link",
                currentRoute.name === "customer-dashboard" || currentRoute.name === "seller-dashboard"
                  ? "active"
                  : "",
              )}
              onClick={() => onNavigate(signedInPath || "/")}
              type="button"
            >
              Workspace
            </button>
          </li>
        </ul>
      </nav>

      <div className="header-actions">
        {user?.role === "customer" && isCustomerRoute ? (
          <div className="mode-switch" role="tablist" aria-label="Customer mode">
            <button
              className={customerMode === CUSTOMER_MODES.SHOP ? "mode-tab active" : "mode-tab"}
              onClick={() => onSwitchCustomerMode(CUSTOMER_MODES.SHOP)}
              type="button"
            >
              Buy Products
            </button>
            <button
              className={customerMode === CUSTOMER_MODES.HIRE ? "mode-tab active" : "mode-tab"}
              onClick={() => onSwitchCustomerMode(CUSTOMER_MODES.HIRE)}
              type="button"
            >
              Hire Talent
            </button>
          </div>
        ) : null}

        {user ? (
          <button className="button button-secondary" onClick={onLogout} type="button">
            Logout
          </button>
        ) : null}
        <ThemeButton theme={theme} onToggle={toggleTheme} />
      </div>
    </header>
  );
}

function RoleSelectionView({ onSelectRole, user }) {
  return (
    <section className="hero-layout role-entry-layout">
      <div className="hero-copy hero-copy-large">
        <p className="eyebrow">Unified marketplace account</p>
        <h1>Buy products or hire student talent from one protected customer account.</h1>
        <p className="hero-body">
          After login, customers choose between a modern product storefront and a professional
          hiring workspace. The account remains the same, but the UI stays intentionally separate.
        </p>

        <div className="hero-inline-card">
          <strong>Current session</strong>
          <span>
            {user ? `${user.email} signed in as ${USER_ROLES[user.role]?.label}.` : "No active session yet."}
          </span>
        </div>
      </div>

      <div className="panel-grid">
        {ROLE_LIST.map((role) => (
          <article className="role-card" key={role.id}>
            <p className="role-chip">{role.label}</p>
            <h2>{role.title}</h2>
            <p>{role.subtitle}</p>
            <button className="button button-primary" onClick={() => onSelectRole(role.id)} type="button">
              Continue as {role.label}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AuthView({
  authForm,
  authMode,
  authStatus,
  isSessionLoading,
  isSubmitting,
  onAuthChange,
  onSelectRole,
  onSubmit,
  role,
  setAuthMode,
}) {
  const roleConfig = USER_ROLES[role];

  if (!roleConfig) {
    return (
      <section className="content-grid">
        <article className="panel panel-emphasis">
          <p className="eyebrow">Role required</p>
          <h1>Select a role before authenticating.</h1>
          <div className="button-row">
            {ROLE_LIST.map((item) => (
              <button
                className="button button-primary"
                key={item.id}
                onClick={() => onSelectRole(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="content-grid auth-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Role-specific auth</p>
        <h1>{roleConfig.label} authentication</h1>
        <p className="section-copy">
          Customer logins lead into an intent selector first, while seller accounts stay inside
          their own protected dashboard route.
        </p>

        <div className="auth-switcher" role="tablist" aria-label="Authentication mode">
          <button
            className={authMode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => setAuthMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={authMode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => setAuthMode("signup")}
            type="button"
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              onChange={onAuthChange}
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
              onChange={onAuthChange}
              required
              type="password"
              value={authForm.password}
            />
          </label>

          <button className="button button-primary" disabled={isSubmitting || isSessionLoading} type="submit">
            {isSubmitting
              ? authMode === "login"
                ? "Logging in..."
                : "Creating account..."
              : authMode === "login"
                ? `Login as ${roleConfig.label}`
                : `Create ${roleConfig.label} account`}
          </button>

          <p aria-live="polite" className={`status-message ${authStatus.type || ""}`}>
            {authStatus.message}
          </p>
        </form>
      </article>

      <article className="panel">
        <p className="eyebrow">Tech stack</p>
        <h2>Stack used here</h2>
        <ul className="feature-list">
          <li>Frontend: React 18 + Vite SPA.</li>
          <li>Backend: Vercel serverless API routes.</li>
          <li>Auth: Supabase users plus JWT cookie sessions.</li>
          <li>Customer data: separate product and freelancer entities with dedicated pricing models.</li>
        </ul>

        <div className="button-row">
          {ROLE_LIST.filter((item) => item.id !== role).map((item) => (
            <button
              className="button button-secondary"
              key={item.id}
              onClick={() => onSelectRole(item.id)}
              type="button"
            >
              Switch to {item.label}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function CustomerDashboardView({ customerMode, onEnterMode, user }) {
  return (
    <section className="customer-hub">
      <article className="customer-hub-hero">
        <p className="eyebrow">Customer workspace</p>
        <h1>Choose what you want to do right now.</h1>
        <p className="section-copy">
          The customer account is shared, but the platform keeps product buying and student hiring
          as two focused experiences with their own navigation and interaction style.
        </p>

        <div className="session-badge">
          <strong>Signed in</strong>
          <span>{user ? `${user.email} as Customer` : "Checking session..."}</span>
        </div>
      </article>

      <div className="intent-grid">
        <article className="intent-card shop-intent">
          <p className="role-chip">Mode 1</p>
          <h2>Buy Products</h2>
          <p>Product listing grid, category filters, product detail pages, cart logic, and checkout validation.</p>
          <button className="button button-primary" onClick={() => onEnterMode(CUSTOMER_MODES.SHOP)} type="button">
            Open Shop
          </button>
        </article>

        <article className="intent-card hire-intent">
          <p className="role-chip">Mode 2</p>
          <h2>Hire Talent</h2>
          <p>Search freelancers by skills, category, and pricing, then contact or hire from a clean profile view.</p>
          <button className="button button-primary" onClick={() => onEnterMode(CUSTOMER_MODES.HIRE)} type="button">
            Open Talent Search
          </button>
        </article>
      </div>

      <article className="panel">
        <p className="eyebrow">Saved preference</p>
        <h2>{customerMode === CUSTOMER_MODES.HIRE ? "Hire Talent" : "Buy Products"} is your current preferred mode.</h2>
        <p className="section-copy">You can switch modes any time without changing or reauthenticating the account.</p>
      </article>
    </section>
  );
}

function CustomerWorkspaceHeader({ activeMode, description, eyebrow, heading, onBack, user }) {
  return (
    <section className={activeMode === CUSTOMER_MODES.SHOP ? "workspace-hero shop-surface" : "workspace-hero hire-surface"}>
      <div className="workspace-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>
        <p className="section-copy">{description}</p>
        <div className="workspace-meta">
          <span>{user ? user.email : "Customer session loading"}</span>
          <button className="button button-secondary" onClick={onBack} type="button">
            Back to customer home
          </button>
        </div>
      </div>
    </section>
  );
}

function CustomerInsights({ productCount, freelancerCount }) {
  return (
    <div className="insight-strip">
      <article className="insight-card">
        <strong>{productCount}</strong>
        <span>Products</span>
      </article>
      <article className="insight-card">
        <strong>{freelancerCount}</strong>
        <span>Freelancers</span>
      </article>
      <article className="insight-card">
        <strong>2</strong>
        <span>Customer modes</span>
      </article>
    </div>
  );
}

function ShopView({
  allProducts,
  filters,
  onAddToCart,
  onCategoryChange,
  onOpenProduct,
  onQuantityChange,
  onSearchChange,
  onSortChange,
  products,
  quantityByProduct,
  searchValue,
  selectedCategory,
  selectedSort,
  user,
}) {
  const categories = filters.productCategories || [];

  return (
    <section className="workspace-section">
      <CustomerWorkspaceHeader
        activeMode={CUSTOMER_MODES.SHOP}
        description="A modern storefront focused on product discovery, browsing, and checkout without any hiring UI mixed in."
        eyebrow="Mode 1"
        heading="Buy Products"
        onBack={filters.onBack}
        user={user}
      />

      <CustomerInsights productCount={allProducts.length} freelancerCount={filters.freelancerCount} />

      <div className="workspace-layout shop-layout">
        <aside className="workspace-sidebar">
          <div className="filter-panel">
            <label>
              Search products
              <input
                onChange={onSearchChange}
                placeholder="Search by product, category, or tag"
                type="search"
                value={searchValue}
              />
            </label>

            <label>
              Category
              <select onChange={onCategoryChange} value={selectedCategory}>
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sort by
              <select onChange={onSortChange} value={selectedSort}>
                {Object.entries(PRODUCT_SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <div className="workspace-main">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Storefront</p>
              <h2>Product listing grid</h2>
            </div>
            <span className="result-pill">{products.length} results</span>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <button className="product-image-button" onClick={() => onOpenProduct(product.id)} type="button">
                  <img alt={product.name} className="product-image" src={product.images[0]} />
                </button>

                <div className="product-card-body">
                  <div className="product-card-topline">
                    <span className="surface-chip">{product.category}</span>
                    <span className="rating-pill">{product.rating.toFixed(1)}</span>
                  </div>
                  <button className="product-title-button" onClick={() => onOpenProduct(product.id)} type="button">
                    {product.name}
                  </button>
                  <p>{product.shortDescription}</p>

                  <div className="product-card-footer">
                    <div>
                      <strong>{formatIndianPrice(product.price)}</strong>
                      <span>{product.inventory} available</span>
                    </div>

                    <div className="card-actions">
                      <label className="mini-field">
                        Qty
                        <select onChange={(event) => onQuantityChange(product.id, event.target.value)} value={quantityByProduct[product.id] || "1"}>
                          {[1, 2, 3, 4].map((value) => (
                            <option key={value} value={String(value)}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="button button-primary" onClick={() => onAddToCart(product.id)} type="button">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductDetailView({ onAddToCart, onBackToShop, onQuantityChange, product, quantity, user }) {
  if (!product) {
    return (
      <section className="content-grid">
        <article className="panel panel-emphasis">
          <p className="eyebrow">Missing product</p>
          <h1>This product could not be found.</h1>
          <button className="button button-primary" onClick={onBackToShop} type="button">
            Return to shop
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="workspace-section">
      <CustomerWorkspaceHeader
        activeMode={CUSTOMER_MODES.SHOP}
        description="A focused product detail page with pricing, product imagery, seller context, and checkout controls."
        eyebrow="Product detail"
        heading={product.name}
        onBack={onBackToShop}
        user={user}
      />

      <div className="detail-layout">
        <div className="detail-gallery">
          {product.images.map((image, index) => (
            <img alt={`${product.name} view ${index + 1}`} className="detail-image" key={`${image}-${index}`} src={image} />
          ))}
        </div>

        <article className="detail-panel">
          <div className="detail-topline">
            <span className="surface-chip">{product.category}</span>
            <span className="rating-pill">{product.rating.toFixed(1)} rating</span>
          </div>
          <h2>{product.name}</h2>
          <p className="detail-price">{formatIndianPrice(product.price)}</p>
          <p className="section-copy">{product.description}</p>

          <ul className="feature-list">
            <li>Sold by {product.sellerName}</li>
            <li>{product.inventory} units currently available</li>
            <li>Tags: {product.tags.join(", ")}</li>
          </ul>

          <div className="detail-actions">
            <label className="mini-field">
              Quantity
              <select onChange={(event) => onQuantityChange(product.id, event.target.value)} value={quantity}>
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={String(value)}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button-primary" onClick={() => onAddToCart(product.id)} type="button">
              Add to Cart
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function HireView({
  allFreelancers,
  filters,
  freelancers,
  onCategoryChange,
  onContact,
  onOpenFreelancer,
  onPricingTypeChange,
  onSearchChange,
  onSortChange,
  searchValue,
  selectedCategory,
  selectedPricingType,
  selectedSort,
  user,
}) {
  const categories = filters.freelancerCategories || [];

  return (
    <section className="workspace-section">
      <CustomerWorkspaceHeader
        activeMode={CUSTOMER_MODES.HIRE}
        description="A professional talent search interface built for evaluating skills, portfolios, pricing models, and availability."
        eyebrow="Mode 2"
        heading="Hire Talent"
        onBack={filters.onBack}
        user={user}
      />

      <CustomerInsights productCount={filters.productCount} freelancerCount={allFreelancers.length} />

      <div className="workspace-layout hire-layout">
        <aside className="workspace-sidebar">
          <div className="filter-panel filter-panel-quiet">
            <label>
              Search talent
              <input
                onChange={onSearchChange}
                placeholder="Search by name, skill, or category"
                type="search"
                value={searchValue}
              />
            </label>

            <label>
              Category
              <select onChange={onCategoryChange} value={selectedCategory}>
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pricing model
              <select onChange={onPricingTypeChange} value={selectedPricingType}>
                <option value="all">All pricing models</option>
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
                <option value="project">Project-based</option>
              </select>
            </label>

            <label>
              Sort by
              <select onChange={onSortChange} value={selectedSort}>
                {Object.entries(FREELANCER_SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <div className="workspace-main">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Talent discovery</p>
              <h2>Freelancer search</h2>
            </div>
            <span className="result-pill">{freelancers.length} matches</span>
          </div>

          <div className="talent-list">
            {freelancers.map((freelancer) => (
              <article className="talent-card" key={freelancer.id}>
                <img alt={freelancer.name} className="talent-avatar" src={freelancer.image} />
                <div className="talent-main">
                  <div className="talent-topline">
                    <span className="surface-chip quiet">{freelancer.category}</span>
                    <span className="rating-pill">{freelancer.rating.toFixed(1)}</span>
                  </div>
                  <button className="talent-title-button" onClick={() => onOpenFreelancer(freelancer.id)} type="button">
                    {freelancer.name}
                  </button>
                  <p className="talent-title">{freelancer.title}</p>
                  <div className="skill-row">
                    {freelancer.skills.map((skill) => (
                      <span className="skill-pill" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="talent-side">
                  <strong>{getPricingLabel(freelancer.pricingType, freelancer.price)}</strong>
                  <span>{freelancer.availability}</span>
                  <span>{freelancer.responseTime}</span>
                  <div className="card-actions">
                    <button className="button button-secondary" onClick={() => onOpenFreelancer(freelancer.id)} type="button">
                      View Profile
                    </button>
                    <button className="button button-primary" onClick={() => onContact(freelancer.id, "contact")} type="button">
                      Contact
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FreelancerDetailView({ freelancer, onContact, onHire, onReturn, user }) {
  if (!freelancer) {
    return (
      <section className="content-grid">
        <article className="panel panel-emphasis">
          <p className="eyebrow">Missing profile</p>
          <h1>This freelancer could not be found.</h1>
          <button className="button button-primary" onClick={onReturn} type="button">
            Return to talent search
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="workspace-section">
      <CustomerWorkspaceHeader
        activeMode={CUSTOMER_MODES.HIRE}
        description="A professional freelancer profile page with skills, portfolio highlights, and clear hourly, fixed, or project pricing."
        eyebrow="Freelancer profile"
        heading={freelancer.name}
        onBack={onReturn}
        user={user}
      />

      <div className="profile-layout">
        <article className="profile-overview">
          <img alt={freelancer.name} className="profile-avatar" src={freelancer.image} />
          <div className="profile-copy">
            <div className="detail-topline">
              <span className="surface-chip quiet">{freelancer.category}</span>
              <span className="rating-pill">{freelancer.rating.toFixed(1)} rating</span>
            </div>
            <h2>{freelancer.title}</h2>
            <p className="detail-price">{getPricingLabel(freelancer.pricingType, freelancer.price)}</p>
            <p className="section-copy">{freelancer.bio}</p>

            <div className="detail-actions">
              <button className="button button-secondary" onClick={() => onContact(freelancer.id)} type="button">
                Contact
              </button>
              <button className="button button-primary" onClick={() => onHire(freelancer.id)} type="button">
                Hire Now
              </button>
            </div>
          </div>
        </article>

        <article className="detail-panel">
          <p className="eyebrow">Skills</p>
          <div className="skill-row skill-row-large">
            {freelancer.skills.map((skill) => (
              <span className="skill-pill" key={skill}>
                {skill}
              </span>
            ))}
          </div>

          <p className="eyebrow">Portfolio</p>
          <ul className="feature-list">
            {freelancer.portfolioHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p className="eyebrow">Working terms</p>
          <ul className="feature-list">
            <li>{freelancer.availability}</li>
            <li>{freelancer.responseTime}</li>
            <li>Pricing type: {freelancer.pricingType}</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function CustomerSidebar({ actionStatus, cartItems, marketplace }) {
  const lineItems = Object.values(cartItems)
    .map((item) => {
      const product = (marketplace.products || []).find((candidate) => candidate.id === item.productId);

      if (!product) {
        return null;
      }

      return {
        ...item,
        name: product.name,
        total: product.price * item.quantity,
      };
    })
    .filter(Boolean);
  const total = lineItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <aside className="summary-panel">
      <article className="panel">
        <p className="eyebrow">Cart preview</p>
        <h2>{lineItems.length} selected items</h2>
        {lineItems.length ? (
          <div className="summary-list">
            {lineItems.map((item) => (
              <div className="summary-row" key={item.productId}>
                <span>
                  {item.name} x {item.quantity}
                </span>
                <strong>{formatIndianPrice(item.total)}</strong>
              </div>
            ))}
            <div className="summary-row summary-row-total">
              <span>Total</span>
              <strong>{formatIndianPrice(total)}</strong>
            </div>
          </div>
        ) : (
          <p className="section-copy">Add products from the shop to build a checkout preview.</p>
        )}
      </article>

      <article className="panel">
        <p className="eyebrow">Action status</p>
        <h2>Validation feedback</h2>
        <p className={`status-message ${actionStatus.type || ""}`}>{actionStatus.message || "Protected checkout and hiring actions will report back here."}</p>
      </article>
    </aside>
  );
}

function SellerDashboardView({ dashboardState, isSessionLoading, onNavigate, user }) {
  return (
    <section className="content-grid dashboard-grid">
      <article className="panel panel-emphasis">
        <p className="eyebrow">Seller workspace</p>
        <h1>Seller routes remain isolated from the customer module.</h1>
        <p className="section-copy">
          This customer build keeps the seller experience separate, so product buying and talent
          hiring never bleed into the seller workspace.
        </p>

        <div className="session-badge">
          <strong>Authenticated seller</strong>
          <span>{user ? user.email : "Checking active session..."}</span>
        </div>

        <div className="button-row">
          <button className="button button-secondary" onClick={() => onNavigate("/")} type="button">
            Back to role selection
          </button>
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Protected API</p>
        <h2>/api/seller/dashboard</h2>
        {isSessionLoading || dashboardState.loading ? (
          <p className="section-copy">Loading seller dashboard data...</p>
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
        <h2>Customer flows now have dedicated URLs</h2>
        <ul className="route-list">
          {ROUTE_BLUEPRINTS.map((route) => (
            <li key={route.path}>
              <strong>{route.path}</strong>
              <span>{route.purpose}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <p className="eyebrow">Tech stack</p>
        <h2>Stack used in this module</h2>
        <ul className="feature-list">
          {STACK_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <p className="eyebrow">Access control</p>
        <h2>Validation before checkout or hiring</h2>
        <ul className="feature-list">
          {SECURITY_ITEMS.map((item) => (
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
        <h1>This route is not part of the current marketplace shell.</h1>
        <p className="section-copy">
          Supported customer paths include <code>/shop</code>, <code>/hire</code>, product detail,
          and freelancer profile routes.
        </p>
        <button className="button button-primary" onClick={() => onNavigate("/")} type="button">
          Go to role selection
        </button>
      </article>
    </section>
  );
}

function CustomerAppShell() {
  const [route, setRoute] = useState(getCurrentRoute);
  const [theme, setTheme] = useState(getSavedTheme);
  const [selectedRole, setSelectedRole] = useState(getStoredRole);
  const [customerMode, setCustomerMode] = useState(getStoredCustomerMode);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(INITIAL_AUTH_FORM);
  const [authStatus, setAuthStatus] = useState({ type: "", message: "" });
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [sessionState, setSessionState] = useState({ loading: true, user: null });
  const [dashboardState, setDashboardState] = useState({ loading: false, data: null, error: "" });
  const [marketplaceState, setMarketplaceState] = useState({
    loading: false,
    loaded: false,
    data: { products: [], freelancers: [], filters: { productCategories: [], freelancerCategories: [] } },
    error: "",
  });
  const [shopSearch, setShopSearch] = useState("");
  const [shopCategory, setShopCategory] = useState("all");
  const [shopSort, setShopSort] = useState("featured");
  const [talentSearch, setTalentSearch] = useState("");
  const [talentCategory, setTalentCategory] = useState("all");
  const [talentPricingType, setTalentPricingType] = useState("all");
  const [talentSort, setTalentSort] = useState("featured");
  const [quantityByProduct, setQuantityByProduct] = useState({});
  const [cartItems, setCartItems] = useState({});
  const [actionStatus, setActionStatus] = useState({ type: "", message: "" });
  const deferredShopSearch = useDeferredValue(shopSearch);
  const deferredTalentSearch = useDeferredValue(talentSearch);

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
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

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
    if (selectedRole) {
      persistRole(selectedRole);
    }
  }, [selectedRole]);

  useEffect(() => {
    persistCustomerMode(customerMode);
  }, [customerMode]);

  useEffect(() => {
    if (sessionState.loading) {
      return;
    }

    const user = sessionState.user;
    const customerRoutes = new Set(["customer-dashboard", "shop", "hire", "product-detail", "freelancer-detail"]);

    if (user?.role) {
      setSelectedRole(user.role);

      if (route.name === "role-selection" || route.name === "auth" || route.name === "not-found") {
        navigateTo(USER_ROLES[user.role].dashboardPath, setRoute, true);
        return;
      }

      if (user.role === "seller" && customerRoutes.has(route.name)) {
        navigateTo(USER_ROLES.seller.dashboardPath, setRoute, true);
        return;
      }

      if (user.role === "customer" && route.name === "seller-dashboard") {
        navigateTo(USER_ROLES.customer.dashboardPath, setRoute, true);
      }

      return;
    }

    if (route.role && USER_ROLES[route.role]) {
      setSelectedRole(route.role);
      navigateTo(USER_ROLES[route.role].authPath, setRoute, true);
      setDashboardState({ loading: false, data: null, error: "" });
    }
  }, [route.name, route.role, sessionState.loading, sessionState.user]);

  useEffect(() => {
    if (route.name !== "seller-dashboard" || !sessionState.user || sessionState.user.role !== "seller") {
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      setDashboardState({ loading: true, data: null, error: "" });

      try {
        const response = await fetch(USER_ROLES.seller.dashboardEndpoint, {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!active) {
          return;
        }

        if (response.status === 401) {
          setSessionState({ loading: false, user: null });
          navigateTo(USER_ROLES.seller.authPath, setRoute, true);
          return;
        }

        if (!response.ok) {
          throw new Error(payload.error || "Could not load seller dashboard.");
        }

        setDashboardState({ loading: false, data: payload, error: "" });
      } catch (error) {
        if (active) {
          setDashboardState({
            loading: false,
            data: null,
            error: error.message || "Could not load seller dashboard.",
          });
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [route.name, sessionState.user]);

  useEffect(() => {
    const isCustomerArea =
      route.name === "customer-dashboard" ||
      route.name === "shop" ||
      route.name === "hire" ||
      route.name === "product-detail" ||
      route.name === "freelancer-detail";

    if (!isCustomerArea || !sessionState.user || sessionState.user.role !== "customer") {
      return;
    }

    if (marketplaceState.loaded || marketplaceState.loading) {
      return;
    }

    let active = true;

    const loadMarketplace = async () => {
      setMarketplaceState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const response = await fetch("/api/customer/marketplace", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!active) {
          return;
        }

        if (response.status === 401) {
          setSessionState({ loading: false, user: null });
          navigateTo(USER_ROLES.customer.authPath, setRoute, true);
          return;
        }

        if (!response.ok) {
          throw new Error(payload.error || "Could not load customer workspace.");
        }

        setMarketplaceState({
          loading: false,
          loaded: true,
          data: payload,
          error: "",
        });
      } catch (error) {
        if (active) {
          setMarketplaceState((current) => ({
            ...current,
            loading: false,
            error: error.message || "Could not load customer workspace.",
          }));
        }
      }
    };

    loadMarketplace();

    return () => {
      active = false;
    };
  }, [marketplaceState.loaded, marketplaceState.loading, route.name, sessionState.user]);

  const handleNavigate = (path, replace = false) => {
    navigateTo(path, setRoute, replace);
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setAuthStatus({ type: "", message: "" });
    setAuthForm(INITIAL_AUTH_FORM);
    navigateTo(USER_ROLES[role].authPath, setRoute);
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    const activeRole = route.role || selectedRole;

    if (!activeRole || !USER_ROLES[activeRole]) {
      setAuthStatus({
        type: "error",
        message: "Select Student Seller or Customer before continuing.",
      });
      return;
    }

    setIsAuthSubmitting(true);
    setAuthStatus({ type: "", message: "" });

    try {
      const endpoint =
        authMode === "login"
          ? USER_ROLES[activeRole].loginEndpoint
          : USER_ROLES[activeRole].signupEndpoint;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Authentication failed.");
      }

      setSessionState({ loading: false, user: payload.user || null });
      setSelectedRole(payload.user?.role || activeRole);
      setAuthForm(INITIAL_AUTH_FORM);
      setAuthStatus({
        type: "success",
        message: payload.message || "Authentication successful.",
      });
      setMarketplaceState({
        loading: false,
        loaded: false,
        data: { products: [], freelancers: [], filters: { productCategories: [], freelancerCategories: [] } },
        error: "",
      });

      handleNavigate(payload.redirectTo || USER_ROLES[activeRole].dashboardPath, true);
    } catch (error) {
      setAuthStatus({
        type: "error",
        message: error.message || "Authentication failed.",
      });
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const nextRole = sessionState.user?.role || selectedRole;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setSessionState({ loading: false, user: null });
      setDashboardState({ loading: false, data: null, error: "" });
      setMarketplaceState({
        loading: false,
        loaded: false,
        data: { products: [], freelancers: [], filters: { productCategories: [], freelancerCategories: [] } },
        error: "",
      });
      setQuantityByProduct({});
      setCartItems({});
      setActionStatus({ type: "success", message: "Logged out successfully." });
      setAuthForm(INITIAL_AUTH_FORM);
      setAuthStatus({ type: "success", message: "Logged out successfully." });

      if (nextRole && USER_ROLES[nextRole]) {
        setSelectedRole(nextRole);
        handleNavigate(USER_ROLES[nextRole].authPath, true);
        return;
      }

      handleNavigate("/", true);
    }
  };

  const handleSwitchCustomerMode = (mode) => {
    setCustomerMode(mode);
    handleNavigate(mode === CUSTOMER_MODES.HIRE ? "/hire" : "/shop");
  };

  const handleCustomerIntentEntry = (mode) => {
    setCustomerMode(mode);
    handleNavigate(mode === CUSTOMER_MODES.HIRE ? "/hire" : "/shop");
  };

  const handleQuantityChange = (productId, quantity) => {
    setQuantityByProduct((current) => ({
      ...current,
      [productId]: String(quantity),
    }));
  };

  const handleAddToCart = async (productId) => {
    const quantity = Number(quantityByProduct[productId] || 1);

    try {
      const response = await fetch("/api/customer/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not validate checkout.");
      }

      setCartItems((current) => ({
        ...current,
        [productId]: { productId, quantity },
      }));
      setActionStatus({
        type: "success",
        message: payload.message || "Checkout validated successfully.",
      });
    } catch (error) {
      setActionStatus({
        type: "error",
        message: error.message || "Could not validate checkout.",
      });
    }
  };

  const handleFreelancerAction = async (freelancerId, intent) => {
    try {
      const response = await fetch("/api/customer/hire", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ freelancerId, intent }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not submit hiring request.");
      }

      setActionStatus({
        type: "success",
        message: payload.message || "Hiring action sent successfully.",
      });
    } catch (error) {
      setActionStatus({
        type: "error",
        message: error.message || "Could not submit hiring request.",
      });
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const marketplace = marketplaceState.data;
  const allProducts = marketplace.products || [];
  const allFreelancers = marketplace.freelancers || [];
  const normalizedShopSearch = deferredShopSearch.trim().toLowerCase();
  const normalizedTalentSearch = deferredTalentSearch.trim().toLowerCase();
  const filteredProducts = sortByPriceOrRating(
    allProducts.filter((product) => {
      const searchMatch =
        !normalizedShopSearch ||
        product.name.toLowerCase().includes(normalizedShopSearch) ||
        product.category.toLowerCase().includes(normalizedShopSearch) ||
        product.tags.some((tag) => tag.toLowerCase().includes(normalizedShopSearch));
      const categoryMatch = shopCategory === "all" || product.category === shopCategory;
      return searchMatch && categoryMatch;
    }),
    shopSort,
  );
  const filteredFreelancers = sortByPriceOrRating(
    allFreelancers.filter((freelancer) => {
      const searchMatch =
        !normalizedTalentSearch ||
        freelancer.name.toLowerCase().includes(normalizedTalentSearch) ||
        freelancer.category.toLowerCase().includes(normalizedTalentSearch) ||
        freelancer.skills.some((skill) => skill.toLowerCase().includes(normalizedTalentSearch));
      const categoryMatch = talentCategory === "all" || freelancer.category === talentCategory;
      const pricingMatch = talentPricingType === "all" || freelancer.pricingType === talentPricingType;
      return searchMatch && categoryMatch && pricingMatch;
    }),
    talentSort,
  );
  const activeProduct = allProducts.find((product) => product.id === route.id) || getProductById(route.id);
  const activeFreelancer =
    allFreelancers.find((freelancer) => freelancer.id === route.id) || getFreelancerById(route.id);

  let currentView = <NotFoundView onNavigate={handleNavigate} />;

  if (route.name === "role-selection") {
    currentView = <RoleSelectionView onSelectRole={handleSelectRole} user={sessionState.user} />;
  } else if (route.name === "auth") {
    currentView = (
      <AuthView
        authForm={authForm}
        authMode={authMode}
        authStatus={authStatus}
        isSessionLoading={sessionState.loading}
        isSubmitting={isAuthSubmitting}
        onAuthChange={handleAuthChange}
        onSelectRole={handleSelectRole}
        onSubmit={handleAuthSubmit}
        role={route.role || selectedRole}
        setAuthMode={setAuthMode}
      />
    );
  } else if (route.name === "seller-dashboard") {
    currentView = (
      <SellerDashboardView
        dashboardState={dashboardState}
        isSessionLoading={sessionState.loading}
        onNavigate={handleNavigate}
        user={sessionState.user}
      />
    );
  } else if (route.name === "customer-dashboard") {
    currentView = (
      <CustomerDashboardView
        customerMode={customerMode}
        onEnterMode={handleCustomerIntentEntry}
        user={sessionState.user}
      />
    );
  } else if (
    route.name === "shop" ||
    route.name === "hire" ||
    route.name === "product-detail" ||
    route.name === "freelancer-detail"
  ) {
    if (marketplaceState.loading && !marketplaceState.loaded) {
      currentView = (
        <section className="content-grid">
          <article className="panel panel-emphasis">
            <p className="eyebrow">Customer data</p>
            <h1>Loading your customer workspace...</h1>
            <p className="section-copy">Fetching protected product and freelancer data.</p>
          </article>
        </section>
      );
    } else if (marketplaceState.error) {
      currentView = (
        <section className="content-grid">
          <article className="panel panel-emphasis">
            <p className="eyebrow">Customer data</p>
            <h1>We could not load the customer workspace.</h1>
            <p className="status-message error">{marketplaceState.error}</p>
          </article>
        </section>
      );
    } else {
      const filters = {
        onBack: () => handleNavigate("/customer/dashboard"),
        productCategories: marketplace.filters?.productCategories || [],
        freelancerCategories: marketplace.filters?.freelancerCategories || [],
        productCount: allProducts.length,
        freelancerCount: allFreelancers.length,
      };

      currentView = (
        <div className="customer-workspace-grid">
          <div className="customer-main-column">
            {route.name === "shop" ? (
              <ShopView
                allProducts={allProducts}
                filters={filters}
                onAddToCart={handleAddToCart}
                onCategoryChange={(event) => setShopCategory(event.target.value)}
                onOpenProduct={(productId) => handleNavigate(`/product/${productId}`)}
                onQuantityChange={handleQuantityChange}
                onSearchChange={(event) => setShopSearch(event.target.value)}
                onSortChange={(event) => setShopSort(event.target.value)}
                products={filteredProducts}
                quantityByProduct={quantityByProduct}
                searchValue={shopSearch}
                selectedCategory={shopCategory}
                selectedSort={shopSort}
                user={sessionState.user}
              />
            ) : null}

            {route.name === "product-detail" ? (
              <ProductDetailView
                onAddToCart={handleAddToCart}
                onBackToShop={() => handleNavigate("/shop")}
                onQuantityChange={handleQuantityChange}
                product={activeProduct}
                quantity={quantityByProduct[route.id] || "1"}
                user={sessionState.user}
              />
            ) : null}

            {route.name === "hire" ? (
              <HireView
                allFreelancers={allFreelancers}
                filters={filters}
                freelancers={filteredFreelancers}
                onCategoryChange={(event) => setTalentCategory(event.target.value)}
                onContact={(freelancerId) => handleFreelancerAction(freelancerId, "contact")}
                onOpenFreelancer={(freelancerId) => handleNavigate(`/freelancer/${freelancerId}`)}
                onPricingTypeChange={(event) => setTalentPricingType(event.target.value)}
                onSearchChange={(event) => setTalentSearch(event.target.value)}
                onSortChange={(event) => setTalentSort(event.target.value)}
                searchValue={talentSearch}
                selectedCategory={talentCategory}
                selectedPricingType={talentPricingType}
                selectedSort={talentSort}
                user={sessionState.user}
              />
            ) : null}

            {route.name === "freelancer-detail" ? (
              <FreelancerDetailView
                freelancer={activeFreelancer}
                onContact={(freelancerId) => handleFreelancerAction(freelancerId, "contact")}
                onHire={(freelancerId) => handleFreelancerAction(freelancerId, "hire")}
                onReturn={() => handleNavigate("/hire")}
                user={sessionState.user}
              />
            ) : null}
          </div>

          <CustomerSidebar actionStatus={actionStatus} cartItems={cartItems} marketplace={marketplace} />
        </div>
      );
    }
  }

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Header
        currentRoute={route}
        customerMode={customerMode}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onSwitchCustomerMode={handleSwitchCustomerMode}
        theme={theme}
        toggleTheme={toggleTheme}
        user={sessionState.user}
      />

      <main id="main-content">
        {currentView}
        <RouteGuide />
      </main>
    </div>
  );
}

export default CustomerAppShell;
