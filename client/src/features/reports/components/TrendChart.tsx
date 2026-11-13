import type { Reading } from '../../../types'
import { shortDate } from '../../../utils/dates'
import { toMg } from '../../../utils/glucose'

export function TrendChart({ readings, report = false }: { readings: Reading[]; report?: boolean }) {
  const sorted = [...readings].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
  const points = sorted.map((reading, index) => ({ x: sorted.length < 2 ? 50 : 8 + (index / (sorted.length - 1)) * 84, y: 78 - Math.min(60, Math.max(4, (toMg(reading) - 60) * 0.33)), reading }))
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(' ')
  return <div className={`chart-wrap ${report ? 'chart-large' : ''}`}><svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Glucose readings trend chart">
    {[18, 38, 58, 78].map((y) => <line key={y} x1="4" x2="98" y1={y} y2={y} className="chart-grid"/>)}
    {points.length > 1 && <polyline points={polyline} className="chart-line"/>}
    {points.map(({ x, y, reading }) => <circle key={reading.id} cx={x} cy={y} r="1.8" className="chart-point"><title>{`${reading.value} ${reading.unit} · ${shortDate(reading.date)}`}</title></circle>)}
  </svg><div className="chart-labels">{points.filter((_, i) => i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)).map(({ reading }, index) => <span key={`${reading.id}-${index}`}>{shortDate(reading.date)}{report && <small>{reading.time}</small>}</span>)}</div></div>
}
