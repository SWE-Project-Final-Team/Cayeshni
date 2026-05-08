---
name: Financial Precision
colors:
  surface: '#fbf9fa'
  surface-dim: '#dbd9db'
  surface-bright: '#fbf9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#efedef'
  surface-container-high: '#e9e7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1c1d'
  on-surface-variant: '#44474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f2'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6073'
  primary: '#041627'
  on-primary: '#ffffff'
  primary-container: '#1a2b3c'
  on-primary-container: '#8192a7'
  inverse-primary: '#b7c8de'
  secondary: '#0453cd'
  on-secondary: '#ffffff'
  secondary-container: '#356ee7'
  on-secondary-container: '#fefcff'
  tertiary: '#211200'
  on-tertiary: '#ffffff'
  tertiary-container: '#38260b'
  on-tertiary-container: '#a88c69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fb'
  primary-fixed-dim: '#b7c8de'
  on-primary-fixed: '#0b1d2d'
  on-primary-fixed-variant: '#38485a'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b2c5ff'
  on-secondary-fixed: '#001848'
  on-secondary-fixed-variant: '#0040a2'
  tertiary-fixed: '#feddb5'
  tertiary-fixed-dim: '#e1c29b'
  on-tertiary-fixed: '#281802'
  on-tertiary-fixed-variant: '#584326'
  background: '#fbf9fa'
  on-background: '#1b1c1d'
  surface-variant: '#e4e2e3'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  financial-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style
The design system is engineered to project absolute reliability and institutional stability while maintaining the agility of a modern fintech platform. The brand personality is grounded, methodical, and transparent, catering to users who manage complex group finances and require immediate clarity on debt and settlement statuses.

The visual style follows a **Corporate / Modern** approach. It leverages a disciplined application of whitespace to reduce cognitive load during financial reconciliation. By combining minimalist aesthetics with functional density, the system ensures that high-value data points—such as balances and transaction histories—are prioritized without visual clutter. The emotional goal is to move the user from a state of financial uncertainty to one of collaborative confidence.

## Colors
The palette is rooted in **Deep Navy** and **Trust Blue** to establish a foundation of professional authority. The background uses a specific cool-toned **Light Gray** (#F4F5F7) to differentiate surfaces from the pure white cards containing data.

Functional colors are critical for the group settlement feature set:
- **Sage Green** is utilized for "Paid" and "Success" states, indicating a resolved balance.
- **Coral** is reserved for "Owed" or "Danger" states to create urgent visual salience for debts.
- **Amber** signals "Warning" or "Pending Actions" that require user attention.
- **Trust Blue** identifies "Approved" or active primary actions.
- **Slate Gray** handles "Pending" or neutral historical data.

## Typography
This design system employs a dual-font strategy. **Manrope** is used for headlines to provide a modern, refined geometric feel that looks premium in a financial context. **Inter** is used for all body text and financial values due to its exceptional legibility at small sizes and its neutral, systematic utilitarianism.

A specialized "Financial" type tier is defined for account balances. These use tighter letter spacing and heavier weights to ensure that currency amounts are the most prominent elements on any screen. Label styles are set in uppercase with increased tracking to clearly categorize data fields without competing with the data itself.

## Layout & Spacing
The system utilizes a **12-column fixed grid** for desktop and a fluid single-column layout for mobile. A strict 4px soft-grid base ensures all components and margins are multiples of 4 or 8, creating a predictable visual rhythm.

Generous padding (24px) is mandated for cards containing complex settlement tables to prevent visual "cramping." Data-heavy views should use a "Compact" vertical spacing model (8px between rows) to allow for maximum information density while maintaining a clear scan-line.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Ambient Shadows**. The background layer resides at the lowest elevation. Interactive cards and containers sit on the secondary tier, using a subtle, diffused shadow (Offset: 0 2px, Blur: 8px, Color: #1A2B3C at 5% opacity).

Modals and pop-overs occupy the highest tier, utilizing a more pronounced shadow with a wider spread to focus user attention. Borders are used in conjunction with shadows: a 1px solid border (#EBECF0) provides definition, while the shadow provides the "lift." This hybrid approach ensures components remain distinct even on lower-quality displays.

## Shapes
The design system adopts a **Rounded** shape language to soften the serious nature of financial data and make the interface feel more approachable and modern. 

Standard components like input fields and buttons use a **0.5rem (8px)** radius. Larger containers, such as dashboard cards and settlement summaries, use a **1rem (16px)** radius to create a clear structural hierarchy. Interactive elements should never be sharp, as rounded corners guide the eye more effectively to the content within the container.

## Components
- **Buttons:** Primary buttons use the Trust Blue background with white text. Secondary buttons use a Deep Navy outline with no fill. All buttons feature 8px rounded corners and a subtle hover state that deepens the shadow.
- **Status Chips:** Small, pill-shaped indicators used for settlement states. 
    - *Owed:* Coral background (10% opacity) with Coral text.
    - *Paid:* Sage Green background (10% opacity) with Sage Green text.
    - *Pending:* Light Gray background with Slate text.
- **Input Fields:** 1px border (#D1D5DB), 8px radius. On focus, the border transitions to Trust Blue with a 2px outer glow (halo).
- **Cards:** White background, 16px radius, subtle 1px border, and level-1 shadow. Used for grouping transactions or member balances.
- **Settlement Progress Bar:** A thin horizontal bar showing the ratio of "Paid" vs. "Owed" within a group, using Sage Green and Coral segments respectively.
- **Data Tables:** Row-based layout with 1px bottom borders. Every second row uses a very subtle gray tint (#F9FAFB) to assist eye-tracking across financial columns.