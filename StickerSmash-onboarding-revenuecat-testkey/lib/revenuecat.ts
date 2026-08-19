import Purchases from 'react-native-purchases';

import RevenueCatUI, {
  PAYWALL_RESULT,
} from 'react-native-purchases-ui';

const OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ??
  'default';

export async function showSkillPlusPaywall(): Promise<boolean> {
  try {
    const offerings =
      await Purchases.getOfferings();

    const offering =
      offerings.all[OFFERING_ID] ??
      offerings.current;

    if (!offering) {
      console.warn(
        `RevenueCat offering "${OFFERING_ID}" was not found.`
      );

      return false;
    }

    const result =
      await RevenueCatUI.presentPaywall({
        offering,
      });

    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return true;

      case PAYWALL_RESULT.CANCELLED:
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      default:
        return false;
    }
  } catch (error) {
    console.warn(
      'RevenueCat paywall error:',
      error
    );

    return false;
  }
}
