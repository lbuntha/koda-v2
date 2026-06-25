# Koda Launch Kick-off Checklist

## Launch Goal

Parent signs in, selects a child, child plays learning activities, progress saves, and parent can see progress.

## Phase 1: Stabilize Core App

- [ ] Mobile app opens without infinite loading.
- [ ] Already logged-in user resumes correctly.
- [ ] Parent can sign in.
- [x] Parent can create an account.
- [x] New parent is guided to create/select a child profile.
- [x] First-time parents get a simplified child setup flow before profile selection.
- [x] Student direct signup is either intentionally supported or hidden for launch.
- [x] Signup requires terms/privacy consent.
- [x] Signup handles weak password, duplicate email, and network errors clearly.
- [x] Email signup validates email format before submitting.
- [x] Email signup sends a verification link before the parent can sign in.
- [x] Email verification screen tells parents to check Spam/Junk if needed.
- [ ] Google signup behavior is tested on mobile.
- [x] New Google users are not accidentally created with the wrong role.
- [ ] Parent can select a child profile.
- [ ] Student dashboard loads.
- [ ] Student can start an activity.
- [ ] Student can complete an activity.
- [ ] XP/progress saves.
- [ ] Parent can see updated progress.
- [ ] Firestore permission issues are fixed.

### Signup Fix Status

- [x] Signup entry point is parent-only for launch.
- [x] Email/password signup creates parent accounts.
- [x] Email/password signup normalizes and validates email addresses.
- [x] Email/password signup sends a verification email and signs out until verified.
- [x] Clean Firebase email verification template is documented.
- [x] Verified email parents recover/create a parent profile instead of seeing role selection.
- [x] New parents with no children see a guided child setup flow instead of the parent dashboard.
- [x] Google signup creates missing users as parents.
- [x] Terms/privacy consent is required before email or Google signup.
- [x] New parent signup sets the onboarding flag so the app opens the parent profile flow.
- [x] Weak-password and duplicate-email Firebase errors have user-facing messages.
- [x] Network/offline and Google popup Firebase errors have user-facing messages.
- [ ] Mobile Google signup still needs a real-device check.
- [ ] Network/offline signup behavior still needs simulated or real-device QA.

## Phase 2: Launch Design Cleanup

- [ ] Login/register screens feel polished.
- [ ] Parent profile selector feels polished.
- [ ] Student dashboard feels polished.
- [ ] Game start and end screens feel polished.
- [ ] Parent dashboard feels polished.
- [ ] Buttons, cards, spacing, and colors are consistent.
- [ ] Mobile layout is checked first.
- [ ] Unfinished screens are hidden or simplified.

## Phase 3: Feature Cut

### Include For Launch

- [ ] Auth
- [ ] Parent profile selection
- [ ] Student dashboard
- [ ] 3 polished games
- [ ] XP/progress
- [ ] Parent progress view
- [ ] Basic admin/content management

### Maybe Include

- [ ] Courses
- [ ] My Sets

### Delay Until Later

- [ ] Challenges
- [ ] Complex rewards
- [ ] Notifications
- [ ] Advanced analytics
- [ ] Teacher/classroom features
- [ ] Subscription complexity

## Phase 4: Content Polish

- [ ] Pick 3 best games.
- [ ] Check instructions are clear.
- [ ] Check difficulty fits the target grade.
- [ ] Check completion screen feels rewarding.
- [ ] Check wrong-answer feedback is helpful.
- [ ] Remove broken or confusing levels.

## Phase 5: QA Checklist

- [ ] Open app on mobile.
- [ ] Create a new parent account with email/password.
- [ ] Create a new account with Google.
- [ ] Try duplicate-email signup.
- [ ] Try weak-password signup.
- [ ] Confirm new parent reaches child setup.
- [ ] Logged-in session resumes.
- [ ] Parent selects child.
- [ ] Student dashboard loads.
- [ ] Student starts activity.
- [ ] Student completes activity.
- [ ] XP/progress saves.
- [ ] Parent sees updated progress.
- [ ] Close and reopen app.
- [ ] App does not spin forever.

## Extra QA

- [ ] Slow network
- [ ] Page refresh
- [ ] Logout/login
- [ ] Parent with no child
- [ ] Child with no grade
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Phase 6: Private Beta

- [ ] Invite 5 families.
- [ ] Test with one grade group.
- [ ] Run beta for 1-2 weeks.
- [ ] Ask if the child knew what to do.
- [ ] Ask if the app got stuck.
- [ ] Ask if the parent understood progress.
- [ ] Ask what confused them.
- [ ] Ask if they would use it again tomorrow.

## Phase 7: Launch Prep

- [ ] Add basic error logging.
- [ ] Add support/contact path.
- [ ] Clean empty states.
- [ ] Check privacy and terms.
- [ ] Confirm Firestore rules.
- [ ] Confirm production deploy process.
- [ ] Confirm backup/admin access.
- [ ] Prepare simple pricing or free beta message.

## Recommended Next Order

1. Run signup QA on mobile Safari and Chrome: email signup, Google signup, duplicate email, weak password, and offline/slow network.
2. Verify the new-parent path lands in profile setup and can create the first child.
3. Test the full parent-child-progress flow: select child, start activity, complete activity, save XP, view progress as parent.
4. Pick the 3 launch games and hide unstable game/features from the default student path.
5. Clean the parent profile selector and student dashboard for mobile.
6. Confirm Firestore rules with the same parent-child-progress flow.
7. Invite 5 families for private beta once the above flow passes twice.
