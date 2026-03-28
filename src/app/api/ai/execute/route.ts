import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/server-auth';
import { PLANS, type PlanKey } from '@/lib/stripe';

type ActionType = 'reconciliation' | 'dispute_draft' | 'coaching' | 'data_check' | 'report_generation' | 'alert';

const ACTION_MODELS: Record<ActionType, { model: string; estimatedCostCents: number }> = {
  reconciliation: { model: 'sonnet', estimatedCostCents: 2.5 },
  dispute_draft: { model: 'sonnet', estimatedCostCents: 2.5 },
  report_generation: { model: 'sonnet', estimatedCostCents: 2.0 },
  coaching: { model: 'haiku', estimatedCostCents: 0.5 },
  data_check: { model: 'haiku', estimatedCostCents: 0.5 },
  alert: { model: 'haiku', estimatedCostCents: 0.5 },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action_type, payload } = await request.json();

    if (!action_type || !ACTION_MODELS[action_type as ActionType]) {
      return NextResponse.json({ error: 'Invalid action_type' }, { status: 400 });
    }

    const actionConfig = ACTION_MODELS[action_type as ActionType];
    const supabase = createServerClient();

    // Get user's plan
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, subscription_plan, subscription_status')
      .eq('id', session.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription is active
    if (!['active', 'trialing'].includes(user.subscription_status || '')) {
      return NextResponse.json({ error: 'subscription_inactive', message: 'Your subscription is not active.' }, { status: 403 });
    }

    const planKey = (user.subscription_plan || 'starter') as PlanKey;
    const plan = PLANS[planKey] || PLANS.starter;

    // Check if plan has AI
    if (!plan.aiEnabled) {
      return NextResponse.json({
        error: 'plan_no_ai',
        message: 'Your current plan does not include AI features. Upgrade to Agent Pro or higher.',
        upgradeUrl: '/pricing',
      }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check daily count
    const { data: dailyCount } = await supabase
      .from('ai_action_daily_counts')
      .select('action_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const actionsUsedToday = dailyCount?.action_count || 0;
    let usedBucket = false;

    if (actionsUsedToday >= plan.aiActionsPerDay) {
      // Daily limit reached — check bucket
      const { data: bucket } = await supabase
        .from('ai_action_buckets')
        .select('id, actions_remaining')
        .eq('user_id', user.id)
        .gt('actions_remaining', 0)
        .gte('expires_at', new Date().toISOString())
        .order('purchased_at', { ascending: true })
        .limit(1)
        .single();

      if (!bucket) {
        return NextResponse.json({
          error: 'daily_limit_reached',
          message: 'You have used all 20 AI actions for today.',
          actionsUsedToday,
          dailyLimit: plan.aiActionsPerDay,
          purchaseUrl: '/dashboard/account?purchase_bucket=true',
        }, { status: 429 });
      }

      // Deduct from bucket
      await supabase
        .from('ai_action_buckets')
        .update({ actions_remaining: bucket.actions_remaining - 1 })
        .eq('id', bucket.id);

      usedBucket = true;
    }

    // ──────────────────────────────────────────────
    // ACTION EXECUTION PLACEHOLDER
    // This is where Catalyst (or the AI model) will
    // be called to perform the actual work. For now
    // we return a placeholder result.
    // ──────────────────────────────────────────────
    const result = {
      action_type,
      model: actionConfig.model,
      status: 'completed',
      message: `AI ${action_type} action completed successfully.`,
      payload_received: payload ? Object.keys(payload) : [],
    };

    // Log the action
    await supabase.from('ai_actions').insert({
      user_id: user.id,
      action_type,
      model_used: actionConfig.model,
      tokens_input: 0,
      tokens_output: 0,
      cost_cents: actionConfig.estimatedCostCents,
      source: 'manual',
      metadata: { payload_keys: payload ? Object.keys(payload) : [], used_bucket: usedBucket },
    });

    // Increment daily count
    if (!usedBucket) {
      const { error: upsertError } = await supabase
        .from('ai_action_daily_counts')
        .upsert(
          { user_id: user.id, date: today, action_count: actionsUsedToday + 1 },
          { onConflict: 'user_id,date' }
        );

      if (upsertError) {
        console.error('[AI Execute] Daily count upsert error:', upsertError);
      }
    }

    return NextResponse.json({
      success: true,
      result,
      actionsUsedToday: actionsUsedToday + (usedBucket ? 0 : 1),
      dailyLimit: plan.aiActionsPerDay,
      dailyRemaining: usedBucket ? 0 : Math.max(0, plan.aiActionsPerDay - actionsUsedToday - 1),
      usedBucket,
    });
  } catch (error) {
    console.error('[AI Execute] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
