import React, { useEffect, useState } from 'react'
import { useData }              from '../state/DataContext'
import useDebounce               from '../hooks/useDebounce'
import '../css/Items.css'

export default function Items() {
  const { items, total, loading, fetchItems } = useData()

  const [searchInput, setSearchInput] = useState('')
  const q                             = useDebounce(searchInput, 300)

  const [category, setCategory] = useState('')
  const [page, setPage]         = useState(1)
  const [limit, setLimit]       = useState(10)

  useEffect(() => {
    fetchItems({ page, limit, q, category })
  }, [fetchItems, page, limit, q, category])

  const categories = Array.from(new Set(items.map(i => i.category)))
  const lastPage   = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="datatable-container">
      <h2>Items</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name…"
          value={searchInput}
          onChange={e => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />

        <select
          value={category}
          onChange={e => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          className="clear-btn"
          onClick={() => {
            setSearchInput('')
            setCategory('')
            setPage(1)
          }}
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div className="skeleton">Loading…</div>
      ) : (
        <>
          <table className="datatable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>${item.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="count">
            Showing {items.length} of {total} items
          </div>

          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </button>

            <span>Page {page} / {lastPage}</span>

            <button
              onClick={() => setPage(p => Math.min(p + 1, lastPage))}
              disabled={page === lastPage}
            >
              Next
            </button>

            <select
              value={limit}
              onChange={e => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
            >
              {[5, 10, 25, 50].map(n => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  )
}
