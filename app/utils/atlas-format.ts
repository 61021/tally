const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** "8,412" */
export function formatPoints(points: number): string {
  return number.format(points)
}

/** "412 km", rounded to tens once it's far enough that single kilometres are noise. */
export function formatKm(km: number): string {
  return `${number.format(km >= 1000 ? Math.round(km / 10) * 10 : Math.round(km))} km`
}
