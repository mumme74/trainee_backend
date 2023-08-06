
/**
 * Returns a date that are adjusted to UTC time
 * @param {Date | number} [date=new Date()] The date to adjust from
 * @returns {Date} the date in UTC time
 */
export const getUtcDate = (date: Date | number = new Date()) => {
  if (typeof date === 'number')
    date = new Date(date);
  return new Date(((+date) + (date.getTimezoneOffset() * 1000 * 3600)));
}