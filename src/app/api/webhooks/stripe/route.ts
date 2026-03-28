import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { getPlanByPriceId } from '@/lib/stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

// Webhook secret from Stripe dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // Get raw body as buffer for signature verification
  const buf = await request.arrayBuffer();
  const body = Buffer.from(buf);
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    // Verify webhook signature - critical for security!
    if (!sig) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!endpointSecret) {
      console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Construct and verify the event
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    
    console.log(`[Stripe Webhook] Received event: ${event.type}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed:`, errorMessage);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        // Map Stripe subscription status to our status
        const subStatus = sub.status === 'trialing' ? 'trialing' : sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'inactive';
        await handleSubscriptionEvent(sub, subStatus);
        break;
      }
      
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, 'cancelled');
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return 200 quickly to avoid timeout
    return NextResponse.json({ received: true }, { status: 200 });
  
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Stripe Webhook] Error processing event ${event.type}:`, errorMessage);
    
    // Still return 200 to prevent Stripe retries for application errors
    // Only return non-200 for signature/authentication issues
    return NextResponse.json({ error: 'Processing failed' }, { status: 200 });
  }
}

/**
 * Handle subscription events (created, updated, deleted)
 */
async function handleSubscriptionEvent(subscription: Stripe.Subscription, status: string) {
  try {
    console.log(`[Stripe Webhook] Processing subscription ${subscription.id} for customer ${subscription.customer}`);
    
    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    
    if (!customer.email) {
      console.error(`[Stripe Webhook] Customer ${customer.id} has no email address`);
      return;
    }

    // Update user in Supabase
    const supabase = createServerClient();
    
    // First, try to find user by Stripe customer ID (preferred method)
    let { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customer.id)
      .maybeSingle();

    // If no user found by customer ID, try by email
    if (!user && !error) {
      ({ data: user, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', customer.email)
        .maybeSingle());
    }

    if (error) {
      console.error(`[Stripe Webhook] Database error finding user:`, error);
      return;
    }

    if (!user) {
      console.error(`[Stripe Webhook] No user found for customer ${customer.id} / email ${customer.email}`);
      return;
    }

    // Detect plan tier from subscription price
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const planMatch = priceId ? getPlanByPriceId(priceId) : null;

    // Update subscription status and plan
    const updateData: Record<string, unknown> = {
      subscription_status: status,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    };
    if (planMatch) {
      updateData.subscription_plan = planMatch.key;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error(`[Stripe Webhook] Error updating user ${user.id}:`, updateError);
      return;
    }

    console.log(`[Stripe Webhook] Successfully updated user ${user.id} (${user.email}) subscription status to: ${status}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Stripe Webhook] Error in handleSubscriptionEvent:`, errorMessage);
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`[Stripe Webhook] Processing successful payment for invoice ${invoice.id}`);
    
    if (!invoice.customer) {
      console.error(`[Stripe Webhook] Invoice ${invoice.id} has no customer`);
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    
    if (!customer.email) {
      console.error(`[Stripe Webhook] Customer ${customer.id} has no email address`);
      return;
    }

    // Update user subscription status to active (payment successful)
    const supabase = createServerClient();
    
    // Find user by customer ID or email
    let { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customer.id)
      .maybeSingle();

    if (!user && !error) {
      ({ data: user, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', customer.email)
        .maybeSingle());
    }

    if (error) {
      console.error(`[Stripe Webhook] Database error finding user:`, error);
      return;
    }

    if (!user) {
      console.error(`[Stripe Webhook] No user found for customer ${customer.id} / email ${customer.email}`);
      return;
    }

    // Update to active status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[Stripe Webhook] Error updating user ${user.id} after payment success:`, updateError);
      return;
    }

    console.log(`[Stripe Webhook] Payment succeeded - activated subscription for user ${user.id} (${user.email})`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Stripe Webhook] Error in handlePaymentSucceeded:`, errorMessage);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`[Stripe Webhook] Processing failed payment for invoice ${invoice.id}`);
    
    if (!invoice.customer) {
      console.error(`[Stripe Webhook] Invoice ${invoice.id} has no customer`);
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    
    if (!customer.email) {
      console.error(`[Stripe Webhook] Customer ${customer.id} has no email address`);
      return;
    }

    // Update user subscription status to past_due (payment failed)
    const supabase = createServerClient();
    
    // Find user by customer ID or email
    let { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customer.id)
      .maybeSingle();

    if (!user && !error) {
      ({ data: user, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', customer.email)
        .maybeSingle());
    }

    if (error) {
      console.error(`[Stripe Webhook] Database error finding user:`, error);
      return;
    }

    if (!user) {
      console.error(`[Stripe Webhook] No user found for customer ${customer.id} / email ${customer.email}`);
      return;
    }

    // Update to past_due status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[Stripe Webhook] Error updating user ${user.id} after payment failure:`, updateError);
      return;
    }

    console.log(`[Stripe Webhook] Payment failed - set subscription to past_due for user ${user.id} (${user.email})`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Stripe Webhook] Error in handlePaymentFailed:`, errorMessage);
    throw error;
  }
}