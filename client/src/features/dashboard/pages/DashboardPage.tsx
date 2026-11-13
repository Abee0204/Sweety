import { useAppContext } from '../../../context/useAppContext'
import type { Reading } from '../../../types'
import { shortDate, today } from '../../../utils/dates'
import { toMg } from '../../../utils/glucose'
import { Button } from '../../../components/common/Button'
import { EmptyState } from '../../../components/common/EmptyState'
import { Icon } from '../../../components/common/Icon'
import { TrendChart } from '../../reports/components/TrendChart'

export function DashboardPage() {
  const { readings, setPage, showToast } = useAppContext()
  const todayReadings = readings.filter((reading) => reading.date === today()).sort((a, b) => b.time.localeCompare(a.time))
  const average = todayReadings.length ? Math.round(todayReadings.reduce((sum, reading) => sum + toMg(reading), 0) / todayReadings.length) : null
  const addReading = () => todayReadings.length >= 4 ? showToast('Daily limit reached — you can record up to 4 readings per day.') : setPage('add')
  const latest = todayReadings[0]
  const sorted = [...readings].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))

  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR HEALTH AT A GLANCE</div><h1>Good morning, <span>friend.</span></h1><p>Here’s how your glucose is looking today.</p></div><Button className="add-button" onClick={addReading}><Icon name="plus" size={18}/>Add reading</Button></div>
    <section className="summary-grid" aria-label="Today's summary">
      <article className="summary-card count-card"><div className="card-top"><span className="card-label">TODAY’S READINGS</span><span className="metric-icon mint"><Icon name="drop" size={18}/></span></div><div className="metric-value">{todayReadings.length}<span className="metric-denom"> / 4</span></div><div className="metric-foot">{todayReadings.length === 4 ? 'Daily limit reached' : `${4 - todayReadings.length} ${4 - todayReadings.length === 1 ? 'reading' : 'readings'} remaining`}</div><div className="progress-track"><span style={{ width: `${todayReadings.length * 25}%` }}/></div></article>
      <article className="summary-card"><div className="card-top"><span className="card-label">AVERAGE GLUCOSE</span><span className="metric-icon lavender"><Icon name="chart" size={18}/></span></div><div className="metric-value">{average ?? '—'}<span className="unit-label"> mg/dL</span></div><div className="metric-foot">{average === null ? 'Add your first reading' : 'Across today’s readings'}</div></article>
      <article className="summary-card"><div className="card-top"><span className="card-label">LATEST READING</span><span className="metric-icon peach"><Icon name="clock" size={18}/></span></div><div className="metric-value">{latest?.value ?? '—'}<span className="unit-label"> {latest?.unit ?? ''}</span></div><div className="metric-foot">{latest ? `${latest.type} · ${latest.time}` : 'No readings yet today'}</div></article>
    </section>
    <section className="dashboard-grid"><article className="panel trend-panel"><div className="panel-heading"><div><h2>Daily glucose trend</h2><p>Your readings throughout the day</p></div><button className="text-button" onClick={() => setPage('daily-report')}>View report <Icon name="chevron" size={15}/></button></div>{todayReadings.length ? <><div className="chart-legend"><span><i/>Glucose <small>mg/dL</small></span><span className="target-key"><i/>Target range</span></div><TrendChart readings={todayReadings}/><div className="chart-axis"><span>6 am</span><span>10 am</span><span>2 pm</span><span>6 pm</span><span>10 pm</span></div></> : <EmptyState className="empty-chart" icon={<Icon name="chart" size={21}/>} title="Your trend will appear here" description="Log your first reading to start tracking." action={<button className="text-button" onClick={addReading}>Add a reading <Icon name="chevron" size={15}/></button>}/>}</article>
      <RecentReadings readings={sorted} onAdd={addReading} onReports={() => setPage('daily-report')}/>
    </section>
    <div className="privacy-note"><span className="privacy-dot"/>Your readings are saved on this device for this session only.</div>
  </>
}

function RecentReadings({ readings, onAdd, onReports }: { readings: Reading[]; onAdd: () => void; onReports: () => void }) {
  return <article className="panel recent-panel"><div className="panel-heading"><div><h2>Recent readings</h2><p>Your latest entries</p></div><button className="round-add" onClick={onAdd} aria-label="Add a reading"><Icon name="plus" size={18}/></button></div>{readings.length ? <div className="reading-list">{readings.slice(0, 5).map((reading) => <div className="reading-row" key={reading.id}><span className="reading-dot"><Icon name="drop" size={16}/></span><span className="reading-info"><strong>{reading.type}</strong><small>{reading.date === today() ? 'Today' : shortDate(reading.date)} · {reading.time}</small></span><span className="reading-value">{reading.value}<small>{reading.unit}</small></span></div>)}</div> : <div className="list-empty">Your readings will show here.</div>}<button className="history-link" onClick={onReports}>See all readings <Icon name="chevron" size={15}/></button></article>
}
