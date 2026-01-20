import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({
        success: false,
        message: 'Auto-kick service is currently disabled.'
    }, { status: 503 })
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'auto-kick-trigger',
        description: 'POST to this endpoint to run auto-kick for unpaid users (DISABLED)',
        timestamp: new Date().toISOString()
    })
}
