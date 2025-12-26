import { type Database } from '@/types/supabase';

type Company = Database['public']['Tables']['companies']['Row'];
type PlanTier = 'free' | 'pro' | 'enterprise';

export const FEATURES = {
    // Example features - extend as needed
    calendar_integration: {
        minTier: 'free' as PlanTier,
    },
    custom_branding: {
        minTier: 'pro' as PlanTier,
    },
    advanced_analytics: {
        minTier: 'enterprise' as PlanTier,
    },
    unlimited_templates: {
        minTier: 'pro' as PlanTier,
    },
} as const;

export type FeatureName = keyof typeof FEATURES;

const TIER_LEVELS: Record<PlanTier, number> = {
    free: 0,
    pro: 1,
    enterprise: 2,
};

/**
 * Checks if a company has access to a specific feature.
 * 
 * @param company The company object (must include plan_tier)
 * @param feature The name of the feature to check
 * @returns true if the company has access, false otherwise
 */
export function hasFeature(company: Pick<Company, 'plan_tier'> | null, feature: FeatureName): boolean {
    if (!company || !company.plan_tier) {
        return false; // Default to no access if company context is missing
    }

    // Cast the plan_tier from the database (string) to our strict PlanTier type
    // In a real app, you might want Zod or runtime validation here
    const companyTier = company.plan_tier as PlanTier;
    const featureConfig = FEATURES[feature];

    if (!featureConfig) {
        console.warn(`Feature ${feature} is not defined in FEATURES config.`);
        return false;
    }

    const companyLevel = TIER_LEVELS[companyTier] ?? 0;
    const requiredLevel = TIER_LEVELS[featureConfig.minTier];

    return companyLevel >= requiredLevel;
}
