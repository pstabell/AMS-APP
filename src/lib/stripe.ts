import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export type PlanKey = 'starter' | 'pro' | 'autopilot' | 'agency_self' | 'agency_ai';

export interface Plan {
  priceId: string;
  name: string;
  trialDays: number;
  monthlyPrice: number;
  floor: 'floor1' | 'both';
  aiEnabled: boolean;
  aiActionsPerDay: number;
  emailForwarding: boolean;
  multiUser: boolean;
  description: string;
}

export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_ID!,
    name: 'Agent Starter',
    trialDays: 14,
    monthlyPrice: 19.99,
    floor: 'floor1',
    aiEnabled: false,
    aiActionsPerDay: 0,
    emailForwarding: false,
    multiUser: false,
    description: 'Self-service commission tracking for solo agents',
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || '',
    name: 'Agent Pro',
    trialDays: 14,
    monthlyPrice: 49.99,
    floor: 'floor1',
    aiEnabled: true,
    aiActionsPerDay: 20,
    emailForwarding: false,
    multiUser: false,
    description: 'AI-assisted reconciliation, disputes, and coaching',
  },
  autopilot: {
    priceId: process.env.STRIPE_PRICE_AUTOPILOT || '',
    name: 'Agent Autopilot',
    trialDays: 14,
    monthlyPrice: 79.99,
    floor: 'floor1',
    aiEnabled: true,
    aiActionsPerDay: 20,
    emailForwarding: true,
    multiUser: false,
    description: 'Hands-free — forward statements, wake up to results',
  },
  agency_self: {
    priceId: process.env.STRIPE_PRICE_AGENCY_SELF || '',
    name: 'Agency Self-Service',
    trialDays: 14,
    monthlyPrice: 99.99,
    floor: 'both',
    aiEnabled: false,
    aiActionsPerDay: 0,
    emailForwarding: false,
    multiUser: true,
    description: 'Multi-agent management and agency-wide reconciliation',
  },
  agency_ai: {
    priceId: process.env.STRIPE_PRICE_AGENCY_AI || '',
    name: 'Agency AI',
    trialDays: 14,
    monthlyPrice: 199,
    floor: 'both',
    aiEnabled: true,
    aiActionsPerDay: 20,
    emailForwarding: true,
    multiUser: true,
    description: 'Full AI agent managing your entire commission back office',
  },
};

export const ADDON_PRICES = {
  seat: process.env.STRIPE_PRICE_SEAT || '',
  actionBucket: process.env.STRIPE_PRICE_BUCKET || '',
};

export function getPlanByPriceId(priceId: string): { key: PlanKey; plan: Plan } | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return { key: key as PlanKey, plan };
  }
  return null;
}
