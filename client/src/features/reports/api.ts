import { apiRequest } from '../../api/client'
import type { BackendReading, BackendReadingUnit } from '../readings/api'

export type ReportReading = Omit<BackendReading, 'userId'>

export interface UnitReportStatistics {
  totalReadings: number
  average: number | null
  minimum: number | null
  maximum: number | null
}

export type ReportStatisticsByUnit = Record<BackendReadingUnit, UnitReportStatistics>

export interface DailyReportData {
  date: string
  readings: ReportReading[]
  summary: {
    totalReadings: number
    byUnit: ReportStatisticsByUnit
  }
}

export interface MonthlyReportDay {
  date: string
  totalReadings: number
  byUnit: ReportStatisticsByUnit
}

export interface MonthlyReportData {
  month: string
  days: MonthlyReportDay[]
  summary: {
    totalReadings: number
    byUnit: ReportStatisticsByUnit
  }
}

export interface DailyReportResponse {
  success: true
  message: string
  data: DailyReportData
}

export interface MonthlyReportResponse {
  success: true
  message: string
  data: MonthlyReportData
}

export type ReportResponse = DailyReportResponse | MonthlyReportResponse

export function getDailyReport(token: string, date: string) {
  return apiRequest<DailyReportResponse>(`/reports/daily?date=${encodeURIComponent(date)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getMonthlyReport(token: string, month: string) {
  return apiRequest<MonthlyReportResponse>(`/reports/monthly?month=${encodeURIComponent(month)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
