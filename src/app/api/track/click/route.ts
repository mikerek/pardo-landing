import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { target, path, businessId } = await request.json();

        if (!businessId) {
            return NextResponse.json({ success: false, error: 'businessId required' }, { status: 400 });
        }

        await prisma.actionClick.create({
            data: {
                target: target || 'Unknown',
                path: path || '/',
                businessId: Number(businessId)
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ success: false, error: 'Failed to log click' }, { status: 500 });
    }
}
