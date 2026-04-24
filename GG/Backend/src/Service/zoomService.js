const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

let tokenCache = {
  accessToken: null,
  expiresAtMs: 0,
};

function getZoomConfig() {
  return {
    accountId: process.env.ZOOM_ACCOUNT_ID || '',
    clientId: process.env.ZOOM_CLIENT_ID || '',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
    userId: process.env.ZOOM_USER_ID || 'me',
  };
}

export function hasZoomConfig() {
  const cfg = getZoomConfig();
  return Boolean(cfg.accountId && cfg.clientId && cfg.clientSecret);
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAtMs > now + 30_000) {
    return tokenCache.accessToken;
  }

  const { accountId, clientId, clientSecret } = getZoomConfig();
  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom is not configured on the server.');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const url = `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom token request failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAtMs: now + (Number(data.expires_in || 3600) * 1000),
  };
  return tokenCache.accessToken;
}

export async function createZoomMeeting({
  topic,
  startTimeIso,
  durationMinutes = 60,
  timezone = 'UTC',
}) {
  const { userId } = getZoomConfig();
  const accessToken = await getAccessToken();
  const url = `${ZOOM_API_BASE}/users/${encodeURIComponent(userId)}/meetings`;
  const payload = {
    topic: topic || 'Language exchange',
    type: 2,
    start_time: startTimeIso,
    duration: durationMinutes,
    timezone,
    settings: {
      waiting_room: true,
      join_before_host: false,
      participant_video: true,
      host_video: true,
      mute_upon_entry: true,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom create meeting failed (${res.status}): ${body}`);
  }
  return await res.json();
}
