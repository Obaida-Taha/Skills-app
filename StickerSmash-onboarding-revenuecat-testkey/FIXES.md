# Skill+ cleanup pass

Changes in this bundle:
- Added a real auth guard to `(tabs)` so unauthenticated users cannot open app data screens.
- Reordered root providers so `AuthProvider` is the single auth/session source and `AppProvider` can safely depend on it.
- Removed duplicate Supabase auth-session listening from `AppContext`.
- Settings now waits for a real user before loading/editing a profile.
- Signup keeps users on auth when email verification is required.
- Removed logging of full auth deep-link URLs (they can contain access/refresh tokens).
- Sign out is local to the current device session.
- Achievements are isolated per user instead of leaking between accounts on the same device.
- Achievement popup waits until that user's saved achievement state has loaded.
- Timer no longer writes to Supabase every second; it updates locally and persists when stopped/leaving.
- Journey media stays separate from `user_skills`; removed the unused media `updateSkill` prop.
- Media upload now chooses a more accurate MIME type for common image/video formats.
- Media deletion removes the metadata row first and treats Storage cleanup as best-effort to avoid broken visible rows.

## Onboarding + Premium test build
- Added a 3-step first-launch onboarding flow.
- Added RevenueCat SDK/provider integration using Supabase user UUIDs as RevenueCat App User IDs.
- Wired the existing `default` Offering into a native RevenueCat paywall.
- Added restore purchases in Settings and Premium/Free plan status.
- Free plan is limited to 5 skills; Premium unlocks unlimited skills.
- Free plan is limited to 2 journey media items per skill; Premium unlocks unlimited journey media.
- Added RevenueCat environment placeholders and `REVENUECAT_SETUP.md` with iPhone sandbox testing steps.
