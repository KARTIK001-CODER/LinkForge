# FEATURE DESIGN DOCUMENT: Smart Links Dashboard (Story 1.2)

## 1. Executive Summary
The Smart Links Dashboard is the core interface where LinkForge users manage, organize, and monitor the links they have created. It provides a highly responsive, data-rich table view supporting pagination, advanced filtering, searching, and sorting to ensure users can effortlessly navigate thousands of smart links.

## 2. Problem Statement
Users currently have the ability to create smart links (Story 1.1), but lack a centralized hub to view their portfolio of links. Without a dashboard, users cannot retrieve previously created aliases, check the status of links (Active/Expired), or easily manage their tags and destination URLs.

## 3. Product Goals
- Provide a robust, highly performant data table to view all created Smart Links.
- Enable lightning-fast discovery through search and advanced filtering (e.g., by tags or status).
- Establish a scalable UI pattern for future analytics and bulk-action integrations.

## 4. Success Metrics
- **Time to Interactive (TTI):** Dashboard loads and is interactive in < 1 second.
- **Search Latency:** Debounced search queries return results in < 300ms.
- **Task Success Rate:** 99% of users can successfully locate a specific link using search/filters.

## 5. User Personas
- **Marketers:** Need to quickly find campaign links (often filtering by tags like "Q4" or "Twitter").
- **Operations:** Need to check if a link has expired or requires a password update.

## 6. User Stories
- As a user, I want to see a list of all my smart links so that I can copy or manage them.
- As a user, I want to search for a link by its alias or destination URL to find it quickly.
- As a user, I want to filter my links by tags and status to organize my active campaigns.
- As a user, I want to sort my links by creation date to easily find the most recent ones.

## 7. Functional Requirements
- Display a paginated data table of Smart Links.
- Display columns: Alias, Destination URL, Tags, Status, Security (Password icon), Expiration, Created At.
- Provide a global search bar (searches Alias and Destination URL).
- Provide filter dropdowns for Status (`ACTIVE`, `EXPIRED`, `DISABLED`) and Tags.
- Provide column header sorting (e.g., sort by Created At descending/ascending).
- Provide a "Copy" button for each link to quickly copy the short URL.

## 8. Non-Functional Requirements
- **Performance:** Table must not jank or freeze while rendering 50+ rows per page.
- **Accessibility:** Fully keyboard navigable and screen-reader friendly (ARIA labels on icons/actions).
- **Responsiveness:** Usable on mobile (hiding non-essential columns on small screens).

## 9. Business Rules
- Links with a past `expiresAt` date should be visually distinguished (and their status computed/rendered as "EXPIRED" if applicable).
- The default sort order must be `createdAt` DESC (newest first).
- Default pagination size is 20 items per page.

## 10. Smart Links Dashboard UX
- **Layout:** Full-width container. Top action bar contains the Search Input, Filter Dropdowns, and a primary "Create Link" CTA.
- **Data Table:** Clean, modern, edge-to-edge row design with hover states.
- **Micro-interactions:** Tooltips for truncated destination URLs and tag overflow.

## 11. Table Design
- **Alias:** Rendered as a clickable link (or paired with a quick-copy icon).
- **Destination:** Truncated at 40 chars with a tooltip.
- **Tags:** Rendered as pill/badge components (max 3 visible, +N indicator).
- **Status:** Badge (Green = Active, Red = Expired, Gray = Disabled).
- **Created At:** Formatted locally (e.g., "Oct 12, 2024").
- **Actions:** Context menu (...) for Edit/Delete (future stories).

## 12. Pagination Design
- Server-side cursor-based or offset-based pagination. (We will use **offset-based** `page` and `limit` for UX simplicity, allowing users to jump to specific pages).
- Footer controls: Previous, Next, Page X of Y, and rows-per-page selector (10, 20, 50).

## 13. Sorting Design
- Server-side sorting.
- Sortable columns: `createdAt`, `alias`.
- UI: Clickable column headers with up/down caret icons indicating sort direction.

## 14. Filtering Design
- Server-side filtering.
- **Status Filter:** Multi-select dropdown (Active, Expired).
- **Tags Filter:** Searchable multi-select dropdown or text input.
- Active filters should render as removable chips above the table.

## 15. Search Design
- Single text input in the top action bar.
- Debounced by 500ms before triggering API call.
- Uses `ILIKE` (PostgreSQL) or similar for partial matching on `alias` and `destinationUrl`.

## 16. Empty State
- Rendered when the user has 0 links.
- Illustration/Icon with friendly copy: "You haven't forged any links yet."
- Primary CTA: "Create your first Smart Link".

## 17. Error State
- Rendered if the API fails to fetch data.
- Friendly error message with a "Retry" button.
- Preserves the outer dashboard shell (doesn't crash the whole app).

## 18. Loading State
- Skeleton loaders mirroring the table structure (5-10 rows of shimmering gray blocks).
- Displayed on initial load and during major filter/search transitions to prevent layout shift.

## 19. Responsive Behaviour
- **Mobile (< 768px):** Hide 'Destination', 'Tags', and 'Created At'. Show only 'Alias', 'Status', and an expand icon to view details.
- **Tablet (768px - 1024px):** Hide 'Created At' and 'Tags'.
- **Desktop (> 1024px):** Show all columns.

## 20. API Design
**GET /api/v1/links**
Query Parameters:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)
- `status` (string, optional)
- `tags` (string, comma-separated, optional)
- `sortBy` (string, default: "createdAt")
- `sortOrder` ("asc" | "desc", default: "desc")

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "alias": "my-campaign",
        "destinationUrl": "https://example.com/...",
        "hasPassword": true,
        "expiresAt": null,
        "status": "ACTIVE",
        "tags": ["promo"],
        "createdAt": "2024-05-01T12:00:00Z"
      }
    ],
    "meta": {
      "totalItems": 150,
      "itemCount": 20,
      "itemsPerPage": 20,
      "totalPages": 8,
      "currentPage": 1
    }
  }
}
```

## 21. Backend Design
- **Controller:** Extracts and validates query parameters using Zod.
- **Service:** Translates validated parameters into Prisma queries.
- **Repository:** Executes `prisma.smartLink.findMany()` and `prisma.smartLink.count()` in a `$transaction` to ensure total count and item data are consistent. 
- *Assumption:* `hasPassword` is computed in the Service layer based on `passwordHash !== null`. Password hashes are NEVER returned to the frontend.

## 22. Frontend Design
- Utilize `@tanstack/react-query` for data fetching (`useQuery`).
- Implement query key structure: `['links', { page, limit, search, status, tags, sort }]` to leverage automatic caching and refetching.
- UI Components: `DashboardView`, `LinksTable`, `TablePagination`, `TableFilters`.
- State Management: URL search params (`react-router-dom` `useSearchParams`) to store filter/pagination state, ensuring the dashboard is deeply linkable.

## 23. Database Considerations
- Indexes are required to maintain performance as data grows.
- **Required Indexes:**
  - `@@index([createdAt(sort: Desc)])` for default sorting.
  - *Note:* PostgreSQL handles `ILIKE` scans well on small datasets, but a GiST or GIN index with `pg_trgm` may be required later if search latency degrades.

## 24. Validation Rules
- `page`: Must be integer > 0.
- `limit`: Must be integer > 0 and <= 100.
- `sortOrder`: Must be exactly "asc" or "desc".
- `sortBy`: Must be one of the allowed column names (`alias`, `createdAt`).

## 25. Security Review
- **Data Exposure:** Ensure `passwordHash` is explicitly excluded from the Prisma select object.
- **SQL Injection:** Mitigated entirely by using Prisma ORM.

## 26. Performance Review
- The use of `count()` alongside `findMany()` can be slow on massive tables (>1M rows). Since this is a user dashboard, the total dataset is scoped, so standard count is acceptable. 

## 27. Scalability
- If the dataset grows massively, offset-based pagination (`skip`, `take`) becomes slower.
- *Recommendation:* Stick to offset pagination for now (up to ~10,000 links is perfectly fine). Transition to cursor-based pagination if needed in a future Epic.

## 28. Logging
- Log slow queries (> 500ms) in the repository layer.
- Log instances of invalid query parameter requests as `WARN`.

## 29. Monitoring
- APM tracing on the `GET /api/v1/links` endpoint to monitor average latency.
- Monitor ratio of searches to total page loads to understand user behavior.

## 30. Testing Strategy
- **Backend (Integration):** Insert 50 mock links. Test pagination boundaries (page 1, page 3). Test search partial matching. Test tags array filtering.
- **Frontend (Component):** Test debounced search input behavior. Test that clicking a column header updates the URL search params.

## 31. Risks
- Highly concurrent queries with `ILIKE` on unindexed columns could bottleneck the database.
- *Mitigation:* Ensure pagination limits (max 100) are strictly enforced by Zod.

## 32. ADRs (Architecture Decision Records)
- **ADR-002: URL State Management**
  - *Decision:* Use URL Search Params for dashboard state (page, search, filters) instead of React Context / local state.
  - *Justification:* Allows users to refresh the page or share the URL without losing their current dashboard view.

## 33. Open Questions
- *Question:* Should tags filtering be an `AND` operation or an `OR` operation? (e.g. filtering for "promo", "q4" — must the link have both, or either?)
  - *Assumption:* We will use `AND` to allow users to narrow down specific campaigns.

## 34. Staff Engineer Review
The design is robust and follows modern SaaS standards. Using React Query combined with URL-driven state provides the best user experience and simplifies state management. Prisma's JSON querying capabilities (`array_contains`) will easily handle the tags filtering.

---

## Implementation Readiness Checklist
- [ ] Database indexes reviewed and updated in `schema.prisma`.
- [ ] Backend pagination and search schema validated.
- [ ] Backend integration tests written for data retrieval.
- [ ] Frontend URL state management hook implemented.
- [ ] Frontend Table and Skeleton components built.
- [ ] End-to-end flow verified locally.
