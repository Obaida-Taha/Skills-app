import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import RevenueCatUI, {
  PAYWALL_RESULT,
} from 'react-native-purchases-ui';

import { useAuth } from '@/contexts/AuthContext';
import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_OFFERING_ID,
  REVENUECAT_TEST_STORE_API_KEY,
} from '@/features/premium/config';

type SubscriptionState = {
  isPremium: boolean;
  loading: boolean;
  configured: boolean;
  entitlementId: string;
  offeringId: string;
  refreshCustomerInfo: () => Promise<boolean>;
  presentPaywall: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
};

const SubscriptionContext =
  createContext<SubscriptionState | null>(null);

function getPlatformApiKey(): string {
  if (Platform.OS === 'ios') {
    const iosKey =
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || '';

    if (iosKey) return iosKey;

    // This ZIP is intentionally configured for RevenueCat Test Store testing.
    // Restrict the bundled test key to development builds so it cannot
    // accidentally become the purchase key for a production App Store build.
    return __DEV__ ? REVENUECAT_TEST_STORE_API_KEY : '';
  }

  if (Platform.OS === 'android') {
    const androidKey =
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || '';

    if (androidKey) return androidKey;

    return __DEV__ ? REVENUECAT_TEST_STORE_API_KEY : '';
  }

  return '';
}

function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
  );
}

export function SubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  const configuredRef = useRef(false);
  const identifiedUserRef = useRef<string | null>(null);

  const applyCustomerInfo = useCallback((customerInfo: CustomerInfo) => {
    const premium = hasPremiumEntitlement(customerInfo);
    setIsPremium(premium);
    return premium;
  }, []);

  const refreshCustomerInfo = useCallback(async (): Promise<boolean> => {
    if (!configuredRef.current) {
      setIsPremium(false);
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return applyCustomerInfo(customerInfo);
    } catch (error) {
      console.warn('RevenueCat customer info failed:', error);
      return false;
    }
  }, [applyCustomerInfo]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    async function configureRevenueCat() {
      const apiKey = getPlatformApiKey();

      // Real App Store / Play purchases are only configured for native targets.
      if (!apiKey) {
        if (!cancelled) {
          setConfigured(false);
          setIsPremium(false);
          setLoading(false);
        }
        return;
      }

      try {
        if (!configuredRef.current) {
          if (__DEV__) {
            await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
          }

          Purchases.configure({
            apiKey,
            ...(user?.id ? { appUserID: user.id } : {}),
          });

          configuredRef.current = true;
          identifiedUserRef.current = user?.id ?? null;
          setConfigured(true);
        } else if (
          user?.id &&
          identifiedUserRef.current !== user.id
        ) {
          const result = await Purchases.logIn(user.id);
          identifiedUserRef.current = user.id;
          applyCustomerInfo(result.customerInfo);
        } else if (!user && identifiedUserRef.current) {
          const customerInfo = await Purchases.logOut();
          identifiedUserRef.current = null;
          applyCustomerInfo(customerInfo);
        }

        if (!cancelled) {
          await refreshCustomerInfo();
        }
      } catch (error) {
        console.warn('RevenueCat setup failed:', error);
        if (!cancelled) {
          setConfigured(false);
          setIsPremium(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void configureRevenueCat();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, applyCustomerInfo, refreshCustomerInfo]);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const listener = (customerInfo: CustomerInfo) => {
      applyCustomerInfo(customerInfo);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured, applyCustomerInfo]);

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (!configuredRef.current) {
      Alert.alert(
        'Premium is not configured yet',
        'This release build does not have a platform-specific RevenueCat key. The bundled Test Store key is development-only.'
      );
      return false;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const offering =
        offerings.all[REVENUECAT_OFFERING_ID] ?? offerings.current;

      if (!offering) {
        Alert.alert(
          'Premium unavailable',
          `RevenueCat did not return the "${REVENUECAT_OFFERING_ID}" offering.`
        );
        return false;
      }

      const result = await RevenueCatUI.presentPaywall({ offering });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        return refreshCustomerInfo();
      }

      return false;
    } catch (error) {
      console.warn('RevenueCat paywall failed:', error);
      Alert.alert(
        'Could not open Premium',
        error instanceof Error ? error.message : 'Please try again.'
      );
      return false;
    }
  }, [refreshCustomerInfo]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!configuredRef.current) {
      Alert.alert(
        'Restore unavailable',
        'RevenueCat is not configured on this build yet.'
      );
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const premium = applyCustomerInfo(customerInfo);

      Alert.alert(
        premium ? 'Purchases restored' : 'Nothing to restore',
        premium
          ? 'Skill+ Premium is active on this account.'
          : 'No active Skill+ Premium purchase was found.'
      );

      return premium;
    } catch (error) {
      console.warn('RevenueCat restore failed:', error);
      Alert.alert(
        'Restore failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
      return false;
    }
  }, [applyCustomerInfo]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        loading,
        configured,
        entitlementId: REVENUECAT_ENTITLEMENT_ID,
        offeringId: REVENUECAT_OFFERING_ID,
        refreshCustomerInfo,
        presentPaywall,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);

  if (!value) {
    throw new Error('SubscriptionProvider missing');
  }

  return value;
}
