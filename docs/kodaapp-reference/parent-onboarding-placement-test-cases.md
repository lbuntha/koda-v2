# Parent Onboarding, Child Creation, and Placement Test Cases

## Scope

Validate the parent signup/onboarding path, child profile creation, subject/grade enrollment, and student placement launch/completion.

## Preconditions

- A parent account can sign up and log in.
- System settings have grades configured, including `P`, `K`, and `1`.
- At least one published placement game exists:
  - `isOnboarding: true`
  - `type: "placement"`
  - `status: "PUBLISHED"`
  - `subject: "math"`
  - `grades` includes the selected child grade after normalization
- For recommendation-specific checks, published practice games may be missing or present. Missing recommendation IDs should not block placement publishing.

## Test Data

| Field | Value |
| --- | --- |
| Parent name | Parent QA |
| Parent email | parent.qa+placement@example.com |
| Child name | Lina QA |
| Child grade | Kindergarten (`K`) |
| Primary subject | Math |
| Optional subject | Science |
| Placement low score | 0-54% |
| Placement on-grade score | 55-79% |
| Placement stretch score | 80-100% |

## TC-PO-001: New Parent Can Create First Child During Onboarding

Priority: P0

Steps:
1. Sign up as a new parent.
2. Complete parent account creation.
3. On the first-child onboarding screen, enter child name `Lina QA`.
4. Select grade `K`.
5. Select or keep the suggested avatar.
6. Choose `Koda picks` or `Math` as first activity.
7. Submit onboarding.

Expected:
- A new student user is created.
- Parent user `children` contains the new child ID.
- Child has:
  - `role: STUDENT`
  - `status: Active`
  - `grades: ["K"]`
  - `displayName: "Lina QA"`
  - an avatar
- Parent lands in the app with the new child selectable.

Current-risk check:
- Verify whether the child also has `profileGrade`, `assignedSubjects`, `primarySubject`, and `subjectEnrollments`.
- If these are missing, placement will not automatically trigger for this onboarding path.

## TC-PO-002: First Child Created During Onboarding Should Trigger Required Placement

Priority: P0

Steps:
1. Use the child created in `TC-PO-001`.
2. Switch into the child/student experience.
3. Wait for the student dashboard to load.

Expected:
- Student sees a required placement activity before normal practice/games.
- The placement game selected matches:
  - subject `math`
  - grade `K`
  - `isOnboarding: true`
  - `type: placement`
  - `status: PUBLISHED`

Expected child data before launch:
```json
{
  "profileGrade": "K",
  "assignedSubjects": ["math"],
  "primarySubject": "math",
  "subjectEnrollments": {
    "math": {
      "targetGrade": "K",
      "status": "active",
      "placementStatus": "pending",
      "required": true
    }
  }
}
```

Likely current result:
- Placement may not show for first-time parent onboarding because `ParentOnboarding` creates only `grades` and `preferences`.

## TC-PO-003: Add Child Modal Creates Enrollment Ready for Placement

Priority: P0

Steps:
1. Log in as an existing parent.
2. Open `Add your first child` or `Add child`.
3. Enter child name `Lina QA`.
4. Select grade `K`.
5. Confirm `Math` is selected in Subjects.
6. Confirm Math is marked primary or `Required first`.
7. Continue to course picker.
8. Choose `Create & Skip`.

Expected:
- Child is created and linked to parent.
- Child has:
  - `grades: ["K"]`
  - `profileGrade: "K"`
  - `assignedSubjects` includes `math`
  - `primarySubject: "math"`
  - `subjectEnrollments.math.placementStatus: "pending"`
  - `subjectEnrollments.math.required: true`
- When switching to the child, required Math placement appears.

## TC-PO-004: Complete Placement Saves Placement Result

Priority: P0

Steps:
1. Start required Math placement for child grade `K`.
2. Answer enough questions to complete the placement.
3. Finish the placement.
4. Return to the student dashboard.

Expected:
- Child user is updated:
```json
{
  "subjectEnrollments": {
    "math": {
      "targetGrade": "K",
      "status": "active",
      "placementStatus": "complete",
      "required": true
    }
  },
  "subjectPlacements": {
    "math": {
      "status": "complete",
      "assessmentId": "<placement-game-id>",
      "band": "warmup | on-grade | stretch",
      "accuracy": "<0-1 number>",
      "targetGrade": "K",
      "recommendedGrade": "<grade id>",
      "completedAt": "<timestamp>"
    }
  }
}
```
- Placement screen no longer appears on refresh.
- Student game list is filtered to the assigned subject/placement path.

## TC-PO-005: Placement Score Bands Recommend Correct Grade

Priority: P1

Run the placement three times with fresh child profiles or reset placement data between runs.

| Scenario | Accuracy | Expected band | Expected behavior |
| --- | --- | --- | --- |
| Warmup | 0-54% | `warmup` | Recommended grade moves down or uses rule `recommendedGrade` |
| On-grade | 55-79% | `on-grade` | Recommended grade stays target grade or uses rule `recommendedGrade` |
| Stretch | 80-100% | `stretch` | Recommended grade moves up or uses rule `recommendedGrade` |

Expected:
- `subjectPlacements.math.band` matches the accuracy band.
- `subjectPlacements.math.recommendedGrade` is populated.
- If `recommendationId` exists and the target practice game is published, that game appears first.
- If `recommendationId` is missing/unpublished, placement still completes and the path falls back to recommended grade filtering.

## TC-PO-006: Missing Recommendation Target Does Not Block Placement Content

Priority: P1

Steps:
1. In Placement Builder, open a placement with a scoring rule recommendation such as `prek-math-review`.
2. Ensure no published practice game exists with that ID.
3. Publish the placement.

Expected:
- Publish succeeds.
- The missing recommendation ID is visible as a stale/missing target in the builder.
- Student placement can still be completed.
- Student path uses `recommendedGrade` even if the exact `recommendationId` target is unavailable.

## TC-PO-007: Grade Normalization Works for Legacy Placement Content

Priority: P1

Steps:
1. Import a placement JSON whose `grades` value is `pre-k`.
2. Confirm the builder maps it to the configured Pre-K grade ID, usually `P`.
3. Publish the placement.
4. Create a Pre-K child.
5. Switch to the child/student experience.

Expected:
- Publish does not fail with `Choose a valid grade before publishing`.
- Pre-K child can find the placement assessment.
- The selected grade is stored using the configured grade ID.

## TC-PO-008: Optional Subject Placement Is Not Forced

Priority: P2

Steps:
1. Add a child with Math as primary and Science as optional.
2. Ensure both subjects have `placementStatus: pending`.
3. Switch to student experience.

Expected:
- Required Math placement appears first.
- Science placement appears only as optional placement prompt after required placement is handled.
- Dismissing optional placement hides it for the current session only.

## TC-PO-009: Course Enrollment During Child Creation Still Preserves Placement Data

Priority: P1

Steps:
1. Open Add Child modal.
2. Create child with grade `K`, primary Math.
3. In course picker, select a published course.
4. Click `Create & Enroll`.

Expected:
- Child is created and linked to parent.
- Practice enrollment is created for selected program.
- Child still has `subjectEnrollments.math.placementStatus: "pending"`.
- Required placement still appears before normal student path.

## TC-PO-010: Plan Limit Blocks Extra Child Creation

Priority: P2

Steps:
1. Use a parent account on a plan with max child profiles reached.
2. Try to add another child.

Expected:
- Add-child flow does not create a child.
- Limit modal or error appears.
- Parent `children` list is unchanged.

## Recommended Fix Before P0 Testing

Align `ParentOnboarding` with `AddChildModal` by creating the same enrollment fields:

- `profileGrade: selectedGrade`
- `assignedSubjects: ["math"]` when `Koda picks` is selected, or `[selectedSubject]` for a specific subject
- `primarySubject`
- `subjectEnrollments[primarySubject]` with `placementStatus: "pending"` and `required: true`

Without this, the first-time parent onboarding flow can create a valid child profile but skip the placement requirement.
