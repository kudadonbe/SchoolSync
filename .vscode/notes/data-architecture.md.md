# Data Architecture

This document explains how data is structured, accessed, cached, and managed within the SchoolSync app.

## Overview

- Original data is stored in Firebase.
- All runtime data is managed by Pinia stores.
- IndexedDB is used as a persistent cache layer.
- Services abstract the source of truth.

## Data Flow

1. Component or Pinia action requests data.
2. Data provider first checks IndexedDB.
3. If not found or outdated, fetch from Firebase.
4. Save result to IndexedDB.
5. Store result in Pinia state.

## Layer Responsibilities

### Firebase (source)

- Main database for dynamic and structured data.

### IndexedDB (cache)

- Stores previously fetched data.
- Used to reduce network calls and support offline access.

### Services

- Handle fetching from Firebase and IndexedDB.
- Encapsulate logic to determine where data comes from.

### Pinia Store

- Holds all in-app data for reactivity.
- Accesses services, and acts as the source of truth for the UI.

## Example: Loading Staff List

- Store calls `getStaffList()` from provider.
- Provider checks IndexedDB, returns if available.
- If not, fetches from Firebase, stores in both IndexedDB and Pinia.

## TODO / Future Improvements

- Add cache invalidation strategy.
- Migrate to real backend (e.g., Express + MongoDB).
- Abstract service layer to support multiple backends.
