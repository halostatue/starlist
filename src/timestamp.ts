import type { DateTimeOptions, Timestamp } from './types.js'

export const timestamp = (options: DateTimeOptions, isoTimestamp?: string): Timestamp => {
  const value = isoTimestamp ? new Date(isoTimestamp) : new Date()

  if (options.locale === 'iso') {
    return formatTimestapIso(value, options.timeZone)
  }

  if (!options.date || !options.time) {
    throw new Error('this code should never be reached')
  }

  return {
    date: options.date.format(value),
    time: options.time.format(value),
  }
}

const formatTimestapIso = (input: Date, timeZone: string) =>
  splitIso(
    timeZone === 'UTC'
      ? input
      : new Date(input.getTime() - input.getTimezoneOffset() * 60000),
  )

const splitIso = (input: Date): Timestamp => {
  const [date, timeZ] = input.toISOString().split('T')
  const [time] = timeZ.split(/[Z.]/)

  return { date, time }
}

export default timestamp
