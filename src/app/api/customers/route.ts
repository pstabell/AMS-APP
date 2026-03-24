import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/customers";

const demoEmail = "demo@agentcommissiontracker.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);

    // TODO: Get user email from auth context
    // For now using demo email or from header
    const userEmail = request.headers.get("x-user-email") || demoEmail;

    const result = await getCustomers({
      userEmail,
      search,
      page,
      pageSize,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    console.error("Customer API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message, details: String(error) }, { status: 500 });
  }
}
