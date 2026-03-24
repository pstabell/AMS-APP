import { NextRequest, NextResponse } from "next/server";
import { validateServerSession } from "@/lib/server-auth";
import { 
  getUserSettings, 
  upsertUserSettings,
  DATE_RANGE_OPTIONS,
  PAGE_SIZE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/settings";

export async function GET(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  const { data, error } = await getUserSettings(userId);
  
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ 
    data,
    options: {
      dateRanges: DATE_RANGE_OPTIONS,
      pageSizes: PAGE_SIZE_OPTIONS,
      dateFormats: DATE_FORMAT_OPTIONS,
      timezones: TIMEZONE_OPTIONS,
    }
  });
}

export async function PUT(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  try {
    const body = await request.json();
    const { data, error } = await upsertUserSettings(userId, body);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
