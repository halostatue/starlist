import type { Config, ISODateTimeConfig, LocaleDateTimeConfig } from './config.js'
import type { Timestamp } from './types.js'

export const timestamp = (
  { format: { dateTime: config } }: Config,
  isoTimestamp?: string,
): Timestamp => {
  const value = isoTimestamp ? new Date(isoTimestamp) : new Date()

  return config.mode === 'iso'
    ? formatTimestampIso(value, config)
    : formatTimestampLocale(value, config)
}

const formatTimestampLocale = (input: Date, config: LocaleDateTimeConfig): Timestamp => {
  return {
    date: config.date.format(input),
    time: config.time.format(input),
  }
}

const formatTimestampIso = (input: Date, config: ISODateTimeConfig) =>
  splitIso(
    config.timeZone === 'UTC'
      ? input
      : new Date(input.getTime() - input.getTimezoneOffset() * 60000),
  )

const splitIso = (input: Date): Timestamp => {
  const [date, timeZ] = input.toISOString().split('T')
  const [time] = timeZ.split(/[Z.]/)

  return { date, time }
}

export default timestamp
