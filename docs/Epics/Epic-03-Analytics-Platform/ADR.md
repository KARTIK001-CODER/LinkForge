# Architecture Decision Records (ADR) - Analytics Platform

This document captures the critical architectural decisions made for the LinkForge Analytics Platform.

## ADR 3.1: Analytics Pipeline
**Context**: The Redirect Engine must process redirects with minimal latency. We need to decide how to ingest analytics events generated during redirection.
**Options**:
1. Synchronous (Wait for DB insert before redirecting)
2. Asynchronous (Fire-and-forget in Node.js)
3. Queue-based (Push event to a message broker)
**Decision**: **Queue-based**
**Rationale**: Synchronous adds unacceptable latency to redirects. Fire-and-forget risks data loss if the server crashes. A Queue-based approach (using Redis Streams or RabbitMQ) ensures zero impact on redirect latency, provides durability, and allows horizontal scaling of analytics workers independent of the redirect engine.

## ADR 3.2: Event Storage
**Context**: We need to store millions of click events.
**Options**:
1. Relational tables (Standard PostgreSQL)
2. Append-only event tables (TimescaleDB / ClickHouse)
3. Hybrid (PostgreSQL for metadata, NoSQL/Columnar for events)
**Decision**: **Append-only event tables (PostgreSQL with Partitioning / TimescaleDB)**
**Rationale**: Standard relational tables will quickly bottleneck on massive inserts and complex analytical queries. By treating events as append-only and leveraging table partitioning (e.g., by month/day), PostgreSQL can handle scale efficiently. Using TimescaleDB (a Postgres extension) optimizes this further. It adheres to KISS by avoiding a completely separate database system like ClickHouse until absolutely necessary.

## ADR 3.3: Aggregation Strategy
**Context**: Dashboards require fast loading times, which is impossible if aggregating millions of rows on-the-fly.
**Options**:
1. On-demand aggregation
2. Precomputed aggregation (Cron jobs)
3. Materialized views
**Decision**: **Materialized Views with Continuous Aggregation**
**Rationale**: Materialized views offload the aggregation cost from the read query to the write/refresh phase. Using a continuous aggregation approach (native to TimescaleDB or managed via background workers) ensures dashboards query highly optimized, pre-aggregated tables (e.g., daily counts, country counts) resulting in sub-100ms response times.

## ADR 3.4: Real-Time Analytics
**Context**: The dashboard requires a real-time widget showing current active visitors and recent clicks.
**Options**:
1. Polling (Client fetches every X seconds)
2. Server-Sent Events (SSE)
3. WebSockets
**Decision**: **Server-Sent Events (SSE)**
**Rationale**: Analytics data flows strictly from Server to Client (unidirectional). WebSockets add unnecessary overhead for bi-directional communication we don't need. Polling is inefficient and doesn't feel "real-time". SSE is natively supported by HTTP/2, easy to scale, and perfectly fits unidirectional real-time event streaming.

## ADR 3.5: Visitor Identification
**Context**: We need to track unique vs. returning visitors without violating user privacy.
**Options**:
1. Cookies
2. Fingerprinting
3. Anonymous IDs (Hashed IP + User Agent)
**Decision**: **Anonymous IDs (Privacy-First Hashing)**
**Rationale**: Using cookies requires complex consent banners (GDPR/CCPA) which ruins the redirect experience. Fingerprinting is often blocked by modern browsers. Generating an Anonymous ID by hashing the IP address, User Agent, and a Daily Rotating Salt ensures we can track unique visitors per day/link without storing PII (Personally Identifiable Information).

## ADR 3.6: Geolocation Resolution
**Context**: We need to resolve IPs to Countries, Regions, and Cities.
**Options**:
1. External APIs
2. Local Databases (MaxMind)
3. CDN Headers (Cloudflare)
**Decision**: **CDN Headers with Local Database Fallback**
**Rationale**: External APIs introduce network latency and cost. If LinkForge is behind a CDN like Cloudflare, geolocation headers (`CF-IPCountry`) are provided for free with zero latency. For environments without CDN headers, we fallback to a local MaxMind GeoLite2 database loaded in memory/disk by the analytics workers.

## ADR 3.7: Retention Strategy
**Context**: Storing raw events forever will lead to infinite storage costs.
**Decision**:
- **Raw Events**: Retained for **90 days**. Used for granular debugging and recent raw exports.
- **Aggregated Metrics**: Retained **Forever**. (e.g., Daily clicks, browser rollups).
- **Visitor Sessions**: Retained for **30 days**.
**Rationale**: Granular raw data loses its value over time, but high-level trends (aggregated) are valuable indefinitely. This strategy aggressively manages database size while preserving business value.

## ADR 3.8: Export Strategy
**Context**: Users need to export large datasets of their analytics.
**Options**:
1. Synchronous Generation (CSV in memory)
2. Background Jobs with Streaming Downloads
**Decision**: **Background Jobs with Presigned URLs**
**Rationale**: Generating large CSVs synchronously will block the Node.js event loop and lead to timeouts. Exports will be pushed to a background queue, generated by a worker, uploaded to an object store (e.g., S3), and a notification (or UI update) will provide a secure, time-limited presigned URL to download the file.
