import { NextRequest, NextResponse } from "next/server";
import { getPolicyTerm, decodeCustomerId } from "@/lib/customers";

const demoEmail = "demo@agentcommissiontracker.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const { id, policyId } = await params;
    const customerName = decodeCustomerId(id);
    const policyNumber = decodeURIComponent(policyId);
    
    // TODO: Get user email from auth context
    const userEmail = request.headers.get("x-user-email") || demoEmail;

    const result = await getPolicyTerm(policyNumber, userEmail);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: "Policy term not found" }, { status: 404 });
    }

    // Verify the policy belongs to the customer
    if (result.data.customer !== customerName) {
      return NextResponse.json({ error: "Policy does not belong to this customer" }, { status: 404 });
    }

    return NextResponse.json({
      policyTerm: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
