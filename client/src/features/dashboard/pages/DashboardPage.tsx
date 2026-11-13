import { useAppContext } from '../../../context/useAppContext'
import { useNavigate } from 'react-router-dom'
import type { Reading, ReadingUnit } from '../../../types'
import { shortDate, utcToday } from '../../../utils/dates'
import { Button } from '../../../components/common/Button'
import { EmptyState } from '../../../components/common/EmptyState'
import { Icon } from '../../../components/common/Icon'
import { TrendChart } from '../../reports/components/TrendChart'

const recordedAtTime = (reading: Reading) => reading.recordedAt ? Date.parse(reading.recordedAt) : Number.NaN

function isRecordedOnUtcDay(reading: Reading, day: string) {
  const timestamp = recordedAtTime(reading)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === day
}

function getUnitAverages(readings: Reading[]) {
  const averages: { unit: ReadingUnit; value: number }[] = []
  for (const unit of ['mg/dL', 'mmol/L'] as const) {
    const values = readings.filter((reading) => reading.unit === unit).map((reading) => reading.value)
    if (values.length) {
      averages.push({
        unit,
        value: values.reduce((sum, value) => sum + value, 0) / values.length,
      })
    }
  }
  return averages
}

export function DashboardPage() {
  const { readings } = useAppContext()
  const navigate = useNavigate()
  const utcDay = utcToday()
  const todayReadings = readings
    .filter((reading) => isRecordedOnUtcDay(reading, utcDay))
    .sort((left, right) => recordedAtTime(right) - recordedAtTime(left))
  const averages = getUnitAverages(todayReadings)
  const addReading = () => navigate('/readings/add')
  const latest = todayReadings[0]
  const sorted = [...readings].sort((left, right) => recordedAtTime(right) - recordedAtTime(left))
  const averageValue = averages.length
    ? averages.map(({ unit, value }) => unit === 'mg/dL' ? `${Math.round(value)}` : value.toFixed(1)).join(' / ')
    : '—'
  const averageUnits = averages.length === 2
    ? 'mg/dL / mmol/L'
    : averages[0]?.unit ?? ''

  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR HEALTH AT A GLANCE</div><h1>Good morning, <span>friend.</span></h1><p>Here’s how your glucose is looking today.</p></div><Button className="add-button" onClick={addReading}><Icon name="plus" size={18}/>Add reading</Button></div>
    <section className="summary-grid" aria-label="Today's summary">
      <article className="summary-card count-card"><div className="card-top"><span className="card-label">TODAY’S READINGS</span><span className="metric-icon mint"><Icon name="drop" size={18}/></span></div><div className="metric-value">{todayReadings.length}<span className="metric-denom"> / 4</span></div><div className="metric-foot">{todayReadings.length === 4 ? 'Daily limit reached' : `${4 - todayReadings.length} ${4 - todayReadings.length === 1 ? 'reading' : 'readings'} remaining`}</div><div className="progress-track"><span style={{ width: `${todayReadings.length * 25}%` }}/></div></article>
      <article className="summary-card"><div className="card-top"><span className="card-label">AVERAGE GLUCOSE</span><span className="metric-icon lavender"><Icon name="chart" size={18}/></span></div><div className="metric-value">{averageValue}{averages.length > 0 && <span className="unit-label"> {averageUnits}</span>}</div><div className="metric-foot">{averages.length ? 'Across today’s readings' : 'No readings recorded today'}</div></article>
      <article className="summary-card"><div className="card-top"><span className="card-label">LATEST READING</span><span className="metric-icon peach"><Icon name="clock" size={18}/></span></div><div className="metric-value">{latest?.value ?? '—'}<span className="unit-label"> {latest?.unit ?? ''}</span></div><div className="metric-foot">{latest ? `${latest.type} · ${latest.time}` : 'No readings yet today'}</div></article>
    </section>
    <section className="dashboard-grid"><article className="panel trend-panel"><div className="panel-heading"><div><h2>Daily glucose trend</h2><p>Your readings throughout the day</p></div><button className="text-button" onClick={() => navigate('/reports/daily')}>View report <Icon name="chevron" size={15}/></button></div>{todayReadings.length ? <><div className="chart-legend"><span><i/>Glucose <small>mg/dL</small></span><span className="target-key"><i/>Target range</span></div><TrendChart readings={todayReadings}/><div className="chart-axis"><span>6 am</span><span>10 am</span><span>2 pm</span><span>6 pm</span><span>10 pm</span></div></> : <EmptyState className="empty-chart" icon={<Icon name="chart" size={21}/>} title="Your trend will appear here" description="Log your first reading to start tracking." action={<button className="text-button" onClick={addReading}>Add a reading <Icon name="chevron" size={15}/></button>}/>}</article>
      <RecentReadings readings={sorted} onAdd={addReading} onReports={() => navigate('/reports/daily')}/>
    </section>
    <div className="privacy-note"><span className="privacy-dot"/>Your readings are saved securely to your account.</div>
  </>
}

function RecentReadings({ readings, onAdd, onReports }: { readings: Reading[]; onAdd: () => void; onReports: () => void }) {
  const utcDay = utcToday()
  return <article className="panel recent-panel"><div className="panel-heading"><div><h2>Recent readings</h2><p>Your latest entries</p></div><button className="round-add" onClick={onAdd} aria-label="Add a reading"><Icon name="plus" size={18}/></button></div>{readings.length ? <div className="reading-list">{readings.slice(0, 5).map((reading) => <div className="reading-row" key={reading.id}><span className="reading-dot"><Icon name="drop" size={16}/></span><span className="reading-info"><strong>{reading.type}</strong><small>{isRecordedOnUtcDay(reading, utcDay) ? 'Today' : shortDate(reading.date)} · {reading.time}</small></span><span className="reading-value">{reading.value}<small>{reading.unit}</small></span></div>)}</div> : <div className="list-empty">Your readings will show here.</div>}<button className="history-link" onClick={onReports}>See all readings <Icon name="chevron" size={15}/></button></article>
}
