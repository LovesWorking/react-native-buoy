import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { TestAdapters } from './TestAdapters'
import { FloatingTools } from '../../packages/devtools-floating-menu/src/web'

const queryClient = new QueryClient()

export const App = () => {
  const [count, setCount] = useState(0)

  return (
    <QueryClientProvider client={queryClient}>
      <FloatingTools enablePositionPersistence>
        <button
          style={{
            padding: '4px 8px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
          onClick={() => alert('Hello from FloatingTools!')}
        >
          Test
        </button>
        <div style={{
          padding: '4px 8px',
          color: '#9f6',
          fontSize: '0.875rem',
          fontWeight: '600',
        }}>
          ENV
        </div>
      </FloatingTools>

      <div style={{
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1a1a1a'
        }}>
          React Buoy Web - Floating Menu Test
        </h1>

        <TestAdapters />

        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Counter Test
          </h2>
          <p style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Count: {count}
          </p>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0056b3'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#007bff'}
          >
            Increment
          </button>
        </div>

        <div style={{
          padding: '1.5rem',
          background: '#d1ecf1',
          borderRadius: '8px',
          border: '1px solid #bee5eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#0c5460' }}>
            Setup Status
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              ✅ React app running
            </li>
            <li style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              ✅ Vite dev server active
            </li>
            <li style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              ✅ Hot reload ready
            </li>
            <li style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              ✅ Workspace packages linked
            </li>
            <li style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              ✅ Adapters working
            </li>
            <li style={{ fontSize: '1rem', color: '#856404' }}>
              ⏳ Building core hooks and FloatingTools
            </li>
          </ul>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7',
          fontSize: '0.875rem',
          color: '#856404'
        }}>
          <strong>In Progress:</strong> Headless refactor underway - adapters created and tested!
        </div>
      </div>
    </QueryClientProvider>
  )
}
