import { NextRequest, NextResponse } from "next/server";
import { getCustomer, getCustomerPolicyTerms, decodeCustomerId } from "@/lib/customers";

const demoEmail = "demo@agentcommissiontracker.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerName = decodeCustomerId(id);
    
    // TODO: Get user email from auth context
    const userEmail = request.headers.get("x-user-email") || demoEmail;

    // Fetch customer details and policy terms in parallel
    const [customerResult, policyTermsResult] = await Promise.all([
      getCustomer(customerName, userEmail),
      getCustomerPolicyTerms(customerName, userEmail),
    ]);

    if (customerResult.error) {
      return NextResponse.json({ error: customerResult.error }, { status: 500 });
    }

    if (!customerResult.data) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      customer: customerResult.data,
      policyTerms: policyTermsResult.data || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
