import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import GuideTour from '@/components/guide/GuideTour'

export const dynamic = 'force-dynamic'

export default function GuidePage() {
  const tr = t(getLocale())
  return (
    <div>
      <PageHeader title={tr('guide_title')} subtitle={tr('guide_sub')} />
      <GuideTour />
    </div>
  )
}
