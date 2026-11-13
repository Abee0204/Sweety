import { useMemo } from 'react'
import { useAppContext } from '../../../context/useAppContext'
import type { Reading } from '../../../types'
import { shortDate, today } from '../../../utils/dates'
import { toMg } from '../../../utils/glucose'
import { EmptyState } from '../../../components/common/EmptyState'
import { Icon } from '../../../components/common/Icon'
import { TrendChart } from './TrendChart'

export function ReportsPageView({ range }: { range: 'daily' | 'monthly' }) {
  const { readings, setPage, reportDate, setReportDate, reportMonth, setReportMonth } = useAppContext()
  const reportReadings = useMemo(() => readings.filter((reading) => range === 'daily' ? reading.date === reportDate : reading.date.startsWith(reportMonth)), [readings, reportDate, reportMonth, range])
  const reportMg = reportReadings.map(toMg)
  const avg = reportMg.length ? Math.round(reportMg.reduce((sum, value) => sum + value, 0) / reportMg.length) : null
  const sorted = [...reportReadings].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
  const selectedDate = range === 'daily' ? reportDate : reportMonth
  const reportTitle = range === 'daily'
    ? new Date(`${reportDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : new Date(`${reportMonth}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return <><div className="page-heading"><div><div className="eyebrow">YOUR PROGRESS</div><h1>Reports</h1><p>Patterns become clearer one reading at a time.</p></div></div>
    <section className="report-toolbar panel"><div className="segmented-control"><button className={range === 'daily' ? 'segment active' : 'segment'} onClick={() => setPage('daily-report')}>Daily report</button><button className={range === 'monthly' ? 'segment active' : 'segment'} onClick={() => setPage('monthly-report')}>Monthly report</button></div><label className="report-date"><Icon name="calendar" size={17}/>{range === 'daily' ? <input type="date" value={selectedDate} max={today()} onChange={(event) => setReportDate(event.target.value)}/> : <input type="month" value={selectedDate} max={today().slice(0, 7)} onChange={(event) => setReportMonth(event.target.value)}/>}</label></section>
    <section className="report-stats"><ReportStat title="AVERAGE GLUCOSE" value={avg === null ? '—' : `${avg}`} unit={avg === null ? '' : 'mg/dL'} accent="mint"/><ReportStat title="HIGHEST READING" value={reportMg.length ? `${Math.round(Math.max(...reportMg))}` : '—'} unit={reportMg.length ? 'mg/dL' : ''} accent="peach"/><ReportStat title="LOWEST READING" value={reportMg.length ? `${Math.round(Math.min(...reportMg))}` : '—'} unit={reportMg.length ? 'mg/dL' : ''} accent="lavender"/><ReportStat title="TOTAL READINGS" value={`${reportReadings.length}`} unit="entries" accent="blue"/></section>
    <section className="panel report-chart-panel"><div className="panel-heading"><div><h2>{range === 'daily' ? 'Daily glucose trend' : 'Monthly glucose trend'}</h2><p>{reportTitle}</p></div><span className="report-units">mg/dL</span></div>{reportReadings.length ? <><TrendChart readings={reportReadings} report/><div className="chart-axis"><span>{range === 'daily' ? '6 am' : 'Start'}</span><span>{range === 'daily' ? '10 am' : 'Week 2'}</span><span>{range === 'daily' ? '2 pm' : 'Week 3'}</span><span>{range === 'daily' ? '6 pm' : 'End'}</span></div></> : <EmptyState className="report-empty" icon={<Icon name="chart" size={21}/>} title={`No readings for this ${range === 'daily' ? 'day' : 'month'} yet`} description="Try a different date or add a new reading."/>}</section>
    <ReadingHistory readings={sorted} range={range}/>
  </>
}

function ReportStat({ title, value, unit, accent }: { title: string; value: string; unit: string; accent: string }) {
  return <article className="summary-card report-stat"><div className="card-top"><span className="card-label">{title}</span><span className={`metric-icon ${accent}`}><Icon name={title.includes('READING') ? 'drop' : 'chart'} size={17}/></span></div><div className="metric-value">{value}<span className="unit-label"> {unit}</span></div></article>
}

function ReadingHistory({ readings, range }: { readings: Reading[]; range: 'daily' | 'monthly' }) {
  return <section className="panel history-panel"><div className="panel-heading"><div><h2>Reading history</h2><p>{readings.length} {readings.length === 1 ? 'entry' : 'entries'} in this {range === 'daily' ? 'day' : 'month'}</p></div></div>{readings.length ? <div className="history-table-wrap"><table><thead><tr><th>READING TYPE</th><th>DATE</th><th>TIME</th><th>GLUCOSE</th></tr></thead><tbody>{readings.map((reading) => <tr key={reading.id}><td><span className="table-reading-icon"><Icon name="drop" size={15}/></span>{reading.type}</td><td>{shortDate(reading.date)}</td><td>{reading.time}</td><td><strong>{reading.value}</strong> <span className="table-unit">{reading.unit}</span></td></tr>)}</tbody></table></div> : <div className="history-empty">Nothing to show for this period.</div>}</section>
}
