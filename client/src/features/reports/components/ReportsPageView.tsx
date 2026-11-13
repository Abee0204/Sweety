import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import { useAppContext } from '../../../context/useAppContext'
import type { Reading } from '../../../types'
import { shortDate, utcToday } from '../../../utils/dates'
import { EmptyState } from '../../../components/common/EmptyState'
import { Icon } from '../../../components/common/Icon'
import { toFrontendReading } from '../../readings/api'
import { getDailyReport, getMonthlyReport, type DailyReportData, type MonthlyReportData, type ReportResponse, type ReportStatisticsByUnit } from '../api'
import { MonthlyTrendChart, TrendChart } from './TrendChart'

type ReportResult =
  | { range: 'daily'; data: DailyReportData }
  | { range: 'monthly'; data: MonthlyReportData }

type ReportState =
  | { key: string; status: 'loaded'; report: ReportResult }
  | { key: string; status: 'error'; message: string }

const reportRequests = new Map<string, Promise<ReportResult>>()

const unitOrder = ['MG_DL', 'MMOL_L'] as const

function getReportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data
    if (typeof data === 'object' && data !== null && 'errors' in data) {
      const errors = data.errors
      if (typeof errors === 'object' && errors !== null) {
        const messages = Object.values(errors).flatMap((value) =>
          Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [],
        )
        if (messages.length) return `${error.message}: ${messages.join(' ')}`
      }
    }
    if (error.status === 401) return 'Your session expired. Sign in again to view reports.'
    return error.message
  }
  return 'Could not load this report. Check your connection and try again.'
}

function isValidReportResponse(response: ReportResponse | undefined, range: 'daily' | 'monthly'): response is ReportResponse {
  if (!response?.success || !response.data || typeof response.data !== 'object') return false
  return range === 'daily'
    ? 'readings' in response.data && Array.isArray(response.data.readings)
    : 'days' in response.data && Array.isArray(response.data.days)
}

function getUtcDay(reading: Reading): string | null {
  if (!reading.recordedAt) return null
  const timestamp = Date.parse(reading.recordedAt)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null
}

function formatStatistic(value: number, unit: 'MG_DL' | 'MMOL_L') {
  return unit === 'MG_DL' ? `${Math.round(value)}` : value.toFixed(1)
}

function getStatisticDisplay(byUnit: ReportStatisticsByUnit | undefined, field: 'average' | 'minimum' | 'maximum') {
  if (!byUnit) return { value: '—', unit: '' }
  const available = unitOrder.flatMap((unit) => {
    const statistic = byUnit[unit]
    const value = statistic.totalReadings > 0 ? statistic[field] : null
    return value === null ? [] : [{ unit, value: formatStatistic(value, unit) }]
  })
  return {
    value: available.length ? available.map((item) => item.value).join(' / ') : '—',
    unit: available.length === 2 ? 'mg/dL / mmol/L' : available[0]?.unit === 'MG_DL' ? 'mg/dL' : available[0]?.unit === 'MMOL_L' ? 'mmol/L' : '',
  }
}

export function ReportsPageView({ range }: { range: 'daily' | 'monthly' }) {
  const {
    authToken,
    authStatus,
    readings,
    readingsStatus,
    reportDate,
    setReportDate,
    reportMonth,
    setReportMonth,
  } = useAppContext()
  const selected = range === 'daily' ? reportDate : reportMonth
  const [retryCount, setRetryCount] = useState(0)
  const [reportState, setReportState] = useState<ReportState | null>(null)

  const requestKey = authStatus === 'authenticated' && authToken ? `${authToken}:${range}:${selected}:${retryCount}` : ''

  useEffect(() => {
    if (authStatus !== 'authenticated' || !authToken || !requestKey) return
    const requestToken = authToken
    let active = true
    let request = reportRequests.get(requestKey)

    if (!request) {
      const responsePromise = range === 'daily'
        ? getDailyReport(requestToken, selected).then((response): ReportResult => {
          if (!isValidReportResponse(response, 'daily') || !('readings' in response.data)) {
            throw new Error('The server returned an invalid daily report response.')
          }
          return { range: 'daily', data: response.data }
        })
        : getMonthlyReport(requestToken, selected).then((response): ReportResult => {
          if (!isValidReportResponse(response, 'monthly') || !('days' in response.data)) {
            throw new Error('The server returned an invalid monthly report response.')
          }
          return { range: 'monthly', data: response.data }
        })
      request = responsePromise
      reportRequests.set(requestKey, request)
      void request.finally(() => {
        if (reportRequests.get(requestKey) === request) reportRequests.delete(requestKey)
      }).catch(() => undefined)
    }

    void request.then((report) => {
      if (!active) return
      setReportState({ key: requestKey, status: 'loaded', report })
    }).catch((error: unknown) => {
      if (!active) return
      setReportState({ key: requestKey, status: 'error', message: getReportErrorMessage(error) })
    })

    return () => { active = false }
  }, [authStatus, authToken, range, selected, requestKey, retryCount])

  const requestStatus = authStatus !== 'authenticated' || !authToken
    ? 'idle'
    : reportState?.key === requestKey
      ? reportState.status
      : 'loading'
  const reportError = requestStatus === 'error' && reportState?.status === 'error' ? reportState.message : null
  const dailyReport = reportState?.key === requestKey && reportState.status === 'loaded' && reportState.report.range === 'daily'
    ? reportState.report.data
    : null
  const monthlyReport = reportState?.key === requestKey && reportState.status === 'loaded' && reportState.report.range === 'monthly'
    ? reportState.report.data
    : null
  const dailyReadings = useMemo(
    () => dailyReport?.readings.map(toFrontendReading).sort((left, right) => Date.parse(right.recordedAt ?? '') - Date.parse(left.recordedAt ?? '')) ?? [],
    [dailyReport],
  )
  const monthlyHistory = useMemo(
    () => readings
      .filter((reading) => getUtcDay(reading)?.startsWith(reportMonth))
      .sort((left, right) => Date.parse(right.recordedAt ?? '') - Date.parse(left.recordedAt ?? '')),
    [readings, reportMonth],
  )
  const historyReadings = range === 'daily' ? dailyReadings : monthlyHistory
  const historyStatus = range === 'daily' ? requestStatus : readingsStatus
  const selectedDate = selected
  const reportTitle = range === 'daily'
    ? new Date(`${reportDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : new Date(`${reportMonth}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const summary = range === 'daily' ? dailyReport?.summary : monthlyReport?.summary
  const average = getStatisticDisplay(summary?.byUnit, 'average')
  const maximum = getStatisticDisplay(summary?.byUnit, 'maximum')
  const minimum = getStatisticDisplay(summary?.byUnit, 'minimum')

  return <><div className="page-heading"><div><div className="eyebrow">YOUR PROGRESS</div><h1>Reports</h1><p>Patterns become clearer one reading at a time.</p></div></div>
    <section className="report-toolbar panel"><div className="segmented-control"><NavLink to="/reports/daily" className={({ isActive }) => isActive ? 'segment active' : 'segment'}>Daily report</NavLink><NavLink to="/reports/monthly" className={({ isActive }) => isActive ? 'segment active' : 'segment'}>Monthly report</NavLink></div><label className="report-date"><Icon name="calendar" size={17}/>{range === 'daily' ? <input type="date" value={selectedDate} max={utcToday()} onChange={(event) => setReportDate(event.target.value)}/> : <input type="month" value={selectedDate} max={utcToday().slice(0, 7)} onChange={(event) => setReportMonth(event.target.value)}/>}</label></section>
    {requestStatus === 'loading' && <div className="panel report-request-state" role="status">Loading {range} report…</div>}
    {requestStatus === 'error' && <div className="panel report-request-state" role="alert">{reportError ?? 'Could not load this report.'} <button className="text-button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div>}
    <section className="report-stats"><ReportStat title="AVERAGE GLUCOSE" value={average.value} unit={average.unit} accent="mint"/><ReportStat title="HIGHEST READING" value={maximum.value} unit={maximum.unit} accent="peach"/><ReportStat title="LOWEST READING" value={minimum.value} unit={minimum.unit} accent="lavender"/><ReportStat title="TOTAL READINGS" value={summary ? `${summary.totalReadings}` : '—'} unit={summary ? 'entries' : ''} accent="blue"/></section>
    <section className="panel report-chart-panel"><div className="panel-heading"><div><h2>{range === 'daily' ? 'Daily glucose trend' : 'Monthly glucose trend'}</h2><p>{reportTitle}</p></div><span className="report-units">{range === 'monthly' ? 'Daily averages · mg/dL scale' : 'mg/dL'}</span></div>
      {requestStatus === 'loaded' && range === 'daily' && dailyReport && (dailyReadings.length ? <><TrendChart readings={dailyReadings} report/><div className="chart-axis"><span>6 am</span><span>10 am</span><span>2 pm</span><span>6 pm</span><span>10 pm</span></div></> : <EmptyState className="report-empty" icon={<Icon name="chart" size={21}/>} title="No readings for this day yet" description="Try a different date or add a new reading."/>)}
      {requestStatus === 'loaded' && range === 'monthly' && monthlyReport && (monthlyReport.days.length ? <><div className="chart-legend report-chart-legend">{monthlyReport.days.some((day) => day.byUnit.MG_DL.average !== null) && <span><i/>MG_DL average</span>}{monthlyReport.days.some((day) => day.byUnit.MMOL_L.average !== null) && <span><i style={{ background: '#9182c3' }}/>MMOL_L average · plotted as mg/dL</span>}</div><MonthlyTrendChart days={monthlyReport.days} month={monthlyReport.month} report/><div className="chart-axis"><span>Start</span><span>Week 2</span><span>Week 3</span><span>End</span></div></> : <EmptyState className="report-empty" icon={<Icon name="chart" size={21}/>} title="No readings for this month yet" description="Try a different month or add a new reading."/>)}
    </section>
    <ReadingHistory readings={historyReadings} range={range} status={historyStatus}/>
  </>
}

function ReportStat({ title, value, unit, accent }: { title: string; value: string; unit: string; accent: string }) {
  return <article className="summary-card report-stat"><div className="card-top"><span className="card-label">{title}</span><span className={`metric-icon ${accent}`}><Icon name={title.includes('READING') ? 'drop' : 'chart'} size={17}/></span></div><div className="metric-value">{value}<span className="unit-label"> {unit}</span></div></article>
}

function ReadingHistory({ readings, range, status }: { readings: Reading[]; range: 'daily' | 'monthly'; status: 'idle' | 'loading' | 'loaded' | 'error' }) {
  const loading = status === 'idle' || status === 'loading'
  const failed = status === 'error'
  return <section className="panel history-panel"><div className="panel-heading"><div><h2>Reading history</h2><p>{loading ? 'Loading readings…' : failed ? 'Reading history is unavailable.' : `${readings.length} ${readings.length === 1 ? 'entry' : 'entries'} in this ${range === 'daily' ? 'day' : 'month'}`}</p></div></div>{loading ? <div className="history-empty">Loading readings…</div> : failed ? <div className="history-empty">Retry loading readings to view this history.</div> : readings.length ? <div className="history-table-wrap"><table><thead><tr><th>READING TYPE</th><th>DATE</th><th>TIME</th><th>GLUCOSE</th></tr></thead><tbody>{readings.map((reading) => <tr key={reading.id}><td><span className="table-reading-icon"><Icon name="drop" size={15}/></span>{reading.type}</td><td>{shortDate(reading.date)}</td><td>{reading.time}</td><td><strong>{reading.value}</strong> <span className="table-unit">{reading.unit}</span></td></tr>)}</tbody></table></div> : <div className="history-empty">Nothing to show for this period.</div>}</section>
}
