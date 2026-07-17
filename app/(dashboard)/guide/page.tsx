import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import GuideTour from '@/components/guide/GuideTour'
import { Film } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function GuidePage() {
  const tr = t(getLocale())
  return (
    <div>
      <PageHeader title={tr('guide_title')} subtitle={tr('guide_sub')} />

      {/* Video walkthrough */}
      <div className="panel animate-fade-up" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 4, background: 'rgba(0,155,180,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Film size={17} color="#009BB4" strokeWidth={1.9} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{tr('guideVideo')}</p>
            <p style={{ fontSize: 11.5, color: '#8A939B', marginTop: 1 }}>{tr('guideVideoSub')}</p>
          </div>
        </div>
        <video
          controls
          preload="metadata"
          style={{ display: 'block', width: '100%', maxHeight: 620, background: '#001A22' }}
          src="/guide.mp4"
        />
        <div style={{ padding: '10px 18px', borderTop: '1px solid #EEF1F3' }}>
          <a href="/guide-full.mp4" target="_blank" rel="noopener" style={{ fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }}>
            {tr('guideVideoFull')} →
          </a>
        </div>
      </div>

      <GuideTour />
    </div>
  )
}
