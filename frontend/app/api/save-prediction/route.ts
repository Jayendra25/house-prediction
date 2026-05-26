import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 1. Call the ML FastAPI backend
    const mlResponse = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        living_area: body.living_area,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        built_year: body.built_year,
        postal_code: body.postal_code,
        grade: body.grade,
        condition: body.condition,
        distance_from_airport: body.distance_from_airport,
        schools_nearby: body.schools_nearby,
      }),
    });

    if (!mlResponse.ok) {
      const errorData = await mlResponse.json().catch(() => null);
      return NextResponse.json(
        { detail: errorData?.detail || `ML API Error (${mlResponse.status})` },
        { status: mlResponse.status }
      );
    }

    const mlData = await mlResponse.json();
    const predicted_price = mlData.predicted_price;

    // 2. Save prediction to Prisma Database
    const prediction = await prisma.prediction.create({
      data: {
        living_area: body.living_area,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        built_year: body.built_year,
        postal_code: body.postal_code,
        grade: body.grade,
        condition: body.condition,
        distance_from_airport: body.distance_from_airport,
        schools_nearby: body.schools_nearby,
        predicted_price: predicted_price,
      },
    });

    // 3. Return exact format expected by frontend
    return NextResponse.json({
      predicted_price: predicted_price,
      currency: "INR",
      input_data: body,
      id: prediction.id,
    });
  } catch (error) {
    console.error("Error saving prediction:", error);
    return NextResponse.json(
      { detail: "Failed to process and save prediction" },
      { status: 500 }
    );
  }
}
