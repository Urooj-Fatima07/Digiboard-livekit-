/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
      LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    },
  };
  
  module.exports = nextConfig;
  