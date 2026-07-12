import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const vehicle = await prisma.vehicle.create({
      data: body,
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}