import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333';
    const plan = PLANS.solo;

    // Check if user already exists in Supabase
    const supabase = createServerClient();
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, stripe_customer_id, subscription_status')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    // If already active, don't create another checkout
    if (existingUser?.subscription_status === 'active') {
      return NextResponse.json({ error: 'You already have an active subscription. Please log in.' }, { status: 400 });
    }

    // Find or create Stripe customer
    let customerId = existingUser?.stripe_customer_id;

    if (!customerId) {
      // Search Stripe for existing customer by email
      const existing = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email: normalizedEmail });
        customerId = customer.id;
      }

      // Save stripe_customer_id to Supabase if user exists
      if (existingUser) {
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', existingUser.id);
      }
    }

    // Create Stripe Checkout session with 14-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: plan.trialDays,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Checkout] Error creating session:', message);
    const userMessage = message.includes('No such price') ? 'Checkout is not available yet. Please try again later.' : message;
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
