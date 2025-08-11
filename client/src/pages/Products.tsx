import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProduct, deleteProduct, getProducts, updateProduct, type Product, type ProductInput } from '../lib/client'

function Modal({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: ReactNode }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}

function ProductForm({ initial, onSubmit, submitting }: { initial?: Partial<Product>, onSubmit: (values: ProductInput) => void, submitting: boolean }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [stock, setStock] = useState(initial?.stock?.toString() ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, sku, price: Number(price), stock: Number(stock), category: category || undefined })
  }

  const disabled = submitting || !name || !sku || !price || !stock

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <label>
        <span>Name</span>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wireless Mouse" required />
      </label>
      <label>
        <span>SKU</span>
        <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. WM-1001" required />
      </label>
      <label>
        <span>Price</span>
        <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required />
      </label>
      <label>
        <span>Stock</span>
        <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" required />
      </label>
      <label>
        <span>Category</span>
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Optional" />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn" disabled={disabled}>{submitting ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  )
}

export default function Products() {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'price' | 'stock'>('name')
  const [asc, setAsc] = useState(true)

  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const createMut = useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string, patch: Partial<ProductInput> }) => updateProduct(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const filtered = useMemo(() => {
    const list = (data ?? []).filter(p => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return [p.name, p.sku, p.category ?? ''].some(v => v.toLowerCase().includes(q))
    })
    const sorted = [...list].sort((a, b) => {
      const dir = asc ? 1 : -1
      if (sort === 'name') return a.name.localeCompare(b.name) * dir
      if (sort === 'price') return (a.price - b.price) * dir
      return (a.stock - b.stock) * dir
    })
    return sorted
  }, [data, search, sort, asc])

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="muted">Manage your inventory items</p>
        </div>
        <div className="header-actions">
          <div className="search">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, category" />
          </div>
          <button className="btn" onClick={() => setOpenCreate(true)}>+ New product</button>
        </div>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="select">
            <label>Sort by</label>
            <select value={sort} onChange={e => setSort(e.target.value as any)}>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => setAsc(v => !v)}>
            {asc ? 'Ascending' : 'Descending'}
          </button>
        </div>

        {isLoading && <div className="state">Loading products...</div>}
        {isError && <div className="state error">Failed to load products</div>}

        {!isLoading && !isError && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="title">{p.name}</div>
                      <div className="muted small">Added {new Date(p.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>{p.sku}</td>
                    <td className="num">${p.price.toFixed(2)}</td>
                    <td className="num">{p.stock}</td>
                    <td>{p.category ?? '-'}</td>
                    <td className="actions">
                      <button className="btn btn-ghost" onClick={() => setEditing(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => setDeleting(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="state">No products match your search.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="New product">
        <ProductForm
          submitting={createMut.isPending}
          onSubmit={async (values) => {
            await createMut.mutateAsync(values)
            setOpenCreate(false)
          }}
        />
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? ''}`}>
        {editing && (
          <ProductForm
            initial={editing}
            submitting={updateMut.isPending}
            onSubmit={async (values) => {
              await updateMut.mutateAsync({ id: editing.id, patch: values })
              setEditing(null)
            }}
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete product">
        {deleting && (
          <div className="confirm">
            <p>Are you sure you want to delete "{deleting.name}"?</p>
            <div className="confirm-actions">
              <button className="btn" onClick={async () => { await deleteMut.mutateAsync(deleting.id); setDeleting(null) }}>Delete</button>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
