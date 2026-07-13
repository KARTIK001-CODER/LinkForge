# API Design - Analytics Platform

This document outlines the RESTful APIs required for the Analytics Platform.

## Base URL
`/api/v1/analytics`

## 1. Dashboard APIs (Aggregated Data)

### 1.1 Get Link Timeseries Metrics
Retrieves daily/hourly click counts for charting.
- **Endpoint**: `GET /links/{linkId}/timeseries`
- **Query Params**:
  - `start_date` (ISO8601)
  - `end_date` (ISO8601)
  - `granularity` (enum: hour, day, week, month)
- **Response**:
```json
{
  "data": [
    { "timestamp": "2026-07-01T00:00:00Z", "clicks": 150, "unique_visitors": 120 },
    { "timestamp": "2026-07-02T00:00:00Z", "clicks": 200, "unique_visitors": 180 }
  ]
}
```

### 1.2 Get Link Breakdown (Geo, Device, Referrer)
Retrieves aggregated top lists for specific dimensions.
- **Endpoint**: `GET /links/{linkId}/breakdown`
- **Query Params**:
  - `dimension` (enum: country, browser, os, device, referrer)
  - `limit` (default: 10)
- **Response**:
```json
{
  "dimension": "country",
  "data": [
    { "name": "United States", "code": "US", "clicks": 4500 },
    { "name": "United Kingdom", "code": "GB", "clicks": 1200 }
  ]
}
```

### 1.3 Get Link Summary Stats
Retrieves the high-level KPI cards.
- **Endpoint**: `GET /links/{linkId}/summary`
- **Response**:
```json
{
  "total_clicks": 15420,
  "unique_visitors": 12100,
  "top_referrer": "twitter.com",
  "top_country": "US"
}
```

## 2. Real-Time APIs

### 2.1 Real-Time Event Stream
Server-Sent Events (SSE) endpoint for live dashboard updates.
- **Endpoint**: `GET /links/{linkId}/realtime`
- **Response**: `text/event-stream`
- **Event Types**:
  - `click`: Fired when a new click occurs.
  - `summary_update`: Fired every X seconds with active visitor counts.

## 3. Export APIs

### 3.1 Request Export
Initiates a background job to generate a CSV export.
- **Endpoint**: `POST /exports`
- **Body**:
```json
{
  "link_id": "uuid",
  "format": "csv",
  "start_date": "2026-06-01",
  "end_date": "2026-07-01"
}
```
- **Response**: `202 Accepted`
```json
{
  "job_id": "uuid",
  "status": "PENDING"
}
```

### 3.2 Check Export Status
Poll to check if the export is ready.
- **Endpoint**: `GET /exports/{jobId}`
- **Response**:
```json
{
  "job_id": "uuid",
  "status": "COMPLETED",
  "download_url": "https://s3.aws.com/exports/123?sig=xyz"
}
```

## API Guidelines
- **Authentication**: All endpoints require a valid Bearer token.
- **Authorization**: The user must have read access to the Workspace owning the `link_id`.
- **Caching**: GET requests should leverage `Cache-Control` headers and Redis caching where appropriate.
