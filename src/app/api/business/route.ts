import { NextResponse } from "next/server";
import { businessApi } from "@/lib/api/business";

/**
 * Server Route Handler: POST /api/business
 * Executes getBusinesses on the server side.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await businessApi.getBusinesses(body);
    return NextResponse.json(res?.body || res?.data || res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Error fetching business profiles" },
      { status: error?.status || 500 }
    );
  }
}
