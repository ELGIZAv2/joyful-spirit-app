// Subscription gating - DISABLED: all users can access all features
import { FREE_MODEL_IDS } from "@/lib/modelDetails";

export const PAID_PLANS = ["starter", "pro", "elite", "enterprise"];

export const isFreeModel = (modelId: string): boolean => {
  return true; // All models accessible
};

export const isPaidUser = (plan: string | null | undefined): boolean => {
  return true; // All users treated as paid
};

export const canUseModel = (modelId: string, plan: string | null | undefined): boolean => {
  return true; // All models accessible
};

export const canUseCodeWorkspace = (plan: string | null | undefined): boolean => {
  return true; // All users can access code workspace
};
