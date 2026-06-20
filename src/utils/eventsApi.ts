import { CommunityEvent } from './types';

interface WeatherDay {
  high: number;
  low: number;
}

const weatherCache = new Map<string, WeatherDay>();

// SeatGeek Discovery API — free tier, commercial use permitted
// Register at https://seatgeek.com/account/develop to get a client_id
const SEATGEEK_CLIENT_ID = 'YOUR_SEATGEEK_CLIENT_ID';

async function fetchTemperature(lat: number, lon: number, date: string): Promise<WeatherDay | null> {
  if (!lat || !lon) return null;
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${date}`;
  if (weatherCache.has(cacheKey)) return weatherCache.get(cacheKey)!;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit` +
      `&timezone=auto&start_date=${date}&end_date=${date}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const high = Math.round(json.daily?.temperature_2m_max?.[0]);
    const low = Math.round(json.daily?.temperature_2m_min?.[0]);
    if (isNaN(high) || isNaN(low)) return null;
    const result = { high, low };
    weatherCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Geocode a city name to lat/lon using OpenStreetMap Nominatim (free, no key needed).
 */
async function geocodeCity(cityName: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Ascend-HabitApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function fetchLocalEvents(city: string): Promise<CommunityEvent[]> {
  try {
    const cityName = city ? city.split(',')[0].trim() : '';
    if (!cityName) {
      console.warn('[Events] No city set');
      return [];
    }

    console.log('[Events] Fetching SeatGeek events for:', cityName);

    // Geocode in parallel for weather enrichment — events load regardless
    const coordsPromise = geocodeCity(cityName);

    const params = new URLSearchParams({
      client_id: SEATGEEK_CLIENT_ID,
      'venue.city': cityName,
      per_page: '20',
      sort: 'datetime_local.asc',
    });

    const apiUrl = `https://api.seatgeek.com/2/events?${params.toString()}`;
    console.log('[Events] Calling SeatGeek API...');

    const response = await fetch(apiUrl);
    console.log('[Events] Response status:', response.status);

    if (!response.ok) {
      const body = await response.text();
      console.error('[Events] SeatGeek error:', response.status, body.slice(0, 200));
      return [];
    }

    const data = await response.json();
    const rawEvents: any[] = data?.events || [];
    console.log(`[Events] Got ${rawEvents.length} events from SeatGeek`);

    if (rawEvents.length === 0) return [];

    const coords = await coordsPromise;

    const communityEvents = await Promise.all(
      rawEvents.slice(0, 20).map(async (event: any): Promise<CommunityEvent | null> => {
        try {
          const datetimeLocal: string = event.datetime_local || '';
          const localDate: string =
            datetimeLocal.split('T')[0] || new Date().toISOString().split('T')[0];
          const localTime: string = datetimeLocal.split('T')[1]?.slice(0, 5) || '00:00';

          const venue = event.venue || {};
          const venueName: string = venue.name || cityName;
          const lat: number = venue.location?.lat || coords?.lat || 0;
          const lon: number = venue.location?.lon || coords?.lon || 0;

          const rawType: string = event.type || 'event';
          const category: string = rawType.charAt(0).toUpperCase() + rawType.slice(1);

          const performer: string = event.performers?.[0]?.name || '';
          const description: string = performer
            ? `${performer} at ${venueName}`
            : `${category} at ${venueName}`;

          const weather = lat && lon ? await fetchTemperature(lat, lon, localDate) : null;

          return {
            id: String(event.id),
            title: event.title || event.short_title || 'Untitled Event',
            description,
            date: localDate,
            time: localTime,
            location: { name: venueName, latitude: lat, longitude: lon },
            attendees: 0,
            isGoing: false,
            category,
            url: event.url || '',
            weather: weather ?? undefined,
          };
        } catch {
          return null;
        }
      })
    );

    const valid = communityEvents.filter(Boolean) as CommunityEvent[];
    console.log(`[Events] Returning ${valid.length} formatted events`);
    return valid;
  } catch (err) {
    console.error('[Events] Fatal error:', err);
    return [];
  }
}
