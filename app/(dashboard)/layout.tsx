import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getLocale } from '@/lib/locale'
import Sidebar from '@/components/layout/Sidebar'
import SessionProvider from '@/components/layout/SessionProvider'
import { LocaleProvider } from '@/components/i18n/LocaleProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const locale = getLocale()

  return (
    <SessionProvider session={session}>
      <LocaleProvider locale={locale}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen" style={{ marginLeft: 248 }}>
            <div className="max-w-[1240px] mx-auto px-8 py-8">{children}</div>
          </main>
        </div>
      </LocaleProvider>
    </SessionProvider>
  )
}
