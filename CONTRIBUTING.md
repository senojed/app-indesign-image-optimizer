# Contributing

Keep runtime code compatible with ES3 ExtendScript. Do not introduce runtime Node dependencies. Edit the Czech sources under `lib/`, add English strings to `locales/en.json` and run `node scripts/build-english.cjs`.

Run all Node tests listed in the README. Host-specific changes need Adobe fixture validation as well. Do not relax geometry or backup checks to make a failing case pass. Include evidence for rollback and cancellation changes.

Bug reports should include Windows/Adobe versions, script language, settings, the failing step and a redacted report. Do not upload production INDD/images, private paths or credentials without reviewing them. Use synthetic fixtures where possible.

No license has been selected. Agree on permission with the repository owner before contributing third-party code or using this project beyond rights already granted by law/platform terms.
