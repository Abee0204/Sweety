import type { Reading } from '../../../types'
import type { MonthlyReportDay } from '../api'
import { shortDate } from '../../../utils/dates'
import { toMg } from '../../../utils/glucose'

interface PlotPoint {
  key: string
  x: number
  y: number
  date: string
  time?: string
  title: string
}

const plotY = (mgDl: number) => 78 - Math.min(60, Math.max(4, (mgDl - 60) * 0.33))
const getRecordedTime = (reading: Reading) => reading.recordedAt ? Date.parse(reading.recordedAt) : Date.parse(`${reading.date}T${reading.time}`)

export function TrendChart({ readings, report = false }: { readings: Reading[]; report?: boolean }) {
  const sorted = [...readings].sort((left, right) => getRecordedTime(left) - getRecordedTime(right))
  const points: PlotPoint[] = sorted.map((reading, index) => ({
    key: String(reading.id),
    x: sorted.length < 2 ? 50 : 8 + (index / (sorted.length - 1)) * 84,
    y: plotY(toMg(reading)),
    date: reading.date,
    time: reading.time,
    title: `${reading.value} ${reading.unit} · ${shortDate(reading.date)}`,
  }))

  return <Chart series={[{ unit: null, points }]} report={report}/>
}

export function MonthlyTrendChart({ days, month, report = false }: { days: MonthlyReportDay[]; month: string; report?: boolean }) {
  const sorted = [...days].sort((left, right) => left.date.localeCompare(right.date))
  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const series = (['MG_DL', 'MMOL_L'] as const).map((unit) => ({
    unit,
    points: sorted.flatMap((day): PlotPoint[] => {
      const statistic = day.byUnit[unit]
      if (statistic.average === null) return []
      const dayOfMonth = Number(day.date.slice(8, 10))
      const x = daysInMonth < 2 ? 50 : 8 + ((dayOfMonth - 1) / (daysInMonth - 1)) * 84
      const mgDl = unit === 'MG_DL' ? statistic.average : statistic.average * 18.0182
      return [{
        key: `${day.date}-${unit}`,
        x,
        y: plotY(mgDl),
        date: day.date,
        title: `${statistic.average.toFixed(unit === 'MG_DL' ? 0 : 1)} ${unit} daily average · ${shortDate(day.date)}`,
      }]
    }),
  })).filter((item) => item.points.length > 0)

  const labels = sorted.map((day) => ({ date: day.date, time: undefined }))
  return <Chart series={series} report={report} labels={labels}/>
}

function Chart({ series, report, labels }: { series: { unit: 'MG_DL' | 'MMOL_L' | null; points: PlotPoint[] }[]; report: boolean; labels?: { date: string; time?: string }[] }) {
  const points = series.flatMap((item) => item.points)
  const labelItems = labels ?? points.map(({ date, time }) => ({ date, time }))
  const middleIndex = Math.floor((labelItems.length - 1) / 2)
  const selectedLabels = labelItems.filter((_, index) => index === 0 || index === middleIndex || index === labelItems.length - 1)

  return <div className={`chart-wrap ${report ? 'chart-large' : ''}`}><svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Glucose readings trend chart">
    {[18, 38, 58, 78].map((y) => <line key={y} x1="4" x2="98" y1={y} y2={y} className="chart-grid"/>)}
    {series.map((item) => item.points.length > 1 && <polyline key={`line-${item.unit ?? 'readings'}`} points={item.points.map(({ x, y }) => `${x},${y}`).join(' ')} className="chart-line" style={item.unit === 'MMOL_L' ? { stroke: '#9182c3', strokeDasharray: '3 2' } : undefined}/>)}
    {series.flatMap((item) => item.points.map((point) => <circle key={point.key} cx={point.x} cy={point.y} r="1.8" className="chart-point" style={item.unit === 'MMOL_L' ? { stroke: '#9182c3' } : undefined}><title>{point.title}</title></circle>))}
  </svg><div className="chart-labels">{selectedLabels.map(({ date, time }, index) => <span key={`${date}-${time ?? index}`}>{shortDate(date)}{report && time && <small>{time}</small>}</span>)}</div></div>
}
