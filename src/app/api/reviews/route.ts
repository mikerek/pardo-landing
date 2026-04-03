import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "AIzaSyAKIaLmMYOKiVcXEHMWaWbDpZvBZu_oxZk";

        // We need the Place ID. Since text search failed before due to disabled API,
        // we assume the API will be enabled and we can do a textSearch to find Pardo Burger, 
        // or just fetch reviews if we had the ID. For robust fallback:

        const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.reviews",
                "Referer": "https://pardoburger.com"
            },
            body: JSON.stringify({
                textQuery: "Pardo Smash Burger Puerto Vallarta"
            })
        });

        const searchData = await searchRes.json();

        if (searchData.error) {
            // If API is disabled, return a mocked array for development
            console.error("Google API Error:", searchData.error.message);
            return NextResponse.json({
                success: false,
                error: searchData.error.message,
                reviews: [
                    {
                        name: "api/error",
                        authorAttribution: { displayName: "Google API Deshabilitada", photoUri: "" },
                        text: { text: "Por favor, habilita la 'Places API (New)' en Google Cloud Console para ver los comentarios reales." },
                        rating: 5,
                        relativePublishTimeDescription: "Justo ahora"
                    }
                ]
            });
        }

        const place = searchData.places?.[0];
        if (!place || !place.reviews) {
            return NextResponse.json({ success: true, reviews: [] });
        }

        // Mix Reviews with Local Likes from Prisma, and Sort them
        let combinedReviews = await Promise.all(place.reviews.map(async (review: any) => {
            // Find local likes
            const localData = await prisma.reviewLike.findUnique({
                where: { googleReviewId: review.name }
            });
            return {
                ...review,
                localLikes: localData ? localData.likesCount : 0
            };
        }));

        // Sort to prioritize reviews with images, and then by most recent date.
        combinedReviews = combinedReviews.sort((a, b) => {
            const aHasPhoto = a.photos && a.photos.length > 0 ? 1 : 0;
            const bHasPhoto = b.photos && b.photos.length > 0 ? 1 : 0;
            if (aHasPhoto !== bHasPhoto) {
                return bHasPhoto - aHasPhoto; // photos first
            }
            return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
        });

        return NextResponse.json({ success: true, reviews: combinedReviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
