'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// Define the state for the Home component
interface HomeState {
  roomName: string;
  participantName: string;
  error: string | null;
}

const Home: React.FC = () => {
  const [state, setState] = useState<HomeState>({
    roomName: '',
    participantName: '',
    error: null,
  });
  
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`/api/get-token?roomName=${encodeURIComponent(state.roomName)}&participantName=${encodeURIComponent(state.participantName)}`);
      const data = await response.json();

      if (response.ok) {
        router.push(`/room?token=${encodeURIComponent(data.token)}&roomName=${encodeURIComponent(state.roomName)}`);
      } else {
        setState((prevState) => ({
          ...prevState,
          error: data.error || 'Failed to fetch token',
        }));
      }
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: 'Failed to fetch token',
      }));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-200 via-blue-200 to-indigo-200">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 bg-cover bg-center"></div>
      
      <div className="relative z-10 bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Join a Room</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Room Name
              <input
                type="text"
                value={state.roomName}
                onChange={(e) => setState((prevState) => ({
                  ...prevState,
                  roomName: e.target.value,
                }))}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Participant Name
              <input
                type="text"
                value={state.participantName}
                onChange={(e) => setState((prevState) => ({
                  ...prevState,
                  participantName: e.target.value,
                }))}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Join Room
          </button>
          {state.error && <p className="text-red-500 text-center">{state.error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Home;
