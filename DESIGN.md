---
version: 2.0.0
name: Revolut-Design-System-SwiftPay
description: |
  Revolut 10 / Retail & Ultra design system specification for SwiftPay Merchant Dashboard.
  Combines true black canvas (#000000) with cobalt-violet (#494fdf),
  luminous elevated dark surfaces (#16181a), 1px hairline borders,
  and high-contrast tabular typography.

colors:
  canvas: "#000000"
  surface-elevated: "#16181a"
  surface-deep: "#0a0a0a"
  hairline: "rgba(255, 255, 255, 0.12)"
  hairline-subtle: "rgba(255, 255, 255, 0.06)"
  primary: "#494fdf"
  primary-bright: "#4f55f1"
  primary-deep: "#3a40c4"
  on-primary: "#ffffff"
  text-primary: "#ffffff"
  text-muted: "rgba(255, 255, 255, 0.60)"
  text-faint: "rgba(255, 255, 255, 0.40)"
  accent-green: "#00a87e"
  accent-danger: "#e23b4a"
  accent-warning: "#ec7e00"

rules:
  - id: R1-SURFACE-HIERARCHY
    rule: "True black #000000 background for canvas, #16181a for elevated cards, #0a0a0a for inset tiles, 1px borders with rgba(255, 255, 255, 0.12)."
  - id: R2-TYPOGRAPHY-TABULAR
    rule: "All financial amounts and rates must use tabular monospace numbers (font-mono tabular-nums). Labels must be strictly neutral (text-white/50)."
  - id: R3-PILL-ACTIONS
    rule: "Primary action must be a solid white rounded-full pill with black text (button-primary). Secondary actions use dark outline pills with 1px border."
  - id: R4-ICONOGRAPHY-SQUIRCLES
    rule: "All icons must have a geometric 1.75px stroke with rounded caps, housed in rounded-2xl or rounded-xl squircles with subtle 15% opacity backgrounds."
  - id: R5-NO-GENERIC-MOCK-COPY
    rule: "Use strict, professional financial terminology (Taxa de Conversão, Volume Bruto, Faturamento Líquido, Índice de Chargeback). No generic placeholder phrases."
  - id: R6-MINIMALIST-COBALT-CHARTS
    rule: "Charts must feature smooth Cobalt Violet gradients (#494fdf to transparent) with 2.5px curves, zero heavy Cartesian gridlines, and floating dark glass HUD tooltips."
  - id: R7-SEMANTIC-COLOR-DISCIPLINE
    rule: "Alert colors (red, amber, green) activate strictly on real events (> 0). Zero values are rendered in neutral clean white."
---
