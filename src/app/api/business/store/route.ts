import { NextResponse } from "next/server";
import { businessApi } from "@/lib/api/business";

/**
 * Server Route Handler: POST /api/business/store
 * Executes storeBusinessProfile on the server side.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await businessApi.createBusiness(body);
    return NextResponse.json(res?.body || res?.data || res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Error creating business profile" },
      { status: error?.status || 500 }
    );
  }
}
