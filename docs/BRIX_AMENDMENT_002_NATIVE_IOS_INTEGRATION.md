# BRIX Amendment 002 - Native iOS Integration

## Purpose

BRIX is a mobile-first platform.

All core workflows must function on:

- Desktop
- Tablet
- Mobile Web
- Native iOS

Native iOS is not a separate product. Native iOS is another interface to the same BRIX platform.

## Module Parity

The following modules must be available on iOS:

- FindIQ
- DealIQ
- PipelineIQ
- OfferIQ
- PortfolioIQ

No module should require desktop-only functionality.

## Mobile-First Workflows

BRIX should optimize for real-world real estate usage.

Users often work:

- In vehicles
- At properties
- During showings
- During inspections
- During meetings
- While traveling

All major workflows should be executable from a phone.

## Property Capture

Native iOS should support:

- Camera Capture
- Gallery Upload
- Property Notes
- Voice Notes
- Document Upload

Document upload should support inspection reports, invoices, estimates, permits, and supporting documents.

## DealIQ Mobile Workflow

A user should be able to:

1. Find property in FindIQ.
2. Open DealIQ.
3. Review acquisition memo.
4. Add notes.
5. Upload photos.
6. Move deal through PipelineIQ.

from a mobile device.

## Shared Platform Rule

All business logic remains inside BRIX.

The iOS application should consume the same APIs, permissions, data models, and workflows as the web platform.

Avoid creating separate business logic for iOS unless required by platform capabilities.

## Future Capabilities

Architecture should support:

- Field inspections
- Property walk-throughs
- Voice-to-note capture
- Photo annotation
- GPS-tagged observations
- Offline data capture
- Push notifications

without requiring platform redesign.
