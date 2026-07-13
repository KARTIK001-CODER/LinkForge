# Architecture - Analytics Platform

This document outlines the system architecture for the LinkForge Analytics Platform.

## 1. High-Level Architecture

The Analytics Platform operates on a decoupled, event-driven architecture designed to ensure the Redirect Engine remains highly available and performant.

**Components**:
1. **Redirect Engine**: Produces lightweight click events.
2. **Message Broker (Redis Streams/Kafka)**: Buffers events to handle traffic spikes.
3. **Analytics Workers**: Consume events, enrich data (Geo, Device), and write to the database.
4. **Analytics Database (PostgreSQL/TimescaleDB)**: Stores raw events and aggregated metrics.
5. **Analytics API**: Serves data to the dashboard and handles export requests.
6. **Frontend Dashboard**: Visualizes data using modern charting libraries.

## 2. Frontend Architecture
- **Framework**: React / Next.js
- **State Management**: React Query (for caching and background fetching)
- **Charting**: Recharts or Chart.js (for performant, accessible SVG/Canvas rendering)
- **Real-Time**: Native `EventSource` API for Server-Sent Events (SSE).
- **Component Design**: Dumb presentation components (Charts, Tables, Cards) wrapped by smart container components that handle data fetching and filtering.

## 3. Backend Architecture
Following Clean Architecture principles:
- **Controllers**: Handle HTTP/REST parsing, input validation, and SSE connections.
- **Services (Use Cases)**: Contain business logic for fetching analytics, triggering exports, and filtering data.
- **Repositories**: Abstract database queries. Complex SQL for aggregations is encapsulated here.
- **Workers**: Standalone processes (or separate threads) dedicated to processing the event queue to prevent blocking the main API event loop.

## 4. Performance Strategy
- **Decoupled Writes**: Redirects never wait for analytics writes.
- **Caching**: Aggregated API responses are cached in Redis for 1-5 minutes depending on the metric to prevent DB overload during heavy dashboard usage.
- **Database Optimization**:
  - Partitioning on timestamp (monthly or weekly).
  - BRIN (Block Range Index) or B-Tree indexes on `(link_id, timestamp)`.
  - Materialized views for heavy calculations (e.g., Top Referrers of all time).
- **Pagination & Compression**: All list APIs use cursor-based pagination. All HTTP responses use Brotli/Gzip compression.

## 5. Scalability Strategy
- **Horizontal Scaling**: Analytics workers can be scaled independently of the API and Redirect Engine based on queue length.
- **Database Read Replicas**: If dashboard traffic spikes, read queries can be routed to PostgreSQL read replicas.
- **Stateless APIs**: The Analytics API is completely stateless, allowing effortless scaling behind a load balancer.

## 6. Security & Privacy Strategy
- **PII Avoidance**: IP addresses are never stored in plain text. They are hashed with a daily rotating salt to generate anonymous `visitor_id`s.
- **GDPR Compliance**: By not storing cookies and not storing raw IPs, the system heavily reduces compliance burden.
- **Rate Limiting**: Export and query endpoints are strictly rate-limited to prevent abuse and DDoS.
- **Authorization**: Users can only query analytics for links belonging to their `workspace_id`. Row-Level Security (RLS) or application-level tenant isolation is enforced on every query.
