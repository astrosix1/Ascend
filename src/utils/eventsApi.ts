import { CommunityEvent } from './types';

interface WeatherDay {
  high: number;
  low: number;
}

const weatherCache = new Map<string, WeatherDay>();
const SEARCHAPI_KEY = 'RdFmvkN4TXXoQHnjfxwS9QTD';

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

function tempEmoji(high: number): string {
  if (high >= 95) return '🥵';
  if (high >= 85) return '☀️';
  if (high >= 70) return '🌤️';
  if (high >= 55) return '🌥️';
  if (high >= 40) return '🧥';
  return '🥶';
}

export async function fetchLocalEvents(
  city: string,
  latitude?: number,
  longitude?: number
): Promise<CommunityEvent[]> {
  try {
    // Extract city name from setting
    const cityName = city ? city.split(',')[0].trim() : '';

    if (!cityName) {
      console.log('No city set for events search');
      return [];
    }

    console.log('Fetching events from SearchApi.io for:', cityName);

    // Build the search query
    const searchQuery = `events in ${cityName}`;

    // Call SearchApi.io
    const response = await fetch(
      `https://www.searchapi.io/api/v1/search?api_key=${SEARCHAPI_KEY}&engine=google_events&q=${encodeURIComponent(searchQuery)}`
    );

    if (!response.ok) {
      console.error('SearchApi.io error:', response.status);
      return [];
    }

    const data = await response.json();
    const events = data.events || [];

    console.log(`Fetched ${events.length} events for ${cityName}`);

    if (events.length === 0) {
      return [];
    }

    // Transform SearchApi.io response to CommunityEvent format
    const communityEvents = await Promise.all(
      events.slice(0, 20).map(async (event: any): Promise<CommunityEvent> => {
        // Parse date and time (use local timezone)
        const now = new Date();
        let eventDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let eventTime = '00:00';

        // Handle SearchApi.io date format (object with day/month)
        if (event.date && typeof event.date === 'object' && event.date.day && event.date.month) {
          const monthMap: {[key: string]: string} = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const month = monthMap[event.date.month] || '04';
          const day = event.date.day.padStart(2, '0');
          eventDate = `2026-${month}-${day}`;
        } else if (typeof event.date === 'string') {
          eventDate = event.date.split(' - ')[0];
        }

        // Handle SearchApi.io duration format
        if (event.duration && typeof event.duration === 'string') {
          const timeMatch = event.duration.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
          if (timeMatch) {
            eventTime = timeMatch[1].padStart(2, '0') + ':' + timeMatch[2];
          }
        } else if (event.time && typeof event.time === 'string') {
          eventTime = event.time;
        }

        // Try to get coordinates (approximate based on city)
        let lat = 0;
        let lon = 0;
        if (event.address) {
          // Default coordinates for known cities
          const cityLower = cityName.toLowerCase();
          if (cityLower.includes('new york')) {
            lat = 40.7128;
            lon = -74.0060;
          } else if (cityLower.includes('los angeles')) {
            lat = 34.0522;
            lon = -118.2437;
          } else if (cityLower.includes('san francisco')) {
            lat = 37.7749;
            lon = -122.4194;
          } else if (cityLower.includes('chicago')) {
            lat = 41.8781;
            lon = -87.6298;
          } else if (cityLower.includes('jacksonville')) {
            lat = 30.3322;
            lon = -81.6557;
          } else if (cityLower.includes('miami')) {
            lat = 25.7617;
            lon = -80.1918;
          } else if (cityLower.includes('boston')) {
            lat = 42.3601;
            lon = -71.0589;
          } else if (cityLower.includes('seattle')) {
            lat = 47.6062;
            lon = -122.3321;
          } else if (cityLower.includes('denver')) {
            lat = 39.7392;
            lon = -104.9903;
          } else if (cityLower.includes('austin')) {
            lat = 30.2672;
            lon = -97.7431;
          }
        }

        const weather = await fetchTemperature(lat, lon, eventDate);

        return {
          id: event.title + eventDate,
          title: event.title || 'Untitled Event',
          description: event.description?.slice(0, 200) || (event.address ? `Event in ${event.address}` : 'See link for details.'),
          date: eventDate,
          time: eventTime,
          location: {
            name: event.address || `${event.venue || cityName}`,
            latitude: lat,
            longitude: lon,
          },
          attendees: 0,
          isGoing: false,
          category: 'Event',
          url: event.link || '',
          weather: weather ?? undefined,
        };
      })
    );

    return communityEvents;
  } catch (err) {
    console.error('Event fetch error:', err);
    return [];
  }
}
