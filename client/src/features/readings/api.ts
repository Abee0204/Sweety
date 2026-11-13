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

export function toCreateReadingRequest(reading: GlucoseValues): CreateReadingRequest {
  const recordedAt = new Date(`${reading.date}T${reading.time}:00`)
  if (!Number.isFinite(recordedAt.getTime())) {
    throw new Error('Enter a valid reading date and time.')
  }

  return {
    value: reading.value,
    unit: unitToBackend[reading.unit],
    readingType: typeToBackend[reading.type],
    recordedAt: recordedAt.toISOString(),
  }
}

export function toFrontendReading(reading: BackendReading): Reading {
  const recordedAt = new Date(reading.recordedAt)
  return {
    id: reading.id,
    value: reading.value,
    unit: unitFromBackend[reading.unit],
    type: typeFromBackend[reading.readingType],
    date: `${recordedAt.getFullYear()}-${String(recordedAt.getMonth() + 1).padStart(2, '0')}-${String(recordedAt.getDate()).padStart(2, '0')}`,
    time: `${String(recordedAt.getHours()).padStart(2, '0')}:${String(recordedAt.getMinutes()).padStart(2, '0')}`,
  }
}

export function createReading(token: string, reading: GlucoseValues) {
  return apiRequest<CreateReadingResponse>('/readings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: toCreateReadingRequest(reading),
  })
}
