import { useState } from 'react'
import { ApiError } from '../../../api/client'
import { useAppContext } from '../../../context/useAppContext'
import { createReading, toFrontendReading } from '../api'
import type { GlucoseValues } from '../validation'
import { ReadingForm } from '../components/ReadingForm'

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Daily limit reached — you can record up to 4 readings per UTC day.'
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
  const { authToken, setReadings, setPage, showToast } = useAppContext()
  const [submitError, setSubmitError] = useState<string | null>(null)

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
      setPage('dashboard')
      showToast('Reading saved to your daily log.')
    } catch (error: unknown) {
      setSubmitError(getSubmitErrorMessage(error))
    }
  }

  return <div className="form-page"><button className="back-link" onClick={() => setPage('dashboard')}>← <span>Back to dashboard</span></button><div className="form-heading"><div className="eyebrow">DAILY LOG</div><h1>Add a reading</h1><p>Keep track of how you’re feeling, one moment at a time.</p></div><ReadingForm onCancel={() => setPage('dashboard')} onSave={saveReading} serverError={submitError}/></div>
}
