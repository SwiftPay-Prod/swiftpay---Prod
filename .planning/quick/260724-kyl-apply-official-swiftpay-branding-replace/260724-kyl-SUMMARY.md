# Quick Task 260724-kyl: Apply Official SwiftPay Branding

## Summary
Applied official SwiftPay branding assets to the system.

## Changes
1. **Logo**: Cropped official "Swift pay 2D logo.png" (removed transparent padding, 1439x1607, ratio 0.8955) → replaced `swiftpay-logo.png`
2. **Favicon**: Generated 32x32 favicon from new logo → replaced `favicon.png`
3. **Colors**: Updated `globals.css`:
   - `--success`: `#171717` → `#50A06C` (light) / `#83C49B` (dark)
   - Added `--brand` / `--brand-soft` with green accent values
   - Registered `--color-brand` / `--color-brand-soft` in `@theme`
4. **Logo component**: Updated `LOGO_ASPECT_RATIO` from `725/750` to `1439/1607`

## Design Approach
- **Verde como Accent**: System remains monochromatic, green appears only in:
  - Logo (already has green built into the icon)
  - Success badges/status (`--success` = green)
  - Hover/accent icons via `--brand` color
- All 100+ existing `text-success`/`bg-success` usages now use green via CSS variables

status: complete