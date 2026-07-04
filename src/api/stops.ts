import bvgClient from './bvgClient';
import { BvgStop } from './types';

export async function searchStops(query: string): Promise<BvgStop[]> {
  try {
    const response = await bvgClient.get('/locations', {
      params: {
        query,
        results: 5,
        stops: true,
        addresses: false,
        poi: false,
      },
    });
    return response.data.filter(
      (item: any) => item.type === 'stop' || item.type === 'station'
    );
  } catch (error) {
    console.error('[searchStops] Failed:', error);
    return [];
  }
}

export async function resolveStop(name: string): Promise<BvgStop | null> {
  const results = await searchStops(name);
  return results.length > 0 ? results[0] : null;
}