export const FREE_SKILL_LIMIT = 5;

// Free users can attach up to 2 photos/videos to each skill journey.
export const FREE_MEDIA_PER_SKILL = 2;

// RevenueCat Test Store public SDK key supplied for this dedicated test build.
// This is a public client key, not a RevenueCat secret API key.
// IMPORTANT: never ship an App Store production build using a test_ key.
export const REVENUECAT_TEST_STORE_API_KEY =
  'test_UfpRUChGjQlGjHSNTHMLPyjnBCX';

// RevenueCat Offering identifier in this project.
export const REVENUECAT_OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || 'default';

// Exact RevenueCat Entitlement identifier supplied by the user.
export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'skill+ Pro';
