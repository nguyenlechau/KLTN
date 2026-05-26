export function isNonWhitespaceText(value, min = 1, max = 225) {
    const trimmed = value.trim();
    return trimmed.length >= min && trimmed.length <= max;
}
export function isEndDateAfterStartDate(startDate, endDate) {
    return new Date(endDate).getTime() > new Date(startDate).getTime();
}
export function isTwoCharCode(value) {
    return value.trim().length === 2;
}
export function isThreeCharCode(value) {
    return value.trim().length === 3;
}
export function isValidPhone10Digits(value) {
    return /^\d{10}$/.test(value);
}
export function isValidLatLng(latitude, longitude) {
    const latValid = latitude === undefined || (latitude >= -90 && latitude <= 90);
    const lngValid = longitude === undefined || (longitude >= -180 && longitude <= 180);
    return latValid && lngValid;
}
export function isValidDimension(value) {
    const rounded = Number(value.toFixed(2));
    return Number.isFinite(value) && rounded <= 99.99 && rounded >= 0;
}
export function isBudgetWithinLimit(value) {
    return value >= 0 && value <= 10_000_000_000;
}
export function validateImageUpload(file) {
    const allowed = ['image/jpeg', 'image/png'];
    return file.size <= 5 * 1024 * 1024 && allowed.includes(file.mimeType);
}
export function validateDocumentUpload(file) {
    const allowed = ['application/pdf', 'message/rfc822'];
    return file.size <= 20 * 1024 * 1024 && allowed.includes(file.mimeType);
}
