# Advanced Wizard E2E Test Plan

## Overview

This test plan covers the "Travel Booking Wizard" feature, a multi-step form with complex cross-field and cross-step validation logic. The goal is to ensure data integrity, correct validation behavior, and successful submission flow.

## Scenarios

### 1. Happy Path: Complete Booking Flow

**Goal**: Verify a user can successfully complete all steps with valid data.

**Steps**:

1.  **Navigate** to `/advanced-scenarios/advanced-wizard`.
2.  **Step 1 (Traveler)**:
    - Fill First Name, Last Name, Email, Passport Number, Nationality.
    - Set Passport Expiry to a far future date (e.g., 2030).
    - Click **Next**.
3.  **Step 2 (Trip)**:
    - Fill Destination 1: Country (Japan), City (Tokyo).
    - Set Dates: Arrival (2026-08-01), Departure (2026-08-10).
    - Fill Activity 1: Name (Sushi Making), Date (2026-08-02), Requirement (Empty Stomach).
    - Click **Next**.
4.  **Step 3 (Review)**:
    - Verify Heading "Review Your Booking" is visible.
    - Verify summary contains Traveler Name ("John Doe"), Destination ("Japan"), and Activity ("Sushi Making").
    - Click **Confirm Booking**.
5.  **Result**:
    - Submission logic executes (Store updates/Mock API call).
    - Step completes without error.

---

### 2. Cross-Step Validation: Passport Validity

**Goal**: Ensure the system prevents booking if the passport expires earlier than 6 months after the trip ends.

**Pre-condition**: Steps 1 and 2 are partially filled/completed (or navigated back to).

**Steps**:

1.  **Navigate** to Step 2 (Trip Details).
2.  **Set Trip Date**: Departure = `2026-08-10`.
3.  **Navigate** back to Step 1 (Traveler Info) using the **Previous** button.
4.  **Set Passport Expiry**: `2026-12-01` (Less than 6 months after Aug 2026).
5.  **Validation Check**:
    - Verify Error Message appears: "Passport must be valid 6 months after trip ends".
6.  **Correction**:
    - Set Passport Expiry: `2027-03-01` (More than 6 months after).
7.  **Resolution**:
    - Verify Error Message disappears.

---

### 3. Intra-Step Validation: Trip Dates

**Goal**: Verify destination arrival/departure date logic.

**Steps**:

1.  **Navigate** to Step 2 (Trip Details).
2.  **Set Arrival Date**: `2026-05-10`.
3.  **Set Departure Date**: `2026-05-01` (Before Arrival).
4.  **Validation Check**:
    - Verify Error Message: "Departure date must be after arrival date".
5.  **Correction**:
    - Set Departure Date: `2026-05-20`.
6.  **Resolution**:
    - Verify Error Message disappears.

### 4. Activity Date Validation (Automated Check)

**Goal**: Verify activity details.

- Check that Activity Date must be within Destination Arrival/Departure range. (Implicitly covered by schema, explicit test recommended if UI shows specific error).

## Automation Status

- **Status**: Implemented ✅
- **File**: `apps/demo-e2e/src/forms/05-advanced/advanced-wizard.spec.ts`
- **Framework**: Playwright + TypeScript
