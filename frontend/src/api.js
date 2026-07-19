// Single source of truth for the backend base URL (previously duplicated in
// App.js and AuthContext.jsx).
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Required on every POST/PUT/PATCH/DELETE request — the backend rejects
// state-changing requests that don't carry this header. Spread it into the
// `headers` object of any fetch call that isn't a plain GET.
export const CSRF_HEADERS = { 'X-Requested-With': 'XMLHttpRequest' };