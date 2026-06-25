import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pinUpdateSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT /api/pins/[id] — update a pin
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = pinUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid pin data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const pin = await prisma.pin.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(pin);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }
    console.error("PUT /api/pins/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update pin" },
      { status: 500 },
    );
  }
}

// DELETE /api/pins/[id] — delete a pin
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.pin.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }
    console.error("DELETE /api/pins/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete pin" },
      { status: 500 },
    );
  }
}
