# LINKFORGE — FEATURE DESIGN DOCUMENT

## 1. Executive Summary
This document outlines the design and architectural strategy for Redirect Error Pages (Story 2.4). It establishes a branded, unified, and user-friendly experience for end-users who encounter broken, expired, inactive, or disabled Smart Links. By replacing generic browser error pages with well-designed public error states, LinkForge enhances the professionalism of its platform while providing clear guidance to end-users and actionable analytics to link creators.

## 2. Feature Overview
Redirect Error Pages are public-facing HTML pages served when the Redirect Engine cannot successfully route a request to a destination URL. These pages are designed to be standalone, lightweight, and independent of the core authenticated dashboard, ensuring high availability and fast render times.

## 3. Problem Statement
When a Smart Link fails to resolve (due to expiration, deletion, or invalidity), returning a raw HTTP 404 or a generic unbranded server error creates a jarring and untrustworthy experience for the end-user. Additionally, failing to provide proper HTTP semantics (e.g., 410 vs 404) harms SEO and client-side caching. Link creators also lose visibility into traffic hitting broken links if these events are not gracefully handled and logged.

## 4. Product Goals
- Provide a seamless, trustworthy experience for end-users encountering broken links.
- Standardize the error response structure across the entire Redirect Engine.
- Establish the foundation for tracking failed redirect attempts in Analytics (Epic 3).
- Implement correct HTTP semantic status codes to benefit SEO and bot indexing.

## 5. Success Metrics
- **Performance**: Public error pages must render in < 100ms.
- **Availability**: Error pages must be highly available (99.99%) even if the primary database is degraded.
- **UX**: 0% reliance on default Express/Nginx generic error pages.

## 6. User Journey
1. User clicks a LinkForge Smart Link (e.g., `linkforge.io/xyz`).
2. The Redirect Engine processes the request.
3. The engine determines the link cannot be routed (Not Found, Expired, Inactive, etc.).
4. The user is presented with a branded error page explaining the specific reason (if safe to disclose) or a generic "Not Found" message.
5. The user is offered a clear Call to Action (CTA) to navigate to the LinkForge homepage.

## 7. Error Classification

| Error Type | Trigger Condition | Status Code | End-User Message |
| :--- | :--- | :--- | :--- |
| **Not Found** | Link alias does not exist in DB | 404 Not Found | "Page Not Found" |
| **Expired** | `now() > expiresAt` | 410 Gone | "Link Expired" |
| **Inactive** | `now() < startsAt` or Status = `DISABLED` | 404 Not Found | "Link Inactive" |
| **Server Error** | Database failure or unhandled exception | 500 Internal Server | "Temporary Service Disruption" |

## 8. UX Design
### Wireframe: Standard Error Page Layout

```text
+---------------------------------------------------------+
|                                                         |
|                                                         |
|                     [ ICON ]                            |
|                                                         |
|               Headline (e.g. Link Expired)              |
|                                                         |
|        Supporting Text (e.g. This link has passed       |
|      its expiration date and is no longer accessible.)  |
|                                                         |
|                                                         |
|                [ Return to LinkForge ]                  |
|                                                         |
|                                                         |
|                                                         |
|                   Powered by LinkForge                  |
+---------------------------------------------------------+
```

## 9. Information Architecture
The error pages will be distinct routes on the frontend application:
- `/error/not-found`
- `/error/expired`
- `/error/inactive`
- `/error/500`

All pages will share a common `PublicErrorLayout` wrapper to ensure branding consistency.

## 10. Error Page Content Strategy
- **Tone**: Professional, helpful, and concise.
- **Branding**: Subtle. A small "Powered by LinkForge" footer. We will *not* display the original target URL or the creator's metadata to prevent data leakage and social engineering.
- **Actions**: A single, prominent CTA redirecting to the LinkForge marketing homepage.

## 11. Functional Requirements
- The Redirect Engine must route invalid requests to the correct error page.
- The error pages must clearly state the nature of the error (Expired vs Not Found).
- The error pages must be fully responsive (mobile, tablet, desktop).
- The system must capture the failed redirect attempt for analytics.

## 12. Non Functional Requirements
- **Performance**: The frontend error pages must be statically cacheable where possible.
- **Independence**: Error pages must not require authentication or heavy API calls to render.

## 13. Business Rules
- **Data Privacy**: Error pages must never reveal the intended destination URL of a broken link.
- **HTTP Semantics**: To support bots (Googlebot, Twitter card scrapers), the backend must ideally return the correct HTTP status code, even if redirecting. (See ADR 2).

## 14. API Integration
The Redirect API does not require a new endpoint. However, the existing GET `/:alias` endpoint must standardize its failure modes. If the `Accept` header is `application/json`, it should return a JSON error. If it is `text/html` (browser), it should handle the routing to the error page.

## 15. Backend Responsibilities
- Accurately determine the failure state (`NOT_FOUND`, `EXPIRED`, `INACTIVE`, `SERVER_ERROR`).
- Log the failed redirect event asynchronously.
- Issue a 302 Redirect to the appropriate frontend `/error/*` path. *(Note: While a direct 404 render from the backend is better for SEO, a 302 to a frontend route is acceptable for V1 to maintain decoupled architecture).*

## 16. Frontend Responsibilities
- Provide the `/error/*` routes.
- Render lightweight, branded UI components (using TailwindCSS and Lucide Icons).
- Ensure strict accessibility standards are met on these pages.

## 17. Accessibility Review
- All error pages must have a descriptive `<title>` tag (e.g., `Link Expired - LinkForge`).
- Icons must have `aria-hidden="true"` or appropriate `aria-label`s.
- Color contrast ratios for text and buttons must meet WCAG AA standards (minimum 4.5:1).

## 18. Security Review
- Prevent Reflected XSS: Do not blindly render the requested alias string on the error page without strict HTML escaping.
- Avoid Information Disclosure: Treat `DISABLED` and `INACTIVE` links similarly to `NOT_FOUND` to prevent attackers from enumerating active vs inactive campaigns.

## 19. Performance Review
- Error pages on the frontend should not fetch heavy contexts (like `AuthContext` or `SocketContext`) if they don't need them.
- Ensure the React components are lazy-loaded or minimal in bundle size.

## 20. Scalability Strategy
- Since error pages are static UI, they can be heavily cached by a CDN (Cloudflare/Cloudfront) in a production environment.

## 21. Logging Strategy
- The Redirect Engine must log all failed resolutions with the status `NOT_FOUND`, `EXPIRED`, or `INACTIVE`.
- Logs must include the timestamp, user-agent, IP address (hashed/anonymized), and the requested alias.
- This data feeds directly into Epic 3 (Analytics).

## 22. Monitoring Strategy
- Track the metric `redirect_errors_total` grouped by error type.
- Set up alerts for a sudden spike in 500 Server Errors during redirect resolution.

## 23. Testing Strategy
- **E2E Tests**: Request a non-existent link and verify the user lands on `/error/not-found`.
- **E2E Tests**: Request an expired link and verify the user lands on `/error/expired`.
- **Unit Tests**: Ensure the UI components render correctly without crashing.

## 24. Risks
- **SEO Impact**: Returning a 302 to an error page instead of a direct 404/410 can confuse search engine crawlers. Mitigation: We accept this tradeoff for V1 to keep the frontend completely decoupled from the backend.
- **Brand Confusion**: Users might confuse LinkForge with the brand of the link creator. Mitigation: Subtle branding and clear "Powered by" text.

## 25. ADRs

### ADR 1: Error Page Strategy
- **Decision:** Separate routed components (e.g., `/error/expired`, `/error/not-found`) wrapped in a shared layout.
- **Rationale:** Keeps the frontend routing clean and allows specific hardcoded messaging per error type without complex conditional logic in a single component.

### ADR 2: Status Code Strategy
- **Decision:** Backend will issue a 302 redirect to the frontend error pages for V1.
- **Rationale:** While returning a 404/410 directly from the API with an HTML payload is semantically purer, it breaks the strict API/Frontend decoupling. We will use 302s to route the user to the React app's error states.

### ADR 3: Analytics Logging for Errors
- **Decision:** Log all failed redirects.
- **Rationale:** Essential for Epic 3. Link creators need to know if they are losing traffic to broken or expired links.

## 26. Open Questions
- Should enterprise users be able to customize the styling/branding of these error pages? (Recommendation: Defer to a future "Custom Domains & Branding" Epic).

## 27. Staff Engineer Review
- [x] UX strategy is sound and minimizes user frustration.
- [x] Security considerations (preventing info disclosure) are properly addressed.
- [x] Decoupled architecture is maintained.

## Implementation Readiness Checklist
- [x] FDD Reviewed and Approved.
- [ ] Shared `PublicErrorLayout` component created.
- [ ] Individual error page components refined.
- [ ] Backend logging updated to capture failed states for Analytics.
