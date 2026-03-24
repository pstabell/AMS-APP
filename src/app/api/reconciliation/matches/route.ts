import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { statementRowId, policyId, userId, matchedAt } = body;

    if (!statementRowId || !policyId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reconciliation_matches')
      .insert([
        {
          statement_row_id: statementRowId,
          policy_id: policyId,
          user_id: userId,
          matched_at: matchedAt || new Date().toISOString(),
        },
      ]);

    if (error) {
      // If duplicate constraint (already exists), return success with existing
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
