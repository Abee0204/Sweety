import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import { useAppContext } from '../../../context/useAppContext'
import { createReading, getUtcReadingDate, toFrontendReading } from '../api'
import type { GlucoseValues } from '../validation'
import { ReadingForm } from '../components/ReadingForm'

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      if (error.message.toLowerCase().includes('slot already exists')) {
        return error.message.endsWith('.') ? error.message : `${error.message}.`
      }
      if (error.message === 'Daily reading limit reached') {
        return 'Daily limit reached — you can record up to 4 readings per UTC day.'
      }
      return error.message
    }
    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.'
    }

    const response = error.data
    if (typeof response === 'object' && response !== null && 'errors' in response) {
      const errors = response.errors
      if (typeof errors === 'object' && errors !== null) {
        const messages = Object.values(errors).flatMap((value) =>
          Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [],
        )
        if (messages.length) return messages.join(' ')
      }
    }
    return error.message
  }

  return error instanceof Error ? error.message : 'Could not save the reading. Please try again.'
}

export function AddReadingPage() {
  const { authToken, readings, readingsStatus, setReadings, showToast } = useAppContext()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const slotChecksReady = readingsStatus === 'loaded'

  const isSlotUsed = (date: string, time: string, type: GlucoseValues['type']) => {
    if (!slotChecksReady) return false
    const utcDate = getUtcReadingDate(date, time)
    if (!utcDate) return false

    return readings.some((reading) => {
      if (reading.type !== type || !reading.recordedAt) return false
      const timestamp = Date.parse(reading.recordedAt)
      return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === utcDate
    })
  }

  const saveReading = async (values: GlucoseValues) => {
    setSubmitError(null)
    if (!authToken) {
      setSubmitError('Your session has expired. Please sign in again.')
      return
    }

    try {
      const response = await createReading(authToken, values)
      if (!response?.success || !response.data) {
        throw new Error('The server returned an invalid reading response.')
      }

      const savedReading = toFrontendReading(response.data)
      setReadings((current) => [savedReading, ...current])
      navigate('/dashboard')
      showToast('Reading saved to your daily log.')
    } catch (error: unknown) {
      setSubmitError(getSubmitErrorMessage(error))
    }
  }

  return <div className="form-page"><button className="back-link" onClick={() => navigate('/dashboard')}>← <span>Back to dashboard</span></button><div className="form-heading"><div className="eyebrow">DAILY LOG</div><h1>Add a reading</h1><p>Keep track of how you’re feeling, one moment at a time.</p></div><ReadingForm onCancel={() => navigate('/dashboard')} onSave={saveReading} onSlotSelectionChange={() => setSubmitError(null)} isSlotUsed={isSlotUsed} slotChecksReady={slotChecksReady} serverError={submitError}/></div>
}
