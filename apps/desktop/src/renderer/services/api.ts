const API_URL = __API_URL__;

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error('API health check failed');
  }

  return response.json() as Promise<{ status: string; timestamp: string }>;
}

export async function getFeaturedTracks() {
  const response = await fetch(`${API_URL}/tracks/featured`);

  if (!response.ok) {
    throw new Error('Could not load tracks');
  }

  return response.json();
}
