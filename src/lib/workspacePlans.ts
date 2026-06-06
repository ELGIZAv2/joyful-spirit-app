export type WorkspacePaidPlan = "starter" | "pro" | "elite" | "business";

export interface WorkspacePlanOption {
  id: WorkspacePaidPlan | "free";
  name: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  tagline: string;
  perks: string[];
  creditsLabel?: string;
}

export const WORKSPACE_PRODUCT_MAP: Record<WorkspacePaidPlan, { monthly: string; yearly: string }> = {
  starter: {
    monthly: "pdt_0NfOHJoiT8SDfibwKrYkd",
    yearly: "pdt_0NfOI5bIL4ENBrcV8JEvM",
  },
  pro: {
    monthly: "pdt_0NfOIP9Cjs7MnsYwuOHA5",
    yearly: "pdt_0NfOIbGR12Bk6zmVhIfho",
  },
  elite: {
    monthly: "pdt_0NfOIsOWsAjKTv5MycEUK",
    yearly: "pdt_0NfOJ0bn0DYGJudz1v5dO",
  },
  business: {
    monthly: "pdt_0NfOJ8SCeVWcmpoJtiHaX",
    yearly: "pdt_0NfOJHY75Ky5FtnhU3ZPL",
  },
};

export const WORKSPACE_PLANS: WorkspacePlanOption[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    tagline: "Basic shared space to get started",
    creditsLabel: "No subscription",
    perks: ["3 members", "Basic tasks", "Personal use or small team"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 9,
    yearlyPrice: 89,
    tagline: "Matches the Starter pay plan",
    creditsLabel: "70 MC / month",
    perks: ["Unlimited chat", "Megsy Pro & Max", "Credit-based image, code & research", "24/7 support"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 299,
    tagline: "Matches the Pro pay plan",
    creditsLabel: "240 MC / month",
    perks: ["Unlimited images, slides, docs & deep research", "Video (credit-based)", "Team workspace included", "24/7 support"],
  },
  {
    id: "elite",
    name: "Elite",
    monthlyPrice: 59,
    yearlyPrice: 599,
    tagline: "Matches the Elite pay plan",
    creditsLabel: "500 MC / month",
    perks: ["Priority image queue", "API + webhooks", "Analytics dashboard", "24/7 support"],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 149,
    yearlyPrice: 1599,
    tagline: "Matches the Business pay plan",
    creditsLabel: "1,200 MC / month",
    perks: ["Dedicated infrastructure", "SSO & SLA", "24/7 support"],
  },
];

export function isWorkspacePaidPlan(plan: string | null | undefined): plan is WorkspacePaidPlan {
  return plan === "starter" || plan === "pro" || plan === "elite" || plan === "business";
}