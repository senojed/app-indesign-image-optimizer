# Adobe API notes

This is an ExtendScript/JSX project, not a UXP plugin. The code uses the InDesign DOM, Photoshop DOM, Action Manager, BridgeTalk, File/Folder and ScriptUI APIs.

## InDesign

`Document.allGraphics`, linked `Image` objects, `effectivePpi`, `resolve`, `transform`, `transformValuesOf`, `frameFittingOptions`, `itemLink.relink/update`, `saveACopy`, labels and transparency settings support the plan, geometry checks and recovery.

The host groups each relink through `app.doScript` with `UndoModes.ENTIRE_SCRIPT`. Recovery uses explicit original relinking and geometry compensation rather than relying on Undo.

## Photoshop

The worker uses `app.open`, `Document.duplicate`, `resizeImage` with bicubic resampling, `app.doAction`, layered `PhotoshopSaveOptions`, `saveAs`, reopen verification and `close(SaveOptions.DONOTSAVECHANGES)`.

Profile types use `ColorProfile`, including `ColorProfile.NONE`. Embedding is disabled for untagged documents to avoid assigning the working profile.

Action sets are enumerated with Action Manager IDs `ASet`, `Actn`, `Nm  ` and `NmbC`. Color policies read `colorSettings`, `policyRGB`, `policyCMYK`, `policyGray` and `preserve`. These keys were verified in the tested Photoshop version; failure is treated conservatively. Manual action names remain available because Action Manager behavior is not a universal compatibility guarantee.

## References

- [Adobe Photoshop scripting](https://helpx.adobe.com/photoshop/using/scripting.html)
- [Adobe InDesign scripting](https://helpx.adobe.com/indesign/using/scripting.html)
- The bundled Adobe `ContactSheetII.jsx` provides an Action Manager enumeration example.

UXP documentation is not used as a substitute for the traditional JSX API. Consult the application's bundled scripting references and validate actual host behavior when adding compatibility claims.
