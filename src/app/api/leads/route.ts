import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// CORS headers for cross-origin requests from chat widget
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Create a new lead from chatbot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      agencySize,
      currentAms,
      primaryInterest,
      painPoints,
      timeline,
      source = "chatbot",
      sourceUrl,
      sourcePage,
      chatTranscript,
      chatSummary,
    } = body;

    // Validate required fields
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert lead
    const { data, error } = await supabase
      .from("leads")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company,
        agency_size: agencySize,
        current_ams: currentAms,
        primary_interest: primaryInterest,
        pain_points: painPoints,
        timeline,
        source,
        source_url: sourceUrl,
        source_page: sourcePage,
        chat_transcript: chatTranscript,
        chat_summary: chatSummary,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json(
        { error: "Failed to save lead", details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`✅ New lead captured: ${email || phone} from ${source}`);

    return NextResponse.json(
      { success: true, lead: data },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Lead API error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET - List leads (for CRM view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { leads: data, count: data?.length || 0 },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
