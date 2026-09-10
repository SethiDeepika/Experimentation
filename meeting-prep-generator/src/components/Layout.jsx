import { Link, NavLink, Outlet } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm font-semibold transition ${
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-ink-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              🗒️
            </span>
            <span className="text-sm font-bold tracking-tight text-ink-900 sm:text-base">
              Meeting Prep Generator
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/about">About</NavItem>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-200/70 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-ink-400 sm:px-6">
          A portfolio project by Deepika Sethi. Meeting Prep Generator is a
          static, client-only tool — nothing you type is stored or sent
          anywhere.
        </div>
      </footer>
    </div>
  );
}
