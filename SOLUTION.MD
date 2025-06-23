# SOLUTION.md

## Overview

Refactored both backend and frontend to address the prompt requirements:

* **Backend**

  * Replaced blocking I/O (`fs.readFileSync`) with asynchronous `fs.promises` APIs.
  * Implemented server-side filtering by `q` (search) and `category` before pagination.
  * Added pagination with `page` and `limit` parameters, returning `{ items, total }`.
  * Introduced a global error handler to capture filesystem and JSON errors, returning proper HTTP status and messages.
  * Wrote Jest unit tests for the items route (pagination, search, category filter, and error cases).

* **Frontend**

  * Transformed the in-memory filtering into true server-side requests via a `DataContext` hook.
  * Debounced the search input (`useDebounce`) to avoid excessive network calls.
  * Exposed filters (search) and pagination (page, size) as state, driving fetch calls on changes.
  * Provided a clean UI: simplified count and pagination controls.
  * Ensured memory safety by aborting in-flight fetches on component unmount or new requests.

## Trade-offs

1. **`mtime`**\*\* vs. File Watcher for Caching\*\*
   We could use a filesystem watcher (e.g., `fs.watch`) to invalidate stats cache in real-time, but opted to compare `mtime` on each request for simplicity and fewer dependencies.

2. **Debounce Delay**
   Chose a 300ms debounce for search to balance responsiveness with reduced load. Faster typing experiences may warrant lower delays; heavy datasets may need longer.

3. **Fixed Size Fetch for Virtualization**
   Virtualization demo fetched up to 1000 items per page. For truly large datasets, an incremental fetch (infinite scroll) or cursor-based pagination would scale better.

4. **Global Error Handler**
   Consolidates error responses in one place, but may obscure context for some route-specific errors. Future enhancements could categorize errors more granularly.

5. **AbortController Usage**
   AbortController cancels stale fetches but may not be supported in older browsers without polyfills. We assume modern environments.

