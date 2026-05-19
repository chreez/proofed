---
id: DRAFT-116
title: /sales — mobile-fast 1-tap record path
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - sales
  - mobile
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap. At a real market, hands are flour-covered, phone is one-handed. Current `/sales` "New Sale" flow requires modal → cart builder → complete. Too slow for the common case "one customer, one item."

The cart builder stays for multi-item sales; this draft adds a fast-path for the dominant pattern.

## Scope
- `/sales` active-session view gains a per-recipe row (visible at all times when active session is open) with a large "+1" button (44px+).
- Tapping "+1" records a single-item transaction at the current `unitPrice` and flashes a 3-second "Sale: $X · undo" banner.
- Rapid "+1" taps within 5 seconds on the same recipe coalesce into a single transaction (debounced) — avoids transaction-spam.
- "Undo last sale" deletes the most recent transaction; available for 10s after each record.
- Existing "Build sale" (cart) button still present for multi-item / discount cases.
- Mobile-first layout: row order, button sizing, thumb target sizes match touch ergonomics.

## Proposed ACs
1. Active session view shows a per-recipe row with thumb + name + +1 button at minimum 44×44px touch target.
2. Single tap creates a transaction with one TransactionItem (units=1, unitPrice=current snapshot price).
3. Taps within 5s on the same recipe append to the in-flight transaction (debounced commit at 5s of inactivity).
4. Toast/banner shows "Sale: $X · Undo" for 10s post-record; clicking Undo deletes the transaction.
5. Cart-style "Build sale" button preserved for multi-item flows.
6. ≥10 new tests covering debounce window, undo, multi-recipe rapid taps.
7. Snapshot test for the mobile fast-path row.
<!-- SECTION:DESCRIPTION:END -->
