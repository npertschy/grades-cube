export function coreDataToUnix(seconds: number): Date {
  return new Date((seconds + 978307200) * 1000);
}

export function dateToCoreData(date: Date): number {
  return Math.floor(date.getTime() / 1000 - 978307200);
}
