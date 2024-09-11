'use client';

import React, { useState, useEffect } from 'react';
import { Room } from 'livekit-client';
import Whiteboard from '../components/Whiteboard';

// Define the state for the RoomPage component
interface RoomPageState {
  token: string | null;
  roomName: string;
  room: Room | null;
  error: string | null;
}

// Define the RoomPage functional component
const RoomPage: React.FC = () => {
  const [state, setState] = useState<RoomPageState>({
    token: null,
    roomName: '',
    room: null,
    error: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const roomNameParam = params.get('roomName');

    if (tokenParam && roomNameParam) {
      setState((prevState) => ({
        ...prevState,
        token: tokenParam,
        roomName: roomNameParam,
      }));

      // Connect to the room here, so Whiteboard doesn't need to
      const connectToRoom = async () => {
        try {
          const newRoom = new Room();
          await newRoom.connect('wss://liveconnectsphere-vtny1wpc.livekit.cloud', tokenParam, { autoSubscribe: false });
          setState((prevState) => ({
            ...prevState,
            room: newRoom,
          }));
        } catch (error) {
          console.error('Error connecting to room:', error);
          setState((prevState) => ({
            ...prevState,
            error: 'Error connecting to room',
          }));
        }
      };

      connectToRoom();
    } else {
      setState((prevState) => ({
        ...prevState,
        error: 'Missing token or room name',
      }));
    }
  }, []);

  if (state.room && state.roomName) {
    return <Whiteboard room={state.room} />;
  }

  return (
    <div>
      <h1>Join Room</h1>
      {state.error && <p>{state.error}</p>}
    </div>
  );
};

export default RoomPage;
