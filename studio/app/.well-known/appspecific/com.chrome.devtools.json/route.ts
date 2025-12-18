import { NextResponse } from 'next/server'

// Chrome DevTools configuration endpoint
// Returns empty config to suppress 404 errors
export async function GET() {
  return NextResponse.json({}, { status: 200 })
}

