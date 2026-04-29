import Stripe from 'stripe';
import type { WorkspacePlanCode } from '@/lib/saas-types';

let stripeClient: Stripe | null | undefined;

const planCodes: WorkspacePlanCode[] = ['starter', 'pro', 'studio'];

const readServerEnv = (key: string) => process.env[key];

export const getStripeClient = () => {
  if (stripeClient !== undefined) {
    return stripeClient;
  }

  const secretKey = readServerEnv('STRIPE_SECRET_KEY');
  if (!secretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
};

export const getStripeWebhookSecret = () => readServerEnv('STRIPE_WEBHOOK_SECRET');

export const getAppBaseUrl = () => readServerEnv('APP_BASE_URL') || 'http://localhost:3000';

export const getStripePriceId = (planCode: WorkspacePlanCode) => {
  const mapping: Record<WorkspacePlanCode, string | undefined> = {
    starter: readServerEnv('STRIPE_PRICE_STARTER'),
    pro: readServerEnv('STRIPE_PRICE_PRO'),
    studio: readServerEnv('STRIPE_PRICE_STUDIO'),
  };

  return mapping[planCode];
};

export const getPlanCodeFromPriceId = (priceId: string | null | undefined): WorkspacePlanCode | null => {
  if (!priceId) {
    return null;
  }

  return planCodes.find((planCode) => getStripePriceId(planCode) === priceId) || null;
};

export const mapStripeStatus = (status: string | null | undefined) => {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    default:
      return 'trialing';
  }
};
