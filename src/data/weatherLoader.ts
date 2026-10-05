/**
 * weatherLoader.ts — parse hourly weather CSV for Dataset mode (Requirement 12.2).
 *
 * Expected columns (header names, order-independent):
 *   timestamp, temperature_c, relative_humidity_pct, solar_irradiance_w_m2, wind_speed_m_s
 *
 * Only temperature / RH / solar are required for the model; wind is optional. Rows with
 * missing required numeric fields are skipped. This is a small, dependency-free parser
 * (no quoted-field escaping) adequate for simple weather exports.
 */

export interface WeatherRow {
  timestamp: string;
  temperature_c: number;
  relative_humidity_pct: number;
  solar_irradiance_w_m2: number;
  wind_speed_m_s?: number;
}

export interface WeatherParseResult {
  rows: WeatherRow[];
  errors: string[];
}

const REQUIRED = ['temperature_c', 'relative_humidity_pct', 'solar_irradiance_w_m2'] as const;

export function parseWeatherCsv(text: string): WeatherParseResult {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have a header row and at least one data row.'] };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  for (const col of REQUIRED) {
    if (idx(col) === -1) errors.push(`Missing required column: ${col}`);
  }
  if (errors.length > 0) return { rows: [], errors };

  const tIdx = idx('timestamp');
  const tempIdx = idx('temperature_c');
  const rhIdx = idx('relative_humidity_pct');
  const solarIdx = idx('solar_irradiance_w_m2');
  const windIdx = idx('wind_speed_m_s');

  const rows: WeatherRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    const temperature_c = Number(cells[tempIdx]);
    const relative_humidity_pct = Number(cells[rhIdx]);
    const solar_irradiance_w_m2 = Number(cells[solarIdx]);

    if (![temperature_c, relative_humidity_pct, solar_irradiance_w_m2].every(Number.isFinite)) {
      errors.push(`Row ${i + 1}: skipped (non-numeric required value).`);
      continue;
    }

    const wind = windIdx !== -1 ? Number(cells[windIdx]) : NaN;
    rows.push({
      timestamp: tIdx !== -1 ? cells[tIdx] : String(i),
      temperature_c,
      relative_humidity_pct,
      solar_irradiance_w_m2: Math.max(0, solar_irradiance_w_m2),
      wind_speed_m_s: Number.isFinite(wind) ? wind : undefined,
    });
  }

  if (rows.length === 0 && errors.length === 0) errors.push('No valid data rows found.');
  return { rows, errors };
}

/**
 * A representative illustrative 24-hour Singapore-like day, used as the built-in dataset so
 * hourly mode works without requiring a file upload. NOT measured data.
 */
export function sampleSingaporeDay(): WeatherRow[] {
  // Hourly outdoor temp (C), RH (%), solar (W/m2) — smooth illustrative diurnal profile.
  const temps = [26, 26, 25, 25, 25, 26, 27, 28, 29, 31, 32, 33, 34, 34, 33, 32, 31, 30, 29, 28, 28, 27, 27, 26];
  const rh = [88, 89, 90, 90, 90, 88, 85, 82, 78, 74, 70, 67, 65, 64, 66, 69, 72, 76, 80, 83, 85, 86, 87, 88];
  const solar = [0, 0, 0, 0, 0, 20, 120, 300, 480, 650, 800, 900, 930, 880, 760, 580, 380, 170, 30, 0, 0, 0, 0, 0];
  return temps.map((t, h) => ({
    timestamp: `${String(h).padStart(2, '0')}:00`,
    temperature_c: t,
    relative_humidity_pct: rh[h],
    solar_irradiance_w_m2: solar[h],
  }));
}
