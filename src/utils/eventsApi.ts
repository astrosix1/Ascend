import { CommunityEvent } from './types';

interface WeatherDay {
  high: number;
  low: number;
}

const weatherCache = new Map<string, WeatherDay>();

// Ticketmaster Discovery API — free tier, 5,000 calls/day
// Get your own free key at: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
const TICKETMASTER_KEY = 'f2bPm4Y6Xpue19oHJMbFmSiZQKQOuVo0';

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

export async function fetchLocalEvents(
  city: string,
): Promise<CommunityEvent[]> {
  try {
    const cityName = city ? city.split(',')[0].trim() : '';
    if (!cityName) {
      console.warn('[Events] No city set');
      return [];
    }

    console.log('[Events] Fetching Ticketmaster events for:', cityName);

    // Build Ticketmaster Discovery API request
    const params = new URLSearchParams({
      apikey: TICKETMASTER_KEY,
      city: cityName,
      size: '20',
      sort: 'date,asc',
      // Include a variety of event types relevant to wellness/lifestyle
      classificationName: 'music,sports,arts,family,miscellaneous',
    });

    const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    console.log('[Events] Calling Ticketmaster API...');

    const response = await fetch(apiUrl);
    console.log('[Events] Response status:', response.status);

    if (!response.ok) {
      const body = await response.text();
      console.error('[Events] Ticketmaster error:', response.status, body.slice(0, 200));
      return [];
    }

    const data = await response.json();
    const rawEvents: any[] = data?._embedded?.events || [];
    console.log(`[Events] Got ${rawEvents.length} events from Ticketmaster`);

    if (rawEvents.length === 0) return [];

    // Transform Ticketmaster format → CommunityEvent
    const communityEvents = await Promise.all(
      rawEvents.slice(0, 20).map(async (event: any): Promise<CommunityEvent | null> => {
        try {
          // Date + time
          const localDate: string = event.dates?.start?.localDate || new Date().toISOString().split('T')[0];
          const localTime: string = event.dates?.start?.localTime?.slice(0, 5) || '00:00';

          // Venue
          const venue = event._embedded?.venues?.[0];
          const venueName: string = venue?.name || cityName;
          const lat: number = parseFloat(venue?.location?.latitude || '0') || 0;
          const lon: number = parseFloat(venue?.location?.longitude || '0') || 0;

          // Category
          const segment: string = event.classifications?.[0]?.segment?.name || 'Event';
          const genre: string = event.classifications?.[0]?.genre?.name || '';
          const category = genre && genre !== 'Undefined' ? genre : segment;

          // Weather (only if we have coords)
          const weather = lat && lon ? await fetchTemperature(lat, lon, localDate) : null;

          return {
            id: event.id || (event.name + localDate),
            title: event.name || 'Untitled Event',
            description: event.info || event.pleaseNote || `${category} event at ${venueName}`,
            date: localDate,
            time: localTime,
            location: {
              name: venueName,
              latitude: lat,
              longitude: lon,
            },
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
