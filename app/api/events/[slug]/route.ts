import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Event } from "@/database";

type RouteParam = {
    params: Promise<{ slug: string }>;
};

// GET /api/events/[slug]
export async function GET(req: NextRequest, { params }: RouteParam) {
    try {
        await connectDB();

        const { slug } = await params;

        if (!slug || typeof slug !== "string" || slug.trim() === "") {
            return NextResponse.json(
                { message: "Invalid or missing slug parameter" },
                { status: 400 }
            );
        }

        const sanitizedSlug = slug.trim().toLowerCase();

        const event = await Event.findOne({ slug: sanitizedSlug }).lean();

        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { message: "Event fetched successfully", event },
            { status: 200 }
        );
    } catch (e) {
        if (process.env.NODE_ENV === "development") {
            console.error("Error fetching event by slug:", e);
        }

        if (e instanceof Error) {
            if (e.message.includes("MONGODB_URI")) {
                return NextResponse.json(
                    { message: "Database connection error" },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                {
                    message: "Event fetching failed",
                    error: e.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: "An unexpected error occurred",
            },
            { status: 500 }
        );
    }
}
