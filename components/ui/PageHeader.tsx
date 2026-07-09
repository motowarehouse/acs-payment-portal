export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between mb-6 animate-fade-up">
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#001A21', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: '#667079', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
