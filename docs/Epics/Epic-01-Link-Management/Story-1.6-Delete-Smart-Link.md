# Feature Design Document: Delete Smart Link

## 1. Executive Summary
The Delete Smart Link feature (Story 1.6) allows users to permanently remove a Smart Link from their active workspace. Deletion is irreversible from the user's perspective. This document outlines the technical approach (Soft Deletion) to maintain historical analytics integrity while ensuring the link immediately stops routing traffic and disappears from all user interfaces.

## 2. Feature Overview
Users will be able to delete a link via the LinkForge dashboard. A strict confirmation dialog will prevent accidental deletions. Once deleted, the link's alias will be freed up (or permanently reserved, based on business rules), traffic to the link will return a 410 Gone/404 Not Found, and the link will be stripped from all active dashboards.

## 3. Problem Statement
Currently, users can Archive links (Story 1.5), which hides them but keeps them routing traffic. However, users often make mistakes, create test links, or want to completely terminate a campaign, ensuring no further traffic is routed and the link is permanently removed from their view. Without a Delete function, workspaces become cluttered with junk data that cannot be purged.

## 4. Business Goals
- Provide users complete control over their data lifecycle.
- Prevent accidental data loss through rigorous UX guardrails.
- Maintain referential integrity for aggregate workspace analytics.
- Establish a pattern for GDPR/CCPA compliance (Right to be Forgotten).

## 5. Success Metrics
- **Error Rate:** 0 accidental deletions reported to customer support (measured via confirmation UX success).
- **Performance:** Deletion API responds in < 100ms.
- **System Stability:** No broken queries or 500 errors caused by cascading referential integrity failures.

## 6. Product Vision
LinkForge respects user intent. When a user says "delete," the link stops working instantly. However, as an enterprise platform, we must protect the system's analytical integrity behind the scenes.

## 7. User Personas
- **Marketing Manager:** Wants to delete test links created during campaign setup before the actual campaign launches.
- **Content Creator:** Made a typo in the alias and wants to delete the link entirely to start over.

## 8. User Stories
- As a user, I want to delete a Smart Link permanently so it stops routing traffic and disappears from my workspace.
- As a user, I want to be warned before deleting a link so I don't accidentally lose my data.
- As a system administrator, I want deleted links to retain their historical analytics data so overall workspace metrics (e.g., "Total Clicks this Month") remain accurate.

## 9. Functional Requirements
- API endpoint `DELETE /api/v1/links/:id`.
- Deleted links MUST immediately stop routing traffic (return 410/404).
- Deleted links MUST NOT appear in the dashboard (Active or Archived views).
- Analytics metrics for the deleted link MUST be preserved in aggregate reporting.
- A confirmation dialog must force the user to type "DELETE" or check a box to confirm intent.

## 10. Non-Functional Requirements
- **Performance:** Deleting a link must be an $O(1)$ operation (no massive cascading deletes blocking the DB).
- **Auditability:** The deletion event must be logged with the user ID and timestamp.

---

## Important Product Decisions

### 1. Hard Delete vs Soft Delete
**Comparison:**
- **Hard Delete:** Physically removes the `SmartLink` row and cascades to all related `Click` analytics. 
  - *Pros:* Reclaims disk space, absolute data destruction.
  - *Cons:* Destroys historical aggregate metrics. Heavy database locks during cascading deletes of millions of clicks.
- **Soft Delete:** Updates the link's `status` to `DELETED`.
  - *Pros:* Fast $O(1)$ update. Preserves referential integrity for analytics. Easily recoverable by admins in case of catastrophic user error.
  - *Cons:* Requires all `SELECT` queries to filter `status != 'DELETED'`.

**Recommendation:** **Soft Delete.** We will use the `DELETED` state in the existing status state machine. It solves the performance bottleneck of cascading deletes and preserves aggregate analytics. A background cron job can run a true Hard Delete on links that have been Soft Deleted for > 30 days if strict GDPR compliance is required.

### 2. Analytics Retention
**Trade-offs:**
- Deleting analytics skews historical monthly reports (e.g., last month you had 10k clicks, you delete the link, now your report says you had 0 clicks).
- Retaining analytics but soft-deleting the link ensures aggregate data is accurate.

**Recommendation:** **Retain analytics.** Because we are using Soft Deletion, the `Click` records remain safely attached to the `SmartLink` record. The frontend will simply exclude `DELETED` links from the specific "Link Details" views, but global workspace metric queries will still SUM all clicks.

### 3. Shared URLs
**UX Problem:** What happens when a user clicks a deleted link found in an old email?
**Recommendation:** The routing engine will intercept links with `status === 'DELETED'` and return a standard **410 Gone** HTTP status code (or a user-friendly 404 HTML page). A 410 is SEO-optimal as it tells search engine crawlers the deletion is permanent and to remove the URL from their index.

---

## 11. Deletion Workflow
1. User clicks "Delete" on a link in the dashboard.
2. A critical warning modal appears requiring explicit confirmation (e.g., typing the alias).
3. Frontend calls `DELETE /api/v1/links/:id`.
4. Backend verifies ownership (IDOR).
5. Backend updates `status` to `DELETED`.
6. Frontend invalidates cache and removes the link from the UI.
7. Future routing requests for that alias return a 410 Gone.

## 12. Business Rules
- **Irreversibility:** Once deleted via the UI, the user cannot restore the link. (Unlike Archive).
- **Alias Reusability:** When a link is soft-deleted, its alias remains in the database. To allow the user to reuse the alias, we must either append a timestamp to the soft-deleted alias (e.g., `alias_deleted_16234`) or allow the unique constraint to ignore `DELETED` links. 
  - *Decision:* Append a unique suffix to the alias upon deletion so the original string is freed up for immediate reuse.

## 13. Domain Impact
- **Link Status:** Utilizes the `DELETED` enum value defined in Story 1.5.

## 14. API Design
`DELETE /api/v1/links/:id`
- **Request:** Empty body.
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Link deleted successfully"
}
```

## 15. UX Design
- Action resides in the "More Actions" (three dots) dropdown menu.
- Highlighted in Red to indicate destructive action.
- Toast notification upon successful deletion: "Link permanently deleted."

## 16. Confirmation Dialog Design
- **Title:** Delete Smart Link?
- **Body:** "This action is irreversible. The link will immediately stop working, but historical aggregate analytics will be preserved."
- **Input:** "Type **{alias}** to confirm."
- **Buttons:** "Cancel" (Default), "Delete Permanently" (Red, disabled until input matches).

## 17. Backend Design
- **Controller:** `deleteLink.controller.ts`
- **Service:** `deleteLink.service.ts`
  - Fetch link by ID.
  - Verify state != DELETED.
  - Update `status` to `DELETED` and modify `alias` to `${alias}_deleted_${Date.now()}` to free up the namespace.

## 18. Frontend Design
- **Hook:** `useDeleteLink.ts` (TanStack Query mutation).
- **Component:** `DeleteLinkModal.tsx` managing the typing confirmation state.

## 19. Database Considerations
- `alias` unique constraint requires us to mangle the alias during soft-delete so the user can create a new link with the exact same alias later.
- Example update: `UPDATE SmartLink SET status = 'DELETED', alias = CONCAT(alias, '_del_', EXTRACT(EPOCH FROM NOW())) WHERE id = $1;`

## 20. Validation Rules
- Cannot delete a link that is already `DELETED`.
- User MUST own the link (IDOR protection).

## 21. Error Handling
- `404 Not Found`: Link doesn't exist or is already deleted.
- `403 Forbidden`: Unauthorized to delete.

## 22. Security Review
- Destructive actions require CSRF protection and strict IDOR checks.
- Rate limiting should be applied to the DELETE endpoint to prevent malicious wiping of a compromised account.

## 23. Performance Review
- Soft delete is a primary-key indexed `UPDATE` statement. Performance is negligible (< 10ms).

## 24. Scalability Review
- Soft deletion scales perfectly as it avoids cascading locks on the analytics tables.

## 25. Logging Strategy
- Log payload: `[WARN] Link {id} ({alias}) permanently soft-deleted by User {userId}.`

## 26. Monitoring Strategy
- Monitor HTTP 410 rates on the routing engine. A massive spike could indicate an accidental bulk-delete event.

## 27. Testing Strategy
- **Unit:** Mock the DB and ensure the `alias` string is correctly mangled with the deletion suffix.
- **Integration:** Create a link -> Delete it -> Attempt to create a new link with the same alias (Should succeed).
- **E2E:** End-to-end flow of typing the confirmation string and verifying UI removal.

## 28. Risks
- **Risk:** Mangling the alias might break internal references if not handled carefully.
  - *Mitigation:* We strictly rely on UUIDs (`id`) for internal foreign keys, so modifying the string `alias` is perfectly safe.

## 29. ADRs
- **ADR-006: Soft Deletion via Alias Mangling**
  - *Context:* We need to soft-delete links to preserve analytics, but users expect to be able to immediately recreate a link with a deleted alias.
  - *Decision:* When soft-deleting, the system will append a unique suffix (`_del_timestamp`) to the alias column.
  - *Consequences:* Satisfies the unique constraint, frees the original alias, and retains the DB row.

## 30. Open Questions
- Should we implement a "Trash" bin that holds deleted links for 30 days before mangling the alias? 
  - *Answer for MVP:* No. KISS. Immediate irreversible deletion with mangling is sufficient for now.

## 31. Staff Engineer Review
- **Architecture:** Soft Deletion + Alias Mangling (ADR-006) is an elegant, production-grade solution to the classic "Unique Constraint vs Soft Delete" problem. It ensures high performance while satisfying user expectations.
- **Approval:** Approved for Implementation.

---

## Implementation Readiness Checklist
- [x] Deletion mechanism chosen (Soft Delete).
- [x] Analytics retention policy defined.
- [x] Alias reuse strategy defined.
- [x] UX and Confirmation dialog specified.
- [ ] Backend developer assigned.
- [ ] Frontend developer assigned.
