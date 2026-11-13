export const today = () => new Date().toLocaleDateString('en-CA')

export const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
