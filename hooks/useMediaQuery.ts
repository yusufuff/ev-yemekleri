// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'

/**
 * useMediaQuery — SSR-safe medya sorgusu hook'u.
 *
 * @example
 * const isMobile  = useMediaQuery('(max-width: 767px)')
 * const isTablet  = useMediaQuery('(max-width: 1024px)')
 * const prefersLight = useMediaQuery('(prefers-color-scheme: light)')
 */
export function useMediaQuery(query: string): boolean {
  // SSR: varsayılan false (sunucu tarafında pencere yok)
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Hazır breakpoint sabitleri */
export const BREAKPOINTS = {
  sm:  '(max-width: 639px)',
  md:  '(max-width: 767px)',
  lg:  '(max-width: 1023px)',
  xl:  '(max-width: 1279px)',
} as const

/** Kısa yollar */
export const useIsMobile  = () => useMediaQuery(BREAKPOINTS.md)
export const useIsTablet  = () => useMediaQuery(BREAKPOINTS.lg)
export const useIsDesktop = () => !useMediaQuery(BREAKPOINTS.lg)
