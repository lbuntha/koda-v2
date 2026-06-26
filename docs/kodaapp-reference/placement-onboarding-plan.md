# Placement Onboarding Plan

This plan is for testing the onboarding experience before building the full component set. The first pass should be a mocked, clickable flow that lets us validate how parents add children, how kids start placement, and how results become learning recommendations.

## Goals

- Let a parent create or sign in, then add one or more child profiles.
- Use the existing learning catalog concept: subjects and age ranges are configured by admin.
- Keep the child setup fast: name, age range, language, and subjects.
- Give the child a friendly placement check before the learning dashboard.
- Recommend a starting level, subjects, and first skills after placement.
- Support multiple children under one parent account.

## Non-Goals For The First Mock

- No production adaptive engine yet.
- No full placement question bank editor yet.
- No payment, classroom, or teacher assignment flow.
- No permanent database migration unless the mock proves the model.
- No final scoring science; use simple thresholds first.

## Existing Product Context

- Parent users can own child profiles.
- Current child profile fields are `display_name`, `grade`, `locale`, and `active_skill_ids`.
- Admin can configure learning subjects and age ranges through the learning catalog.
- Age ranges should be preferred over exact birth dates unless the product later needs exact age.

## Recommended Onboarding Shape

### Parent Flow

1. Parent creates account or signs in.
2. Parent lands on `Add child`.
3. Parent enters child nickname or first name.
4. Parent chooses age range: `5-6`, `7-8`, `8-9`, etc.
5. Parent chooses language.
6. Parent reviews recommended subjects for that age range.
7. Parent can add or remove subjects.
8. Parent starts placement for the child.
9. After placement, parent sees a simple result summary.

### Kid Flow

1. Kid sees a welcome screen with their name.
2. Kid chooses or confirms a subject if more than one subject is enabled.
3. Kid answers a short placement check.
4. Kid sees friendly progress, not a pass/fail score.
5. Kid reaches a success screen and enters the first recommended activity.

### Multi-Child Flow

1. Parent dashboard lists children as subrecords.
2. Each child has a placement status: `Not started`, `In progress`, or `Ready`.
3. Parent can resume placement per child.
4. Parent can add another child after the first child is ready.

## Quick First Mock

These mocks are intentionally simple. They are meant to test placement and copy before building final components.

### Screen 1: Parent Adds Child

```text
+--------------------------------------------------+
| Add your child                                   |
| Set up a learning profile for this child.        |
|                                                  |
| Child name *                                     |
| [ Dara                                           ]|
|                                                  |
| Age range *                                      |
| [ 5-6 v ]                                        |
|                                                  |
| Language *                                       |
| [ English v ]                                    |
|                                                  |
|                         [ Continue ]             |
+--------------------------------------------------+
```

### Screen 2: Recommended Subjects

```text
+--------------------------------------------------+
| Dara's subjects                                  |
| Based on age 5-6, these are recommended.         |
|                                                  |
| [x] Math        Numbers and simple problems      |
| [x] Reading     Letters, sounds, and words       |
| [ ] Science     Nature and simple experiments    |
|                                                  |
| Primary placement subject *                      |
| [ Math v ]                                       |
|                                                  |
|              [ Back ]        [ Start placement ] |
+--------------------------------------------------+
```

### Screen 3: Kid Welcome

```text
+--------------------------------------------------+
| Hi Dara                                          |
| Let's do a quick check so Koda can start you     |
| in the right place.                              |
|                                                  |
|          [ Start ]                               |
|                                                  |
| Parent can help if needed.                       |
+--------------------------------------------------+
```

### Screen 4: Placement Question

```text
+--------------------------------------------------+
| Math check                         3 of 8        |
|                                                  |
| What is 4 + 2?                                   |
|                                                  |
| [ 5 ]     [ 6 ]                                  |
| [ 7 ]     [ 8 ]                                  |
|                                                  |
| Progress:  [======------]                        |
+--------------------------------------------------+
```

### Screen 5: Parent Result Summary

```text
+--------------------------------------------------+
| Dara is ready                                    |
|                                                  |
| Math starting point                              |
| Numbers and addition practice                    |
|                                                  |
| Recommended first skills                         |
| - Count objects                                  |
| - Add within 10                                  |
| - Compare numbers                                |
|                                                  |
| [ Go to Dara's dashboard ]    [ Add another child]|
+--------------------------------------------------+
```

## Placement Logic V0

Use a simple fixed placement test first.

- Ask 6 to 8 questions for the primary subject.
- Use age range and selected subject to pick the question set.
- Mix three bands: warmup, target, and stretch.
- Score by accuracy first.
- Do not show a numeric score to the child.

### Simple Result Bands

```text
0% - 40%    Review band      Start with easier foundation skills.
41% - 75%   Ready band       Start in the selected age range.
76% - 100%  Stretch band     Start with selected age range plus challenge skills.
```

### Early Exit Option

For the first mock, do not implement adaptive early exit. For a later version, stop early when the child misses 3 target questions in a row or gets 4 stretch questions correct.

## Data Model Draft

Keep this as a draft until the mock is approved.

### Child Profile Additions

```ts
interface ChildProfile {
  age_range_id?: string;
  subject_ids?: string[];
  primary_subject_id?: string;
  placement_status?: 'not_started' | 'in_progress' | 'complete';
  placement_result_summary?: PlacementResultSummary;
}
```

### Placement Session

```ts
interface PlacementSession {
  _id: string;
  parent_user_id: string;
  child_profile_id: string;
  age_range_id: string;
  subject_id: string;
  status: 'started' | 'completed' | 'abandoned';
  current_question_index: number;
  answers: PlacementAnswer[];
  result?: PlacementResultSummary;
  started_at: string;
  completed_at?: string | null;
}
```

### Placement Answer

```ts
interface PlacementAnswer {
  question_id: string;
  subject_id: string;
  difficulty: 'warmup' | 'target' | 'stretch';
  selected_value: string | number;
  correct: boolean;
  answered_at: string;
}
```

### Placement Result Summary

```ts
interface PlacementResultSummary {
  subject_id: string;
  band: 'review' | 'ready' | 'stretch';
  accuracy: number;
  recommended_age_range_id: string;
  recommended_skill_ids: string[];
  parent_summary: string;
}
```

## API Draft

These endpoints should come after the mock flow is approved.

```text
POST /placement/sessions
GET  /placement/sessions/{session_id}
GET  /placement/sessions/{session_id}/next-question
POST /placement/sessions/{session_id}/answers
POST /placement/sessions/{session_id}/complete
GET  /me/children/{child_id}/placement
```

## Component Plan For Later

- `ParentOnboardingLayout`
- `ChildProfileStep`
- `ChildAgeSubjectStep`
- `ChildSubjectPicker`
- `KidPlacementIntro`
- `PlacementQuestionCard`
- `PlacementProgress`
- `PlacementResultSummary`
- `ParentChildPlacementCard`

The first build should use mocked local data and local state. API persistence should come after the flow is approved.

## Admin Dependencies

The mock should read from the same concepts as the admin learning catalog.

- Subjects: Math, Reading, Science, etc.
- Age ranges: `5-6`, `7-8`, `8-9`, etc.
- Each age range can define recommended subjects.
- Each subject can define a short description and enabled state.

Placement tests can later become an admin-managed area named `Placement Builder`, but that should not block the onboarding mock.

## Mobile Layout Notes

- Use one primary action per screen.
- Keep parent forms short and stacked.
- Make kid question options large enough to tap.
- Keep progress visible without adding a heavy toolbar.
- Parent result summary should fit on one mobile screen where possible.

## Privacy And Safety Notes

- Prefer age range over exact date of birth.
- Parent owns child profile setup and can remove a child profile.
- Do not show labels like failed, weak, or behind.
- Use parent-facing summaries for recommendations.
- Use child-facing language that feels like a quick check, not an exam.

## First Mock Acceptance Criteria

- Parent can step through add child, age range, subjects, kid intro, questions, and result.
- Parent can add another child from the result screen.
- The mock supports at least two children in local state.
- The mock supports at least three subjects and three age ranges.
- Placement status is visible per child.
- The layout is responsive on mobile and desktop.
- The mock uses existing Koda assets and visual style.

## Open Questions

- Should parent choose age range only, or should grade remain visible too?
- Which subjects should be compulsory for each age range?
- Should the first placement always use Math, or should the parent choose primary subject?
- Should the child complete all selected subjects during onboarding, or only one primary subject first?
- Should results immediately assign `active_skill_ids`, or wait for parent confirmation?
- Do we need Khmer copy in the first mock or English only?
