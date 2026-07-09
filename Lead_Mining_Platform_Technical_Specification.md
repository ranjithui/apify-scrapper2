# Lead Mining Platform (LMP)

## Technical Specification v1.0

## Overview

The Lead Mining Platform (LMP) is a modular, provider-agnostic lead
generation platform designed to collect business leads from multiple
sources without depending on a single Apify actor. The system supports
interchangeable actor plugins, automatic failover, normalized data
output, and future expansion to non-Apify providers.

## Goals

-   Avoid dependency on any single Apify actor.
-   Allow actors to be replaced without code changes.
-   Normalize data from different sources.
-   Support free Apify initially and paid plans later.
-   Build an extensible architecture for enterprise use.

------------------------------------------------------------------------

# High-Level Architecture

``` text
                 User
                  │
            Web Dashboard
                  │
            Backend API
                  │
      ┌────────────────────────┐
      │ Search Engine          │
      │ Actor Manager          │
      │ Job Queue              │
      │ Lead Processor         │
      │ Export Service         │
      └────────────────────────┘
                  │
        Provider Abstraction Layer
                  │
      ┌───────────┼────────────┐
      │           │            │
    Apify     Playwright   Custom API
      │
   Actor Plugins
      │
Apollo | LinkedIn | Google Maps | Website | Others
                  │
            Normalized Leads
                  │
             Supabase (PostgreSQL)
```

------------------------------------------------------------------------

# Technology Stack

  Layer            Technology
  ---------------- -------------------------------------
  Frontend         Next.js / React
  Backend          Node.js (NestJS/Express) or FastAPI
  Database         Supabase PostgreSQL
  Authentication   Supabase Auth
  Storage          Supabase Storage
  Queue            BullMQ + Redis (Phase 2)
  Scraping         Apify Platform API
  Deployment       Docker

------------------------------------------------------------------------

# Core Modules

## Authentication

-   Login
-   Logout
-   Password Reset
-   Role-Based Access

Roles: - Admin - Manager - Operator - Viewer

## Project Management

-   Create Projects
-   Assign Owners
-   Store Search History
-   Export Results

## Search Engine

Supported search parameters: - Keyword - Industry - Country - City -
Employee Count - Revenue - Technologies - Company Name - Website -
LinkedIn URL

## Provider Layer

The system communicates only with providers.

Supported providers: - Apify - Playwright (Future) - Custom Python
Scrapers - REST APIs

## Actor Registry

Each source may have multiple interchangeable actors.

Example:

  Source   Actor     Priority   Status
  -------- --------- ---------- ----------
  Apollo   Actor A   1          Active
  Apollo   Actor B   2          Standby
  Apollo   Actor C   3          Disabled

If the active actor fails, the next priority actor is selected
automatically.

## Input Mapper

Converts a generic search request into the JSON schema required by the
selected actor.

## Output Mapper

Maps different actor outputs into a standard lead schema.

Normalized Lead:

-   First Name
-   Last Name
-   Title
-   Company
-   Email
-   Phone
-   Website
-   LinkedIn
-   Industry
-   Country
-   Employee Count
-   Revenue
-   Source
-   Provider
-   Actor
-   Confidence Score

## Job Queue

Job lifecycle:

1.  Queued
2.  Running
3.  Completed
4.  Failed
5.  Retried

## Lead Processing

-   Remove duplicates
-   Normalize company names
-   Clean emails
-   Clean phone numbers
-   Standardize countries
-   AI enrichment (future)

## Export

Supported formats: - CSV - Excel - JSON - Google Sheets - CRM API
(future)

------------------------------------------------------------------------

# Supabase Database

## Tables

-   users
-   projects
-   providers
-   adapters
-   actors
-   search_requests
-   jobs
-   job_logs
-   leads
-   lead_duplicates
-   actor_health
-   actor_mapping
-   exports
-   settings

------------------------------------------------------------------------

# REST API

  Method   Endpoint
  -------- --------------
  POST     /login
  POST     /projects
  GET      /projects
  POST     /search
  GET      /jobs
  GET      /actors
  POST     /actors
  PUT      /actors/{id}
  DELETE   /actors/{id}
  POST     /actors/test
  POST     /export
  GET      /dashboard

------------------------------------------------------------------------

# Project Structure

``` text
lead-miner/
├── frontend/
├── backend/
├── database/
├── config/
├── docker/
└── docs/
```

------------------------------------------------------------------------

# Phase Roadmap

## Phase 1 (MVP)

-   Supabase integration
-   Authentication
-   Apify provider
-   Actor registry
-   Manual actor switching
-   CSV export
-   Dashboard

## Phase 2

-   Automatic failover
-   Health monitoring
-   Scheduling
-   Retry logic
-   Notifications

## Phase 3

-   Multiple providers
-   AI actor selection
-   CRM integrations
-   Cost analytics
-   Team collaboration
-   Enterprise deployment

------------------------------------------------------------------------

# Design Principles

1.  Provider-agnostic architecture.
2.  Actor plug-in model.
3.  Centralized lead normalization.
4.  Secure backend-managed API keys.
5.  Modular and scalable design.
6.  Easy migration from Apify free to paid plans.
