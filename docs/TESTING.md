# Testing and validation

## Automated tests

| Test | Coverage |
| --- | --- |
| `core.test.cjs` | ES3 parsing, PPI factors, pixel rounding, affine math, JSON and deletion predicates |
| `worker.test.cjs` | Photoshop worker control flow with a mock host; not an Adobe integration test |
| `bridge.test.cjs` | Cancellation deadline, worker receipt fallback, partial receipt, callback and timeout |
| `ui.test.cjs` | Fresh dialogs, state retention, preview invalidation, modal boundaries, Close/Escape and running-only action preload |
| `english.test.cjs` | Generated files, English UI regression and localized worker/BridgeTalk behavior |

A GitHub Actions template is provided in `github-actions-tests.yml`. To enable it, copy the file to `.github/workflows/tests.yml` using a GitHub login with workflow permission. The initial publication token cannot upload workflow files. The template runs the Node tests and packaging; it does not have Adobe applications installed.

## Native validation history

Previously verified on Windows with InDesign 21.6.0.57 and Photoshop 27.11.0:

- Layered PSD occurrences with rotation, shear, flips, transparency and no upscaling.
- JPEG, TIFF and untagged PNG profile preservation; selected/locked-frame behavior and some effects.
- Forced relink rollback, verified backups, cancellation and deletion of synthetic originals only.
- Unicode filenames, identical basenames from different folders and existing output collisions.
- Native ScriptUI control construction and real action-set enumeration. This construction test does not prove actual modal interaction.
- Auto-Fit regression with odd dimensions (1201×803 px) and transform variants.
- A production-document copy reproduced 16 geometry failures before the Auto-Fit ordering fix. Afterwards all 39 eligible relinks passed at the original 0.01 pt tolerance. The user subsequently confirmed that the images were processed successfully.

Production files and raw reports are excluded from the repository. Native tests were performed during development; new automated checks do not imply they were rerun for every text-only change. English strings are checked with the same mock control-flow suite; native English UI rendering still needs manual verification.

## Manual release check

1. Install the complete package and open each language entry point.
2. Confirm 430 PPI, action preload when Photoshop is running and manual refresh.
3. Check Preview, Close, Escape, selection scope and preview invalidation.
4. Run the native fixture tests with no Adobe dialogs active.
5. Test a trusted action on a copy, cancel during processing and inspect the report/lock.
6. Compare exported PDFs before and after, including effects, transparency and color.

Photoshop actions are never considered generally safe based on mock tests. Pixel rendering and print color require visual review.
