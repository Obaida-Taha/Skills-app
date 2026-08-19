# Skill+ RevenueCat test build

This ZIP is a separate RevenueCat **Test Store** build for Skill+.

## RevenueCat values already wired in

Test Store public SDK key:

```text
test_UfpRUChGjQlGjHSNTHMLPyjnBCX
```

Entitlement identifier:

```text
skill+ Pro
```

Offering identifier:

```text
default
```

The Test Store key is public/client-side and is intentionally embedded in this **test ZIP only**.
The code only falls back to the `test_...` key when `__DEV__` is true. A release build without a real platform key will leave RevenueCat unconfigured instead of accidentally shipping the Test Store key.

## Premium rules in this build

- Free: up to **5 skills** in My Skills.
- Trying to add skill #6 opens the RevenueCat paywall.
- Free: up to **2 photos/videos per skill Journey**.
- Trying to add a third media item for that skill opens the RevenueCat paywall.
- Active `skill+ Pro`: unlimited skills and unlimited Journey media.
- Settings includes Upgrade and Restore purchases.

## Products

The `skill+ Pro` entitlement should have all three Test Store products attached:

- Monthly
- Yearly
- Lifetime

The `default` Offering should expose those products through its packages.

## Your existing `.env`

Keep your existing Supabase values. For this debug/Test Store build, no RevenueCat env value is required because the supplied `test_...` key is already wired in as a development fallback.

You may still set these explicitly:

```env
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID="skill+ Pro"
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

## Install

Run:

```bash
npm install
```

The project adds:

```text
react-native-purchases
react-native-purchases-ui
```

Then on the Mac/native iOS project:

```bash
npx expo prebuild --platform ios
npx pod-install
open ios/*.xcworkspace
```

Use a native development build on your iPhone. RevenueCat Test Store works by initializing the SDK with the Test Store API key; Test Store purchases do not go through Apple's real App Store billing.

## Test checklist

1. Fresh install -> onboarding appears.
2. Register/login.
3. Add skills 1-5 -> allowed.
4. Try skill #6 -> RevenueCat paywall should open.
5. Cancel -> skill #6 remains locked.
6. Buy Monthly, Yearly, or Lifetime in RevenueCat Test Store -> `skill+ Pro` activates.
7. Add skill #6+ -> allowed.
8. For a free account, add 2 Journey photos/videos to one skill -> allowed.
9. Try a 3rd on that same skill -> paywall should open.
10. With Premium active -> unlimited Journey media.
11. Settings -> Restore purchases.

## Before TestFlight / App Store

**Do not submit an app using a RevenueCat `test_...` key.**

Create/connect the Apple App Store app in the same RevenueCat project and then put its real public SDK key in your real `.env`:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_XXXXXXXXXXXXXXXX
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID="skill+ Pro"
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

The production `appl_...` key will override the bundled development Test Store fallback.
