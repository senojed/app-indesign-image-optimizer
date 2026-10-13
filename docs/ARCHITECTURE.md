# Architecture

The InDesign host builds a plan from the saved active document. It records both effective PPI axes, frame/image corners, paths, effects, fitting state and original references. Unsupported objects are reported with reasons.

Before processing it saves a copy of the INDD and creates one byte-for-byte verified backup per unique source. Each occurrence uses a separate working copy and receives a separate PSD.

A BridgeTalk message carries the application's own source code, URI-encoded to preserve Windows backslashes. Parameters use escaped JSON. Responses use a restricted ES3 JSON parser, never `eval` on the response.

The Photoshop worker checks color policies, opens the working copy, duplicates it, downsamples, optionally runs a trusted action, saves a layered PSD and reopens it to verify dimensions, resolution, profile, color mode, bit depth and layer count. Untagged files are saved without embedding a working profile. A completion receipt is written after document cleanup and preference restoration.

The host accepts a valid BridgeTalk result or a complete worker receipt. An uncertain timeout stops the batch and retains its lock. Cancellation uses a file checked between worker commands; it cannot interrupt a synchronous Photoshop command.

## Geometry

`factor = min(1, limit / max(PPIx, PPIy))`. Dimensions round down to whole pixels. Native resolution metadata stays unchanged, so InDesign scale percentages must increase after downsampling to keep physical size.

An affine correction is `basis(original corners) × inverse(basis(new corners))`, applied in pasteboard coordinates about `[0,0]`. Corners are resolved through inner coordinates to account for rotation, shear and flips. Relinking may replace the Image object, so the host reacquires it from the original frame.

Auto-Fit is restored **before** the final correction: restoring it afterwards would fit the image again and invalidate the correction. Verification checks all four image/frame corners, paths, frame matrix, parent identity, effects, clipping, rendering intent and fitting state. Geometry tolerance is 0.01 pt.

If verification fails, rollback explicitly relinks the original, restores Auto-Fit, corrects geometry and restores the object label. It verifies the restored state. `app.undo()` is not used as the recovery mechanism inside the outer script.

## Boundaries

Actions are not sandboxed. Their arbitrary filesystem or external-script effects cannot be contained. The script rejects changed dimensions/resolution/document identity and requires other Photoshop documents to be closed when using an action.

Deletion is a separate opt-in phase after full success. It verifies sources, backups, outputs and open-document references again, saves the INDD and requires explicit user consent. Closed-document references cannot be checked.

Both languages share markers, journal schema and machine status values (`uspech`, `chyba`) for compatibility. English reports translate the displayed status. Generated English code must never be edited independently; regenerate from `lib/` and `locales/en.json`.
