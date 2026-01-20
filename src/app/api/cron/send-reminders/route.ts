import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({
        success: false,
        message: 'Payment reminder service is currently disabled.'
    }, { status: 503 })
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'payment-reminder-trigger',
        description: 'POST to send payment expiry reminders to users (DISABLED)',
        timestamp: new Date().toISOString()
    })
}
