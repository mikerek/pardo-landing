import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { path, userAgent, businessId } = await request.json();

        if (!businessId) {
            return NextResponse.json({ success: false, error: 'businessId required' }, { status: 400 });
        }

        await prisma.pageVisit.create({
            data: {
                path: path || '/',
                userAgent: userAgent || 'Unknown',
                businessId: Number(businessId)
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking visit:', error);
        return NextResponse.json({ success: false, error: 'Failed to log visit' }, { status: 500 });
    }
}
