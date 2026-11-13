import type { Reading } from '../types'
import { today } from '../utils/dates'

export const createInitialReadings = (): Reading[] => [
  { id: 1, value: 96, unit: 'mg/dL', type: 'Fasting', date: today(), time: '07:18' },
  { id: 2, value: 128, unit: 'mg/dL', type: 'Before Meal', date: today(), time: '12:42' },
  { id: 3, value: 142, unit: 'mg/dL', type: 'After Meal', date: today(), time: '14:05' },
  { id: 4, value: 108, unit: 'mg/dL', type: 'Fasting', date: new Date(Date.now() - 86400000).toLocaleDateString('en-CA'), time: '07:32' },
  { id: 5, value: 134, unit: 'mg/dL', type: 'After Meal', date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('en-CA'), time: '13:10' },
  { id: 6, value: 101, unit: 'mg/dL', type: 'Fasting', date: new Date(Date.now() - 86400000 * 3).toLocaleDateString('en-CA'), time: '07:48' },
]
