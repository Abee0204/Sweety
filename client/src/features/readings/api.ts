import { apiRequest } from '../../api/client'
import type { Reading, ReadingType, ReadingUnit } from '../../types'
import type { GlucoseValues } from './validation'

export type BackendReadingUnit = 'MG_DL' | 'MMOL_L'
export type BackendReadingType = 'Fasting' | 'BeforeMeal' | 'AfterMeal' | 'Dinner'

export interface CreateReadingRequest {
  value: number
  unit: BackendReadingUnit
  readingType: BackendReadingType
  recordedAt: string
}

export interface BackendReading {
  id: string
  userId: string
  value: number
  unit: BackendReadingUnit
  readingType: BackendReadingType
  recordedAt: string
  createdAt: string
}

export interface CreateReadingResponse {
  success: true
  data: BackendReading
}

export interface GetReadingsResponse {
  success: true
  message: string
  data: BackendReading[]
}

export interface ReadingDateFilters {
  startDate?: string
  endDate?: string
}

const unitToBackend: Record<ReadingUnit, BackendReadingUnit> = {
  'mg/dL': 'MG_DL',
  'mmol/L': 'MMOL_L',
}

const typeToBackend: Record<ReadingType, BackendReadingType> = {
  Fasting: 'Fasting',
  'Before Meal': 'BeforeMeal',
  'After Meal': 'AfterMeal',
  Dinner: 'Dinner',
}

const unitFromBackend: Record<BackendReadingUnit, ReadingUnit> = {
  MG_DL: 'mg/dL',
  MMOL_L: 'mmol/L',
}

const typeFromBackend: Record<BackendReadingType, ReadingType> = {
  Fasting: 'Fasting',
  BeforeMeal: 'Before Meal',
  AfterMeal: 'After Meal',
  Dinner: 'Dinner',
}

function getRecordedAtDate(date: string, time: string): Date {
  const recordedAt = new Date(`${date}T${time}:00`)
  if (!Number.isFinite(recordedAt.getTime())) {
    throw new Error('Enter a valid reading date and time.')
  }
  return recordedAt
}

export function getUtcReadingDate(date: string, time: string): string | null {
  try {
    return getRecordedAtDate(date, time).toISOString().slice(0, 10)
  } catch {
    return null
  }
}

export function toCreateReadingRequest(reading: GlucoseValues): CreateReadingRequest {
  const recordedAt = getRecordedAtDate(reading.date, reading.time)
  return {
    value: reading.value,
    unit: unitToBackend[reading.unit],
    readingType: typeToBackend[reading.type],
    recordedAt: recordedAt.toISOString(),
  }
}

export function toFrontendReading(reading: Omit<BackendReading, 'userId'>): Reading {
  const recordedAt = new Date(reading.recordedAt)
  return {
    id: reading.id,
    value: reading.value,
    unit: unitFromBackend[reading.unit],
    type: typeFromBackend[reading.readingType],
    date: `${recordedAt.getFullYear()}-${String(recordedAt.getMonth() + 1).padStart(2, '0')}-${String(recordedAt.getDate()).padStart(2, '0')}`,
    time: `${String(recordedAt.getHours()).padStart(2, '0')}:${String(recordedAt.getMinutes()).padStart(2, '0')}`,
    recordedAt: reading.recordedAt,
  }
}

export function createReading(token: string, reading: GlucoseValues) {
  return apiRequest<CreateReadingResponse>('/readings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: toCreateReadingRequest(reading),
  })
}

export function getReadings(token: string, filters: ReadingDateFilters = {}) {
  const query = new URLSearchParams()
  if (filters.startDate) query.set('startDate', filters.startDate)
  if (filters.endDate) query.set('endDate', filters.endDate)
  const queryString = query.toString()

  return apiRequest<GetReadingsResponse>(`/readings${queryString ? `?${queryString}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
