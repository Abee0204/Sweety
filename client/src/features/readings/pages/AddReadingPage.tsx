import { useAppContext } from '../../../context/useAppContext'
import { today } from '../../../utils/dates'
import type { GlucoseValues } from '../validation'
import { ReadingForm } from '../components/ReadingForm'

export function AddReadingPage() {
  const { readings, setReadings, setPage, showToast } = useAppContext()
  const count = readings.filter((reading) => reading.date === today()).length
  const saveReading = (values: GlucoseValues) => {
    if (readings.filter((reading) => reading.date === values.date).length >= 4) {
      showToast('Daily limit reached — you can record up to 4 readings per day.')
      return
    }
    setReadings((current) => [{ ...values, id: Date.now() }, ...current])
    setPage('dashboard')
    showToast('Reading saved to your daily log.')
  }

  return <div className="form-page"><button className="back-link" onClick={() => setPage('dashboard')}>← <span>Back to dashboard</span></button><div className="form-heading"><div className="eyebrow">DAILY LOG</div><h1>Add a reading</h1><p>Keep track of how you’re feeling, one moment at a time.</p></div><ReadingForm count={count} onCancel={() => setPage('dashboard')} onSave={saveReading}/></div>
}
