// Frontend client utilities: types and API functions with localStorage fallback

export type Product = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category?: string
  createdAt: string
  updatedAt?: string
}

export type ProductInput = {
  name: string
  sku: string
  price: number
  stock: number
  category?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

// Local storage helpers
const LS_KEY = 'sim_products_v1'

function readLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function writeLocalProducts(products: Product[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(products))
}

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ensureSeed() {
  const existing = readLocalProducts()
  if (existing.length > 0) return
  const now = new Date().toISOString()
  const seed: Product[] = [
    { id: uuid(), name: 'Wireless Mouse', sku: 'WM-1001', price: 25.99, stock: 120, category: 'Accessories', createdAt: now },
    { id: uuid(), name: 'Mechanical Keyboard', sku: 'MK-2002', price: 79.0, stock: 45, category: 'Accessories', createdAt: now },
    { id: uuid(), name: '27" Monitor', sku: 'MN-2700', price: 239.99, stock: 18, category: 'Displays', createdAt: now },
  ]
  writeLocalProducts(seed)
}

export async function getHealth(): Promise<{ status: string; uptime: number; db: string }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Failed to fetch health')
  return res.json()
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products`)
    if (!res.ok) throw new Error('Non-OK response')
    const data = await res.json()
    // Support either { products: [...] } or direct array
    return Array.isArray(data) ? data : data.products ?? []
  } catch {
    ensureSeed()
    return readLocalProducts()
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const payload = { ...input }
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Create failed')
    const data = await res.json()
    return data.product ?? data
  } catch {
    // Fallback: write to local storage
    const now = new Date().toISOString()
    const product: Product = { id: uuid(), createdAt: now, ...input }
    const list = readLocalProducts()
    list.unshift(product)
    writeLocalProducts(list)
    return product
  }
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Update failed')
    const data = await res.json()
    return data.product ?? data
  } catch {
    // Fallback: update local storage
    const list = readLocalProducts()
    const idx = list.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Product not found')
    const updated: Product = { ...list[idx], ...patch, updatedAt: new Date().toISOString() }
    const next = [...list]
    next[idx] = updated
    writeLocalProducts(next)
    return updated
  }
}

export async function deleteProduct(id: string): Promise<{ id: string }> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Delete failed')
    return { id }
  } catch {
    // Fallback: remove from local storage
    const list = readLocalProducts()
    const next = list.filter(p => p.id !== id)
    writeLocalProducts(next)
    return { id }
  }
}
