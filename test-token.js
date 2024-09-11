import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');
    const participantName = searchParams.get('participantName') || 'default';

    if (!roomName) {
      throw new Error('Room name is required');
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LiveKit API Key and Secret are not set');
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: 3600, // Token validity in seconds
    });

    // Assuming room access might be set directly or through different methods
    token.addGrant({ room: { name: roomName, publish: true, subscribe: true } });

    const jwt = token.toJwt();
    return NextResponse.json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error.message); // Log the error message
    return NextResponse.json({ error: 'Failed to generate token', details: error.message }, { status: 500 });
  }
}
