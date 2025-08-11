import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/health`)
      if (!res.ok) throw new Error('Failed to fetch health')
      return res.json()
    },
  })

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">System overview</p>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: 16 }}>
          {isLoading && <div className="state">Loading health...</div>}
          {isError && <div className="state error">Backend unavailable</div>}
          {data && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <div className="small muted">Status</div>
                <div className="title">{data.status}</div>
              </div>
              <div>
                <div className="small muted">Database</div>
                <div className="title">{data.db}</div>
              </div>
              <div>
                <div className="small muted">Uptime</div>
                <div className="title">{Math.round(data.uptime)}s</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
