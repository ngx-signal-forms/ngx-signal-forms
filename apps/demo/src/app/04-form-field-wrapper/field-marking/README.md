# Field Marking demo

Interactive showcase of the toolkit's three field-marking modes and the
form-aware legend.

## What it demonstrates

- **`showMarkerWhen` modes** — `required`, `optional`, `none`, switchable live.
- **Configurable markers** — edit the required / optional marker text and watch
  every field and the legend update together (`{marker}` token substitution).
- **`NgxFormMarkingLegend`** — placed at the top of the form; mode-aware,
  form-aware (hides when no relevant field exists), and text-overridable.
- **All appearances** — markers render in `standard`, `outline`, and `plain`.
- The "make phone required" toggle changes the phone marker. Name/email remain
  required and Company/Bio remain optional, so this toggle does not hide either legend category.

## Manual test checklist

1. Default (`required` mode): required fields show `*`, legend reads
   "\* indicates a required field".
2. Switch to `optional`: optional fields show `(optional)`, legend explains it;
   required fields are unmarked.
3. Switch to `none`: no markers, no legend.
4. Edit the marker text: legend token updates in lockstep.
5. Toggle "make phone required" in `optional` mode: phone's `(optional)` marker
   disappears; in `required` mode it gains a `*`.
6. Change appearance to `outline` / `plain`: markers still render.
