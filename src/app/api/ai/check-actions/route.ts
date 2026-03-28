import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/server-auth';
import { PLANS, type PlanKey } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get user's plan
    const { data: user, error } = await supabase
      .from('users')
      .select('id, subscription_plan, subscription_status')
      .eq('id', session.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const planKey = (user.subscription_plan || 'starter') as PlanKey;
    const plan = PLANS[planKey] || PLANS.starter;

    // If plan has no AI, return zero
    if (!plan.aiEnabled) {
      return NextResponse.json({
        aiEnabled: false,
        actionsUsedToday: 0,
        dailyLimit: 0,
        actionsRemaining: 0,
        bucketRemaining: 0,
        plan: planKey,
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's action count
    const { data: dailyCount } = await supabase
      .from('ai_action_daily_counts')
      .select('action_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const actionsUsedToday = dailyCount?.action_count || 0;

    // Get remaining bucket actions
    const { data: buckets } = await supabase
      .from('ai_action_buckets')
      .select('actions_remaining')
      .eq('user_id', user.id)
      .gt('actions_remaining', 0)
      .gte('expires_at', new Date().toISOString());

    const bucketRemaining = buckets?.reduce((sum, b) => sum + b.actions_remaining, 0) || 0;

    const dailyRemaining = Math.max(0, plan.aiActionsPerDay - actionsUsedToday);

    return NextResponse.json({
      aiEnabled: true,
      actionsUsedToday,
      dailyLimit: plan.aiActionsPerDay,
      actionsRemaining: dailyRemaining + bucketRemaining,
      dailyRemaining,
      bucketRemaining,
      plan: planKey,
    });
  } catch (error) {
    console.error('[AI Check Actions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
