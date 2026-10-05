import { NextResponse } from "next/server";
import { businessApi } from "@/lib/api/business";

/**
 * Server Route Handler: POST & DELETE /api/business/[id]
 * Executes updateBusinessProfile & deleteBusinessProfile on the server side.
 */

// POST /api/business/[id] -> Update Business Profile
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const res = await businessApi.updateBusiness(id, body);
    return NextResponse.json(res?.body || res?.data || res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Error updating business profile" },
      { status: error?.status || 500 }
    );
  }
}

// DELETE /api/business/[id] -> Delete Business Profile
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const res = await businessApi.deleteBusiness(id, body?.password);
    return NextResponse.json(res?.body || res?.data || res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Error deleting business profile" },
      { status: error?.status || 500 }
    );
  }
}
