# Database Design - Analytics Platform

This document defines the schema, partitioning, and aggregation strategies for the Analytics Platform.

## 1. Domain Model

### 1.1 `AnalyticsEvent` (Raw Events)
Stores individual click events. This is an append-only table.
- `id` (UUID, Primary Key)
- `link_id` (UUID, Indexed)
- `workspace_id` (UUID, Indexed for tenant isolation)
- `timestamp` (Timestamp, Indexed)
- `visitor_id` (String/Hash - Anonymized)
- `country` (String - e.g., 'US')
- `city` (String)
- `browser` (String - e.g., 'Chrome')
- `os` (String - e.g., 'iOS')
- `device_type` (Enum - Desktop, Mobile, Tablet)
- `referrer` (String)
- `utm_source`, `utm_medium`, `utm_campaign` (Strings)

### 1.2 `AggregatedMetrics` (Materialized Views / Rollups)
To ensure fast dashboard load times, we pre-calculate metrics.

**Table: `daily_link_metrics`**
- `date` (Date)
- `link_id` (UUID)
- `total_clicks` (Int)
- `unique_visitors` (Int)

**Table: `link_referrer_metrics`**
- `link_id` (UUID)
- `referrer_domain` (String)
- `clicks` (Int)

**Table: `link_geo_metrics`**
- `link_id` (UUID)
- `country` (String)
- `clicks` (Int)

### 1.3 `ExportJobs`
Tracks asynchronous data export requests.
- `id` (UUID)
- `user_id` (UUID)
- `workspace_id` (UUID)
- `status` (Enum - PENDING, PROCESSING, COMPLETED, FAILED)
- `file_url` (String - Nullable, S3 presigned URL)
- `created_at` (Timestamp)
- `expires_at` (Timestamp)

## 2. Partitioning Strategy
The `AnalyticsEvent` table will grow massive quickly.
- **Partition Key**: `timestamp`
- **Interval**: Monthly (e.g., `analytics_events_2026_07`)
- **Benefit**: Dropping old data (Retention policy) is as simple as `DROP TABLE analytics_events_2023_01`, avoiding expensive `DELETE` operations and vacuuming.

## 3. Indexes
- **Event Table**: 
  - Composite Index: `(link_id, timestamp)` - Critical for time-series queries on specific links.
  - Composite Index: `(workspace_id, timestamp)` - For workspace-level aggregations.
- **Aggregated Tables**:
  - Primary Key: `(link_id, date)` or `(link_id, dimension)`.

## 4. Retention Policy Enforcement
- **Raw Events**: A background cron job runs nightly to detach and drop partitions older than 90 days.
- **Aggregated Metrics**: Kept indefinitely.

## 5. Future Scalability
If PostgreSQL limits are reached (e.g., billions of rows causing disk I/O bottlenecks even with partitioning), the architecture supports migrating the `AnalyticsEvent` table to **ClickHouse**, a columnar OLAP database perfectly suited for this workload, while keeping `ExportJobs` and Link metadata in PostgreSQL.
