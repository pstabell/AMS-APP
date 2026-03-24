import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export const PLANS = {
  solo: {
    priceId: process.env.STRIPE_PRICE_ID!,
    name: 'Agent Commission Tracker — Solo',
    trialDays: 14,
  },
} as const;
