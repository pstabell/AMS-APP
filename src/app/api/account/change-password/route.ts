import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { createServerClient } from "@/lib/supabase";
import { validateServerSession } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }

    // SECURITY FIX: Validate session instead of trusting spoofable headers
    const { user, error: authError } = await validateServerSession(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const supabase = createServerClient();

    // Fetch user's password hash server-side only
    const { data: dbUser, error: fetchError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !dbUser) {
      console.error('Failed to fetch user for password change:', fetchError);
      return NextResponse.json({ error: 'Unable to verify credentials' }, { status: 500 });
    }

    const storedHash = dbUser.password_hash;
    if (!storedHash) {
      return NextResponse.json({ error: 'No password set for this account' }, { status: 400 });
    }

    const match = await bcrypt.compare(currentPassword, storedHash);
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash, password_set: true })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json({ error: 'Unable to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
