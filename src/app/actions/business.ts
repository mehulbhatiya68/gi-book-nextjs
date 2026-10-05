"use server";

import { revalidatePath } from "next/cache";
import { businessApi } from "@/lib/api/business";

/**
 * Server Actions for Business Profile operations.
 * Executed 100% on the Next.js Server environment.
 */

// 1. List Business Profiles: POST /business
export async function getBusinessesAction(payload: any = {}) {
  try {
    const res = await businessApi.getBusinesses(payload);
    return { success: true, data: res?.body || res?.data || res };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch businesses." };
  }
}

// 2. Create Business Profile: POST /business/store
export async function storeBusinessProfileAction(data: any) {
  try {
    const res = await businessApi.createBusiness(data);
    revalidatePath("/");
    return { success: true, data: res?.body || res?.data || res };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create business profile." };
  }
}

// 3. Select Business Profile: POST /business/select/{id}
export async function selectBusinessAction(id: string) {
  try {
    const res = await businessApi.selectBusiness(id);
    revalidatePath("/");
    return { success: true, data: res?.body || res?.data || res };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to select business profile." };
  }
}

// 4. Update Business Profile: POST /business/{id}
export async function updateBusinessProfileAction(id: string, data: any) {
  try {
    const res = await businessApi.updateBusiness(id, data);
    revalidatePath("/");
    return { success: true, data: res?.body || res?.data || res };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update business profile." };
  }
}

// 5. Delete Business Profile: DELETE /business/{id}
export async function deleteBusinessProfileAction(id: string, password?: string) {
  try {
    const res = await businessApi.deleteBusiness(id, password);
    revalidatePath("/");
    return { success: true, data: res?.body || res?.data || res };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete business profile." };
  }
}
