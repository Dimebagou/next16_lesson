import { Schema, model, models, Document } from "mongoose";

export interface IEvent extends Document {
    title: string;
    slug: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [100, "Title must be less than 100 characters"],
        },
        slug: {
            type: String,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: [1000, "Description must be less than 1000 characters"],
        },
        overview: {
            type: String,
            required: [true, "Overview is required"],
            trim: true,
            maxlength: [500, "Overview must be less than 500 characters"],
        },
        image: {
            type: String,
            required: [true, "Image URL is required"],
            trim: true,
        },
        venue: {
            type: String,
            required: [true, "Venue is required"],
            trim: true,
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
        },
        date: {
            type: String,
            required: [true, "Date is required"],
        },
        time: {
            type: String,
            required: [true, "Time is required"],
        },
        mode: {
            type: String,
            required: [true, "Mode is required"],
            enum: {
                values: ["online", "offline", "hybrid"],
                message: "Mode must be either online, offline, or hybrid",
            },
        },
        audience: {
            type: String,
            required: [true, "Audience is required"],
            trim: true,
        },
        agenda: {
            type: [String],
            required: [true, "Agenda is required"],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: "Agenda must have at least one item",
            },
        },
        organizer: {
            type: String,
            required: [true, "Organizer is required"],
            trim: true,
        },
        tags: {
            type: [String],
            required: [true, "At least one tag is required"],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: "There must be at least one tag",
            },
        },
    },
    { timestamps: true }
);

EventSchema.pre("save", function (next) {
    const event = this as IEvent;

    // Generate slug from title only if title is modified or it's a new document
    if (event.isModified("title") || event.isNew) {
        event.slug = generateSlug(event.title);
    }

    // Normalize date to ISO format if it's not already
    if (event.isModified("date")) {
        event.date = normalizeDate(event.date);
    }

    // Normalize time format (HH:MM)
    if (event.isModified("time")) {
        event.time = normalizeTime(event.time);
    }

    next();
});

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

function normalizeDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
    }
    return date.toISOString().split("T")[0]; // Return only the date part in YYYY-MM-DD format
}

function normalizeTime(timeStr: string): string {
    // Handle various time formats and convert to HH:MM (24-hour)
    const timeRegex = /^(\d{1,2}:\d{2})\s*(AM|PM)?$/i;
    const match = timeStr.trim().match(timeRegex);

    if (!match) {
        throw new Error(
            "Invalid time format, expected HH:MM with optional AM/PM"
        );
    }

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[4]?.toUpperCase();

    if (period) {
        // Convert to 24-hour format
        if (period === "PM" && hours !== 12) {
            hours += 12;
        }
        if (period === "AM" && hours === 12) {
            hours = 0;
        }
    }

    if (
        hours < 0 ||
        hours > 23 ||
        parseInt(minutes) < 0 ||
        parseInt(minutes) > 59
    ) {
        throw new Error("Time must be between 00:00 and 23:59");
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Create unique index on slug for better performance
EventSchema.index({ slug: 1 }, { unique: true });

// Create compound index for common queries
EventSchema.index({ date: 1, mode: 1 });

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
