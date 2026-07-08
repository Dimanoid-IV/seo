import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: 'Hermes Agent API',
    version: '1.0.0',
    endpoints: {
      '/api/hermes': 'Chat with Hermes (POST)',
      '/api/hermes/health': 'Health check (GET)',
    },
    environment: {
      hasApiKey: !!process.env.HERMES_API_KEY,
      hasApiSecret: !!process.env.HERMES_API_SECRET,
      apiUrl: process.env.HERMES_API_URL || 'not set',
      nodeEnv: process.env.NODE_ENV,
    },
  });
}