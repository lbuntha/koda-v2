# Placement Onboarding Plan

## Goal

Build a multi-subject placement system where parents assign subjects and grades, admins manage placement tests, and students receive recommended learning paths. Math uses the existing worksheet engine first, while the architecture stays open for reading, science, and future subjects.

## Core Decisions

- A child has one main profile grade.
- A child can have multiple assigned subjects.
- Each assigned subject can optionally have its own target grade.
- Parent chooses one primary subject during onboarding.
- Only the primary subject placement is required before the student enters the dashboard.
- Other subject placements remain pending and can be completed later.
- Math placement uses the existing Math Worksheet renderer.
- Other subjects use renderer adapters under the same placement engine.
- Placement content and rules are admin-managed, not hardcoded in the student UI.
- If no published placement test exists for a subject and grade, the app falls back to the normal grade path.

## Data Model

### Student Profile Fields

```ts
{
  profileGrade: '2',
  assignedSubjects: ['math', 'reading', 'science'],
  primarySubject: 'math',
  subjectEnrollments: {
    math: {
      targetGrade: '2',
      status: 'active',
      placementStatus: 'pending',
      required: true
    },
    reading: {
      targetGrade: '1',
      status: 'active',
      placementStatus: 'pending',
      required: false
    },
    science: {
      targetGrade: '2',
      status: 'active',
      placementStatus: 'pending',
      required: false
    }
  }
}
```

### Placement Result Fields

```ts
{
  subjectPlacements: {
    math: {
      status: 'complete',
      assessmentId: 'grade-2-math-placement',
      band: 'on-grade',
      accuracy: 0.72,
      targetGrade: '2',
      recommendedGrade: '2',
      recommendationId: 'grade-2-math-core',
      completedAt: 1710000000000
    }
  }
}
```

### Placement Content Fields

Use `customGames` first because the app already has a content pipeline there.

```ts
{
  id: 'grade-2-math-placement',
  isOnboarding: true,
  type: 'placement',
  subject: 'math',
  grades: ['2'],
  status: 'PUBLISHED',
  renderer: 'math-worksheet',
  levelData: {
    worksheetType: 'mixed',
    questionCount: 10,
    items: []
  },
  scoringRules: [
    {
      band: 'warmup',
      minAccuracy: 0,
      maxAccuracy: 0.54,
      recommendedGradeOffset: -1,
      recommendationId: 'grade-2-math-review'
    },
    {
      band: 'on-grade',
      minAccuracy: 0.55,
      maxAccuracy: 0.79,
      recommendedGradeOffset: 0,
      recommendationId: 'grade-2-math-core'
    },
    {
      band: 'stretch',
      minAccuracy: 0.8,
      maxAccuracy: 1,
      recommendedGradeOffset: 1,
      recommendationId: 'grade-2-math-stretch'
    }
  ]
}
```

## Parent Flow

1. Parent creates or edits a child profile.
2. Parent selects the main grade.
3. Parent assigns one or more subjects.
4. Parent selects a primary subject.
5. Parent can optionally override target grade per subject.
6. App creates subject enrollment records.
7. Primary subject placement is required first; other placements are optional prompts.

## Student Flow

1. Student logs in.
2. App reads assigned subjects and subject enrollments.
3. App finds the next required pending placement.
4. App loads the matching published placement test by subject and target grade.
5. App chooses renderer from the placement record.
6. Math renders through the Math Worksheet engine.
7. Completion computes accuracy and placement band.
8. App saves subject placement result.
9. Student enters dashboard after the primary placement is complete.
10. Dashboard shows optional placement prompts for remaining assigned subjects.

## Dashboard Rules

- Assigned subject with completed placement shows the recommended path.
- Assigned subject with required placement pending shows placement first.
- Assigned subject with optional placement pending shows a non-blocking prompt.
- Assigned subject with no placement test available uses the normal grade path.
- Unassigned subjects are hidden from the student experience.

## Admin UI

Create a dedicated admin section named `Placement Builder`.

The first version should include:

- Placement test list.
- Filters for subject, grade, and status.
- Create, duplicate, publish, unpublish, and archive actions.
- Subject selector.
- Grade or grade-band selector.
- Renderer selector.
- Math worksheet content editor or JSON importer.
- Scoring rules editor.
- Recommendation mapping editor.
- Student preview.

Placement tests should not be buried in the normal game list because they need their own targeting, scoring, and recommendation controls.

## Renderer Strategy

Use one placement engine with subject-specific renderers.

```ts
type PlacementRenderer =
  | 'math-worksheet'
  | 'reading-passage'
  | 'science-concept-check'
  | 'vocabulary-check'
  | 'spelling-check';
```

Math is the first implementation. Reading and science can be added later without changing the parent enrollment model or placement result model.

## Implementation Phases

1. Add placement and subject enrollment types.
2. Add placement query service for `customGames`.
3. Replace temporary check-in UI with content-driven placement routing.
4. Wire math placement to the existing worksheet renderer.
5. Save placement result and recommendation on the student profile.
6. Update parent child setup to support assigned subjects, primary subject, and subject grade override.
7. Update student dashboard to respect assigned subjects and placement status.
8. Build Admin Placement Builder.
9. Create initial math placement JSON for PreK, K, and Grades 1-6.
10. QA mobile, tablet, desktop, missing placement fallback, and multi-subject/multi-grade cases.

## Initial Math Content Plan

Create short diagnostic placement tests for:

- PreK
- Kindergarten
- Grade 1
- Grade 2
- Grade 3
- Grade 4
- Grade 5
- Grade 6

Each test should be 8 to 12 questions, mixed by grade-appropriate skill area. Do not use `WS_1_Diagnostic.json` as-is because its grade metadata and item difficulty do not match cleanly.

## Open Questions

- Whether placement records should stay in `customGames` long-term or move to a dedicated `placementAssessments` collection later.
- Exact subject IDs to use across parent setup, admin filters, and student dashboard.
- Whether recommendation targets should point to individual custom games, practice programs, or future curriculum paths.
- How much of the Admin Placement Builder should reuse the current game studio editor.
