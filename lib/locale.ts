import { cookies } from 'next/headers'
import type { Locale } from './i18n'

/** Read the current locale from the cookie (server components). Defaults to English. */
export function getLocale(): Locale {
  const c = cookies().get('locale')?.value
  return c === 'gr' ? 'gr' : 'en'
}
