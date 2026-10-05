import { NextResponse } from "next/server";
import { businessApi } from "@/lib/api/business";

/**
 * Server Route Handler: POST /api/business/select/[id]
 * Executes selectBusiness on the server side.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await businessApi.selectBusiness(id);
    return NextResponse.json(res?.body || res?.data || res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Error selecting business profile" },
      { status: error?.status || 500 }
    );
  }
}
