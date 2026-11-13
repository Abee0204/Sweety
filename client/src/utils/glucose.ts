import type { Reading } from '../types'

export const toMg = (reading: Reading) =>
  reading.unit === 'mmol/L' ? reading.value * 18.0182 : reading.value
