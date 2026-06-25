import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pinInputSchema } from "@/lib/validation";

// GET /api/pins — list all pins, optionally filtered by ?category=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const pins = await prisma.pin.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pins);
  } catch (error) {
    console.error("GET /api/pins failed:", error);
    return NextResponse.json(
      { error: "Failed to load pins" },
      { status: 500 },
    );
  }
}

// POST /api/pins — create a new pin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = pinInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid pin data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const pin = await prisma.pin.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description ?? null,
        notes: data.notes ?? null,
        address: data.address ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        rating: data.rating ?? null,
        tags: data.tags ?? [],
      },
    });

    return NextResponse.json(pin, { status: 201 });
  } catch (error) {
    console.error("POST /api/pins failed:", error);
    return NextResponse.json(
      { error: "Failed to create pin" },
      { status: 500 },
    );
  }
}
