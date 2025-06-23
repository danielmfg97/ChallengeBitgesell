import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef
} from 'react'

export const DataContext = createContext()

export function DataProvider({ children }) {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const abortRef             = useRef(null)

  const fetchItems = useCallback(
    async ({ page = 1, limit = 50, q = '' } = {}) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current  = controller
      setLoading(true)

      try {
        const params = new URLSearchParams({
          page:  String(page),
          limit: String(limit),
          q:     q.trim()
        })
        const res = await fetch(
          `http://localhost:3001/api/items?${params}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { items: fetchedItems, total: fetchedTotal } = await res.json()
        setItems(fetchedItems)
        setTotal(fetchedTotal)
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return (
    <DataContext.Provider value={{ items, total, loading, fetchItems }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
