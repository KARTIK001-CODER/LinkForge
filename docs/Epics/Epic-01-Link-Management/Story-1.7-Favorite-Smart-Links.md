# Feature Design Document: Favorite Smart Links

## 1. Executive Summary
The Favorite Smart Links feature (Story 1.7) allows users to mark specific Smart Links as "Favorites" for rapid access. This significantly improves productivity for power users managing hundreds of links by surfacing their most critical assets. This document outlines the technical design, UI/UX considerations, and data model decisions required to implement this feature gracefully.

## 2. Feature Overview
Users will see a "Star" icon next to each link in the dashboard. Clicking the star toggles the favorite status. Favorited links can be quickly filtered in the main dashboard, or viewed in a dedicated "Favorites" tab/page.

## 3. Problem Statement
As workspaces grow, users accumulate hundreds or thousands of Smart Links. Finding a frequently used link (e.g., a primary marketing campaign URL or standard bio link) becomes tedious and requires manual searching or filtering every time.

## 4. Product Goals
- Reduce the "time to copy" for frequently used links.
- Improve dashboard usability for large workspaces.
- Provide a visually distinct indicator for important links.

## 5. Success Metrics
- **Adoption Rate:** > 30% of active users utilize the Favorite toggle within 30 days.
- **Engagement:** 40% of all "Copy Link" actions originate from Favorited links.
- **Performance:** Toggling a favorite must update the UI optimistically and complete the API call in < 100ms.

## 6. Product Vision
LinkForge aims to be the most frictionless link management platform. Allowing users to curate their own view of essential links aligns directly with our mission of intelligent organization.

## 7. User Personas
- **Power User:** Manages 500+ links. Uses favorites to pin active, high-traffic campaign links.
- **Casual User:** Manages 10 links, uses favorites to highlight their single main portfolio link.

## 8. User Stories
- As a user, I want to click a star icon to mark a link as a favorite.
- As a user, I want to toggle a filter to view *only* my favorite links.
- As a user, I expect my favorite links to remain favorited even if I edit their destination URL.

## 9. Functional Requirements
- **Toggle API:** `PATCH /api/v1/links/:id/favorite` to toggle state.
- **UI Indicator:** A prominent Star icon (filled/unfilled) in the dashboard table.
- **Filtering:** The dashboard API must support filtering by `isFavorite=true`.

## 10. Non-Functional Requirements
- **Optimistic UI:** The star must immediately fill when clicked on the frontend before the API returns.
- **Performance:** Filtering by favorites should be indexed and highly performant.

---

## Important Product Decisions

### 1. Boolean Column vs Separate Table
**Comparison:**
- **Boolean Column (`isFavorite` on `SmartLink`):**
  - *Pros:* Extremely fast to query, minimal DB schema changes, perfect for single-user workspaces.
  - *Cons:* Does not support future multi-user teams well (if User A favorites a link, User B sees it favorited too).
- **Separate Table (`UserFavorites` mapping `userId` to `linkId`):**
  - *Pros:* Fully scalable for enterprise teams. Each user has personal favorites. Extensible for tagging.
  - *Cons:* Over-engineered for the current MVP where the `User` auth model is not fully mapped to links yet. Requires a JOIN on every link query.

**Recommendation:** **Boolean Column (`isFavorite`) for MVP.** 
Following the YAGNI (You Aren't Gonna Need It) principle, since LinkForge currently assumes single-user link ownership (1:1), a boolean column is highly performant and requires zero JOINs. When Team Workspaces are introduced in Epic 3, we will migrate this boolean into a `UserFavorites` table.

### 2. Dashboard Only vs Dedicated Page
**Recommendation:** **Dashboard Filter Toggle.**
Creating an entirely separate page for Favorites duplicates the Dashboard's complex filtering, pagination, and sorting logic. Instead, the UX will be vastly superior if we add a top-level "Favorites" toggle (or pill) directly on the existing Dashboard, allowing users to instantly filter their current view while retaining all other search/tag functionality.

### 3. Archiving and Deletion Business Rules
- **Archiving:** Users CAN favorite archived links. If a favorite link is archived, it retains its favorite status. Users may want quick access to important historical campaigns.
- **Deletion:** If a link is soft-deleted, it MUST logically lose its favorite status (or be completely hidden from the Favorites filter).
- **Expiration:** Expired links remain favorites until manually unfavorited or deleted.

---

## 11. Business Rules
- A link is either favorited or not (binary state).
- Toggling is idempotent (toggling an already favorited link to 'true' returns success).

## 12. Domain Model Impact
- **Model:** `SmartLink`
- **New Field:** `isFavorite: boolean` (Default: `false`).

## 13. Favorite Workflow
1. User clicks the Star icon on a link row.
2. Frontend immediately toggles the Star visually (Optimistic Update).
3. Frontend fires `PATCH /api/v1/links/:id/favorite` with `{ isFavorite: true/false }`.
4. Backend updates the database.
5. On success, TanStack Query silently invalidates in the background to ensure sync. On error, the frontend reverts the optimistic state and shows a toast.

## 14. UX Design
- **Icon:** Use Lucide's `Star` icon.
- **Unfavorited State:** Outline star (`text-gray-400`, hover `text-yellow-400`).
- **Favorited State:** Filled star (`fill-yellow-400 text-yellow-400`).

## 15. Dashboard Behaviour
- Add a "Favorites Only" checkbox or toggle switch next to the "All Statuses" dropdown.
- When active, appends `&isFavorite=true` to the URL search params.

## 16. Quick Actions
- The favorite toggle sits permanently visible on the left side of the link alias or right side actions panel, eliminating the need to open a dropdown.

## 17. API Design
`PATCH /api/v1/links/:id/favorite`
- **Request Body:** `{ "isFavorite": boolean }`
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isFavorite": true
  }
}
```

## 18. Backend Design
- **Controller:** Add `toggleFavorite` to `editLink.controller.ts` OR a dedicated `favorite.controller.ts`. (Decision: Create a small `favorite.controller.ts` to keep endpoints cleanly separated by intent, avoiding bloated god-controllers).
- **Service:** `favorite.service.ts` to handle the update.
- **Repository:** Update `findManyPaginated` to accept an optional `isFavorite?: boolean` filter.

## 19. Frontend Design
- **Hook:** `useToggleFavorite.ts` (TanStack Query mutation with optimistic updates using `onMutate`).
- **Component:** `FavoriteButton.tsx` (a small, reusable icon button to isolate the optimistic UI logic).

## 20. Database Considerations
- `ALTER TABLE "SmartLink" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;`
- Add a composite index on `(userId, isFavorite)` in the future when scaling.

## 21. Validation Rules
- `isFavorite` must be a strict boolean.

## 22. Error Handling
- Revert optimistic UI on `500 Internal Server Error` or network failure.
- `404 Not Found` if the link doesn't exist.

## 23. Security Review
- IDOR check: Ensure the user actually owns the link before allowing them to toggle the favorite state.

## 24. Performance Review
- Filtering by `isFavorite=true` is highly selective and will speed up dashboard load times for power users compared to loading all links.

## 25. Scalability Review
- As noted in ADR-007, the boolean column approach scales perfectly for 1:1 user-link relationships. It will require a data migration to a junction table only when multi-user Workspaces are introduced.

## 26. Logging Strategy
- `[INFO] User {userId} toggled favorite state for Link {linkId} to {true|false}`.

## 27. Monitoring Strategy
- Standard API latency tracking on the `PATCH` endpoint.

## 28. Testing Strategy
- **Unit:** Test the DB update logic.
- **Integration:** Verify the `/favorite` endpoint correctly rejects invalid body types (e.g. strings instead of booleans).
- **E2E:** Click the star -> refresh page -> verify star remains filled.

## 29. Risks
- **Risk:** Optimistic UI updates getting out of sync with backend state.
  - *Mitigation:* Ensure TanStack Query's `onError` callback rolls back the cache to `previousLinks` snapshotted in `onMutate`.

## 30. ADRs
- **ADR-007: Boolean Column for Favorites (MVP)**
  - *Context:* Need to implement Favorites. Could use a JOIN table for future team support.
  - *Decision:* Use `isFavorite` boolean on `SmartLink` table.
  - *Consequences:* Achieves ultra-fast MVP delivery. Accrues minor technical debt that must be paid when Team Workspaces are built.

## 31. Open Questions
- Should Favoriting a link bump its "UpdatedAt" timestamp?
  - *Decision:* No. Favoriting is a metadata/organizational action, not a core link modification. We should avoid triggering "Updated" sorts just because a user starred an item.

## 32. Staff Engineer Review
- **Architecture:** The decision to avoid a JOIN table right now is correct based on YAGNI. The dedicated `FavoriteButton` component ensures the DashboardTable doesn't become overly complex with optimistic cache manipulation logic.
- **Approval:** Approved for Implementation.

---

## Implementation Readiness Checklist
- [x] Database schema defined (`isFavorite` boolean).
- [x] API contract designed.
- [x] UX (Optimistic UI) defined.
- [ ] Backend developer assigned.
- [ ] Frontend developer assigned.
