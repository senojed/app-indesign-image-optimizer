# InDesign Image Optimizer

A Windows ExtendScript utility that optimizes linked raster images in Adobe InDesign through Photoshop and BridgeTalk. Each placed occurrence gets its own layered PSD, with verified backups and checks that preserve its physical placement.

[Česká dokumentace](README.cs.md) · [Architecture](docs/ARCHITECTURE.md) · [Testing](docs/TESTING.md)

## Requirements

- Windows with Adobe InDesign and Photoshop supporting ExtendScript/JSX.
- Verified in InDesign **21.6.0.57** and Photoshop **27.11.0**. Other versions and macOS have not been validated.
- A saved INDD document, available linked originals and enough disk space for backups, working copies and output PSDs.
- Photoshop color policies for RGB, CMYK and Gray set to **Preserve Embedded Profiles** in **Edit → Color Settings**.

No plugin, Node.js or third-party library is needed to use the script. Processing is local; files stay beside the INDD. Any cloud synchronization of that folder remains governed by your sync application.

## Installation

1. Download and extract the release ZIP, or download this repository.
2. In InDesign, open **Window → Utilities → Scripts**.
3. Right-click **User** and select **Reveal in Explorer**.
4. Copy the complete `InDesignImageOptimizer` folder into **Scripts Panel**. Keep both entry scripts and the entire `lib` folder together. Copying a JSX file alone will cause a missing-include error.
5. Open and save your InDesign document. Start Photoshop.
6. Double-click **InDesignImageOptimizer.en.jsx** for English or **InDesignImageOptimizer.jsx** for Czech.

```text
Scripts Panel/
  InDesignImageOptimizer/
    InDesignImageOptimizer.en.jsx
    InDesignImageOptimizer.jsx
    lib/
      core.jsxinc
      indesign.jsxinc
      photoshop.jsxinc
      ui.jsxinc
      en/
        core.jsxinc
        indesign.jsxinc
        photoshop.jsxinc
        ui.jsxinc
```

## Quick start

1. Set **Max. effective PPI** (default **430**) and choose the entire document or selected images/frames/groups.
2. Leave **No action** selected for resolution optimization alone. If Photoshop is running, action sets load automatically before the dialog opens. **Load Photoshop actions** refreshes the list; exact names can also be entered manually.
3. Optional: choose a verified Photoshop action. Close other Photoshop documents before using an action. Actions must not save, open or close documents, call external scripts, or change dimensions/resolution. Actions are not sandboxed.
4. Click **Preview**. Review the planned files, effective PPI on both axes and skipped objects. Changing a setting invalidates the preview.
5. Click **Start**. Keep the document and source files unchanged during processing.
6. Review the report and **save the INDD manually**. Compare exported PDFs before production use.

The script never upscales. Its factor is `min(1, limit / max(PPIx, PPIy))`; the lower axis can therefore fall below the limit. Every eligible occurrence is converted to PSD, even when it needs no downsampling. Pixel rounding may require slightly different horizontal/vertical compensation to preserve physical size. InDesign scale percentages change; placement and dimensions are checked at **0.01 pt** tolerance.

## Outputs and backups

```text
layout.indd
Links/
  photo_001.psd
  photo_001.psd.iio
backup/
  iio-<run-id>/
    document-before.indd
    source-001/photo.jpg
    work-001/...
    journal.jsonl
    report.json
```

- Original files are processed through working copies. Each unique source is backed up once per batch and compared byte for byte.
- Each occurrence gets a unique filename. Existing files are never overwritten.
- Output markers and object labels prevent repeated processing. Do not remove them to rerun a completed output.
- Working and verification files are retained for recovery, so disk usage can exceed the output size.
- The INDD backup includes the document state at batch start, including unsaved edits, but retains original link paths.
- Reports contain full local paths. Review them before sharing.

## Cancellation and recovery

**Cancel** stops at a safe boundary; it cannot interrupt a Photoshop command already executing. While waiting for Photoshop, cancellation allows up to ten more seconds for acknowledgement. Without acknowledgement the batch reports an uncertain state and retains `.iio-active`. This limit does not cover synchronous InDesign commands or file copies.

Completed items remain relinked after cancellation. A failed relink attempts to restore the original link and geometry. A failed rollback or uncertain worker state stops the batch.

If `.iio-active` remains:

1. Check Photoshop for an action or dialog still running. Let the operation finish or safely stop Photoshop after saving your other work.
2. Review the journal, worker `done.json` and INDD backup. Restore original files from backups if they were deleted.
3. Only after the worker is no longer running, remove `.iio-active` manually and rerun. Interrupted items are not resumed automatically.

Keep a separate copy of the current document when investigating a failed rollback. Temporary outputs and failed-item PSDs are retained rather than deleted automatically.

## Optional deletion of originals

Disabled by default. After a fully successful batch, the script can offer a second confirmation listing eligible originals directly inside the document's `Links` folder. It rechecks backups, output copies, successful occurrences and references in all open InDesign documents. Confirmation saves the INDD before deletion.

References in **closed documents cannot be detected**. Confirm deletion only after checking their use elsewhere. External sources, aliases, vectors, incomplete sources and remaining references are excluded. Leave deletion off when working with filesystem redirection or concurrent changes.

## Limitations

- Supported extensions: PSD, PSB, TIFF, JPEG, PNG, BMP, GIF and TGA, provided InDesign exposes the object as a raster `Image` and Photoshop can save it as PSD.
- Embedded, missing and outdated links are skipped. PDFs/vectors, anchored images, locked objects/layers/parents, text wrap, clipping paths and PSD layer visibility overrides are skipped.
- Frame cropping, alpha transparency, rotations, shears, flips and Auto-Fit are checked. Geometry verification does not prove identical rendered pixels.
- The script does not flatten. A user action can flatten or repaint while keeping dimensions unchanged; such changes cannot be generally detected.
- Photoshop actions and plugins may show dialogs despite `DialogModes.NO`. A timeout does not terminate them.
- No atomic transaction exists across both Adobe applications and the filesystem. Keep backups and inspect output before print delivery.

## Development

Node.js is required only for development. Czech sources in `lib/` are canonical; `locales/en.json` translates user-facing text. Generated English modules live in `lib/en/`.

```powershell
node scripts/build-english.cjs
node scripts/build-english.cjs --check
node tests/core.test.cjs
node tests/worker.test.cjs
node tests/bridge.test.cjs
node tests/ui.test.cjs
node tests/english.test.cjs
powershell -ExecutionPolicy Bypass -File tests/run-adobe.ps1
powershell -ExecutionPolicy Bypass -File tests/run-adobe.ps1 -Script adobe-safety.jsx
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

Adobe integration tests create disposable fixtures under `tests/artifacts`. Run them with no blocking dialogs in Adobe applications. They do not process your open production documents. The package script refuses to overwrite an existing ZIP.

An optional [GitHub Actions template](docs/github-actions-tests.yml) is included; setup instructions are in Testing.

See [Testing](docs/TESTING.md), [Architecture](docs/ARCHITECTURE.md), [API notes](docs/API.md) and [Contributing](CONTRIBUTING.md).

## License

No open-source license has been selected yet. Public repository visibility alone does not grant permission to redistribute or modify the code beyond applicable platform terms and law.
