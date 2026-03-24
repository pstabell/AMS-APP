import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ status: 'inactive' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up customer in Stripe by email
    const customers = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json({ status: 'inactive' });
    }

    const customer = customers.data[0];

    // Check their subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ status: 'inactive', customerId: customer.id });
    }

    const sub = subscriptions.data[0];
    const status = sub.status === 'trialing' ? 'trialing' : sub.status === 'active' ? 'active' : 'inactive';

    return NextResponse.json({ status, customerId: customer.id });
  } catch (error) {
    console.error('[Check Subscription] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ status: 'inactive' });
  }
}
