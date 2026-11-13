import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/common/Button'
import { Field } from '../../../components/common/Field'
import { Icon } from '../../../components/common/Icon'
import type { GlucoseFormValues, GlucoseValues } from '../validation'
import { glucoseSchema } from '../validation'
import { today } from '../../../utils/dates'

const readingTypes = ['Fasting', 'Before Meal', 'After Meal', 'Dinner'] as const

interface ReadingFormProps {
  onCancel: () => void
  onSave: (values: GlucoseValues) => void | Promise<void>
  onSlotSelectionChange: () => void
  isSlotUsed: (date: string, time: string, type: GlucoseValues['type']) => boolean
  slotChecksReady: boolean
  serverError: string | null
}

export function ReadingForm({ onCancel, onSave, onSlotSelectionChange, isSlotUsed, slotChecksReady, serverError }: ReadingFormProps) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting, isValid } } = useForm<GlucoseFormValues, unknown, GlucoseValues>({ resolver: zodResolver(glucoseSchema), mode: 'onTouched', defaultValues: { value: undefined, unit: 'mg/dL', type: 'Fasting', date: today(), time: new Date().toTimeString().slice(0, 5) } })
  const [value, unit, date, time, type] = useWatch({ control, name: ['value', 'unit', 'date', 'time', 'type'] })
  const mgValue = Number(value) * (unit === 'mmol/L' ? 18.0182 : 1)
  const unusual = Number.isFinite(mgValue) && mgValue > 0 && (mgValue < 50 || mgValue > 250)
  const slotAlreadyUsed = Boolean(slotChecksReady && date && time && type && isSlotUsed(date, time, type))
  const slotError = slotAlreadyUsed ? 'A reading for this slot already exists today.' : undefined

  return <form className="entry-form panel" noValidate onSubmit={handleSubmit(onSave)}>
    {serverError && <div className="field-error limit-error" role="alert">{serverError}</div>}
    <div className="form-grid"><Field id="glucose-value" label="Glucose value" error={errors.value?.message} hint="Enter the value shown on your meter."><div className="value-input"><input id="glucose-value" type="number" inputMode="decimal" step="any" min="0" placeholder="e.g. 98" aria-invalid={!!errors.value} aria-describedby={errors.value ? 'glucose-value-error' : undefined} {...register('value')}/><select aria-label="Glucose unit" {...register('unit')}><option>mg/dL</option><option>mmol/L</option></select></div></Field>
      <Field id="reading-type" label="Reading type" error={errors.type?.message ?? slotError}><select id="reading-type" aria-invalid={!!errors.type || slotAlreadyUsed} aria-describedby={errors.type || slotError ? 'reading-type-error' : undefined} {...register('type', { onChange: onSlotSelectionChange })}><option value="">Select a reading type</option>{readingTypes.map((readingType) => {
        const used = Boolean(slotChecksReady && date && time && isSlotUsed(date, time, readingType))
        return <option key={readingType} value={readingType} disabled={used}>{readingType}{used ? ' (already recorded today)' : ''}</option>
      })}</select></Field>
      <Field id="reading-date" label="Date" error={errors.date?.message}><input id="reading-date" type="date" max={today()} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'reading-date-error' : undefined} {...register('date', { onChange: onSlotSelectionChange })}/></Field>
      <Field id="reading-time" label="Time" error={errors.time?.message}><input id="reading-time" type="time" aria-invalid={!!errors.time} aria-describedby={errors.time ? 'reading-time-error' : undefined} {...register('time', { onChange: onSlotSelectionChange })}/></Field></div>
    {unusual && <div className="reading-notice"><span>ⓘ</span><p>This reading is outside a common range. Make sure it matches your meter. Unusual readings are still saved.</p></div>}
    <div className="form-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={!isValid || isSubmitting || slotAlreadyUsed}>{isSubmitting ? <><span className="spinner"/>Saving…</> : <><Icon name="check" size={17}/>Save reading</>}</Button></div><p className="form-footnote">Your reading is saved securely to your account.</p>
  </form>
}
