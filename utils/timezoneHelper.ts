export default class TimeZoneHelper {
  /**
   * Mengonversi Date (atau string tanggal) ke ISO string dengan offset Asia/Jakarta (+07:00).
   * Contoh output: 2025-07-01T09:00:00+07:00
   */
  static toJakartaISOString(dateInput: Date | string): string {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    // Convert to Asia/Jakarta time
    const tz = "Asia/Jakarta";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    };
    const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(date);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || "00";
    // Format: YYYY-MM-DDTHH:mm:ss+07:00
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
      "minute"
    )}:${get("second")}+07:00`;
  }
}
