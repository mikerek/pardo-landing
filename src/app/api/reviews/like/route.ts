import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { reviewId } = await request.json();

        if (!reviewId) {
            return NextResponse.json({ success: false, error: 'reviewId required' }, { status: 400 });
        }

        const updatedLike = await prisma.reviewLike.upsert({
            where: { googleReviewId: reviewId },
            update: {
                likesCount: { increment: 1 }
            },
            create: {
                googleReviewId: reviewId,
                likesCount: 1
            }
        });

        return NextResponse.json({ success: true, likesCount: updatedLike.likesCount });
    } catch (error) {
        console.error('Error liking review:', error);
        return NextResponse.json({ success: false, error: 'Failed to like review' }, { status: 500 });
    }
}
