import { z } from 'zod'

export const glucoseSchema = z.object({
  value: z.preprocess((value) => value === '' ? undefined : Number(value), z.number({ error: 'Enter a numeric glucose value' }).finite('Enter a valid number').positive('Value must be greater than zero')),
  unit: z.enum(['mg/dL', 'mmol/L'], { error: 'Choose a unit' }),
  type: z.enum(['Fasting', 'Before Meal', 'After Meal', 'Dinner'], { error: 'Choose a reading type' }),
  date: z.string().min(1, 'Date is required').refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), 'Enter a valid date'),
  time: z.string().min(1, 'Time is required').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time'),
}).superRefine((reading, context) => {
  const amount = reading.unit === 'mmol/L' ? reading.value * 18.0182 : reading.value
  if (amount > 1000) context.addIssue({ code: 'custom', path: ['value'], message: 'Enter a value below 55.5 mmol/L (1,000 mg/dL)' })
  if (reading.date && reading.time && new Date(`${reading.date}T${reading.time}`).getTime() > Date.now()) {
    context.addIssue({ code: 'custom', path: ['date'], message: 'Future readings are not allowed' })
  }
})

export type GlucoseValues = z.infer<typeof glucoseSchema>
export type GlucoseFormValues = z.input<typeof glucoseSchema>
