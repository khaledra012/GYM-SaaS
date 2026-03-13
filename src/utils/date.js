export const CAIRO_TIME_ZONE = 'Africa/Cairo';

export const formatDateForInputInTimeZone = (date = new Date(), timeZone = CAIRO_TIME_ZONE) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) return '';
    return `${year}-${month}-${day}`;
};

export const getTodayDateInCairo = () => formatDateForInputInTimeZone(new Date(), CAIRO_TIME_ZONE);
