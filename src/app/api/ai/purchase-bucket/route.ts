import { NextRequest, NextResponse } from 'next/server';
import { stripe, ADDON_PRICES } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADDON_PRICES.actionBucket) {
      return NextResponse.json({ error: 'Action bucket is not available yet.' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user's Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('id, stripe_customer_id, subscription_status')
      .eq('id', session.id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found. Please contact support.' }, { status: 400 });
    }

    if (!['active', 'trialing'].includes(user.subscription_status || '')) {
      return NextResponse.json({ error: 'Your subscription must be active to purchase action buckets.' }, { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333';

    // Create a one-time checkout session for the bucket
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: user.stripe_customer_id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: ADDON_PRICES.actionBucket, quantity: 1 }],
      success_url: `${appUrl}/dashboard/account?bucket_purchased=true`,
      cancel_url: `${appUrl}/dashboard/account`,
      metadata: {
        user_id: user.id,
        type: 'action_bucket',
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[Purchase Bucket] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
