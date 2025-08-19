// Hook to sync state with URL query parameters
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type UrlState = Record<string, unknown>;

function encode(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return encodeURIComponent(JSON.stringify(value));
  return String(value);
}

function decode(value: string | null): unknown {
  if (!value) return undefined;
  try {
    const decoded = decodeURIComponent(value);
    if ((decoded.startsWith('{') && decoded.endsWith('}')) || (decoded.startsWith('[') && decoded.endsWith(']'))) {
      return JSON.parse(decoded);
    }
    if (decoded === 'true') return true;
    if (decoded === 'false') return false;
    const num = Number(decoded);
    if (!Number.isNaN(num) && decoded.trim() !== '') return num;
    return decoded;
  } catch {
    return value;
  }
}

export function useUrlState<T extends object = Record<string, unknown>>(defaults: T) {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const state = useMemo(() => {
    const entries = { ...defaults } as T;
    (Object.keys(defaults) as (keyof T)[]).forEach((key) => {
      const raw = params.get(String(key));
      const decoded = decode(raw);
      (entries as any)[key] = decoded === undefined || decoded === '' ? (defaults as any)[key] : decoded;
    });
    return entries;
  }, [params, defaults]);

  function setUrlState(patch: Partial<T>, options: { replace?: boolean } = {}) {
    const next = new URLSearchParams(location.search);
    Object.entries(patch as Record<string, unknown>).forEach(([key, val]) => {
      const encoded = encode(val);
      if (!encoded) next.delete(key);
      else next.set(key, encoded);
    });
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: options.replace ?? true });
  }

  // Ensure defaults are present on first mount
  useEffect(() => {
    if (!location.search) {
      const sp = new URLSearchParams();
      Object.entries(defaults as Record<string, unknown>).forEach(([k, v]) => {
        const enc = encode(v);
        if (enc) sp.set(k, enc);
      });
      if ([...sp.keys()].length > 0) {
        navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, setUrlState] as const;
}