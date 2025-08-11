import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const { pathname } = useLocation()
  return (
    <div>
      <header className="app">
        <div className="wrap">
          <strong>Smart Inventory</strong>
          <nav>
            <Link to="/" className={pathname === '/' ? 'active' : ''}>Dashboard</Link>
            <Link to="/products" className={pathname.startsWith('/products') ? 'active' : ''}>Products</Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
