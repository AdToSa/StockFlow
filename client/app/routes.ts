import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Home/Landing page
  index("routes/home.tsx"),

  // Public routes (authentication)
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),

  // Protected app routes with layout
  layout("routes/_app.tsx", [
    route("dashboard", "routes/_app.dashboard.tsx"),
    // Future routes will be added here:
    // route("products", "routes/_app.products.tsx"),
    // route("products/:id", "routes/_app.products.$id.tsx"),
    // route("categories", "routes/_app.categories.tsx"),
    // route("warehouses", "routes/_app.warehouses.tsx"),
    // route("customers", "routes/_app.customers.tsx"),
    // route("invoices", "routes/_app.invoices.tsx"),
    // route("invoices/:id", "routes/_app.invoices.$id.tsx"),
    // route("payments", "routes/_app.payments.tsx"),
    // route("reports", "routes/_app.reports.tsx"),
    // route("settings", "routes/_app.settings.tsx"),
    // route("profile", "routes/_app.profile.tsx"),
  ]),
] satisfies RouteConfig;