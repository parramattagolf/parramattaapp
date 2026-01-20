import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({
        success: false,
        message: 'Payment confirmation service is currently disabled.'
    }, { status: 503 })
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'payment-confirm-api',
        timestamp: new Date().toISOString(),
        description: 'Payment confirmation API is currently disabled.'
    })
}
