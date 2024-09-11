import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req) {
  const url = new URL(req.url);
  const room = url.searchParams.get('roomName');
  const username = url.searchParams.get('participantName');

  if (!room) {
    return NextResponse.json(
      { error: 'Missing "roomName" query parameter' },
      { status: 400 }
    );
  } else if (!username) {
    return NextResponse.json(
      { error: 'Missing "participantName" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity: username });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    return NextResponse.json({ token: await at.toJwt() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
