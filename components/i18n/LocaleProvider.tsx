'use client'

import { createContext, useContext } from 'react'
import { t as makeT, type Locale, type TKey } from '@/lib/i18n'

const LocaleContext = createContext<Locale>('en')

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** Client hook: returns a translate function for the current locale. */
export function useT(): (key: TKey) => string {
  return makeT(useContext(LocaleContext))
}
