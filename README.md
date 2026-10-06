# Socio-O-Thon Participant QR Website

This is a single-domain prototype.

## Routes

- `/` — participant dashboard with QR codes
- `/p/SOT001` — participant SOT001
- `/p/SOT002` — participant SOT002
- `/p/SOT003` — participant SOT003
- `/p/SOT004` — participant SOT004
- `/p/SOT005` — participant SOT005

## Important

The current version uses browser localStorage for participant/checklist data. This is suitable for a prototype on one device, but NOT for a multi-device event system.

For real deployment, replace localStorage with a database/backend so all organizers/devices share the same status.

## Adding participants

The example "Add participant" button adds another participant in the browser. For a real event, participant records should be stored in a database or loaded from an admin system.

## Deployment

Deploy all files under one domain. Your server must route `/p/<ID>` to `participant.html` (or use equivalent SPA/server rewrite rules).
