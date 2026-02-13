# Design Document: DocuMate

## 1. Brand Identity & Philosophy

**Theme:** "Dark Mode Professional."
**Visual Keywords:** Immutable, Transparent, Glowing, Glassmorphic, Trustworthy.
**Core Concept:** A deep, dark void (the immutable blockchain) illuminated by vibrant gradients (active transactions and reputation).

## 2. Color Palette

The design relies on a strict dark theme with high-contrast neon gradients to guide user attention.

### 2.1. Backgrounds (The Void)

* **Canvas Base:** `bg-gray-950` (`#030712`) - The main background color.
* **Surface Layer:** `bg-gray-800/50` - Used for cards and panels, often with opacity.
* **Border:** `border-gray-700/50` or `border-gray-800` - Subtle separation lines.

### 2.2. Primary Gradients (The Energy)

Used for primary actions, buttons, and hero text.

* **"DocuMate Gradient":** `from-pink-500 to-purple-600`.
* *Usage:* "Get Started" buttons, Logo background, Active state indicators.


* **"Text Gradient":** `from-pink-400 via-purple-400 to-blue-400`.
* *Usage:* Headlines, Logo text.



### 2.3. Functional Colors (The Ecosystem)

Specific colors are assigned to specific blockchain pillars to create visual distinction:

* **Emerald (Green-500):** KILT Protocol / Identity.
* **Pink (Pink-500):** Asset Hub / Marketplace.
* **Blue (Blue-500):** Phala Network / AI Privacy.
* **Purple (Purple-500):** POC-1 Standard / Reputation.

## 3. Typography

* **Font Family:** Geist (Sans & Mono).
* **Styles:**
* **Headings:** Bold, often with `bg-clip-text text-transparent` (Gradient Text).
* **Body:** `text-gray-400` for description text (reduces eye strain compared to pure white).
* **Code/Data:** `font-mono` (Geist Mono) used for displaying hashes, DID addresses, and JSON snippets.



## 4. UI Component Library

### 4.1. Buttons

* **Primary Action:**
* *Style:* Gradient background (`from-pink-500 to-purple-600`), White text, `rounded-xl`.
* *Effect:* `shadow-lg shadow-pink-500/25` (Glow effect), Hover scales or brightens.


* **Secondary Action:**
* *Style:* `bg-gray-800`, `border border-gray-700`, `text-white`.
* *Effect:* Hover `bg-gray-700`.



### 4.2. Cards & Containers (Glassmorphism)

* **Standard Card:**
* *Background:* `bg-gradient-to-br from-gray-800/50 to-gray-900/50`.
* *Border:* `border border-gray-700/50`.
* *Radius:* `rounded-2xl`.
* *Hover State:* Border color shifts to the accent color (e.g., `hover:border-pink-500/30`) to indicate interactivity.


* **Preview Card (Marketplace):**
* Includes a visual header area (`bg-gradient-to-br from-gray-700/50 to-gray-800/50`) with a centered icon.



### 4.3. Navigation

* **Top Bar:** Sticky positioning with `backdrop-blur-xl` and `bg-gray-950/80`. This creates a "frosted glass" effect over the scrolling content.
* **Mobile Drawer:** Uses a custom `animate-slide-in-right` keyframe for smooth entrance.

### 4.4. Inputs & Forms

* *Style:* `bg-gray-800`, `border-gray-700`, `text-white`, `rounded-xl`.
* *Focus State:* `focus:border-pink-500` and `focus:outline-none`.

## 5. Visual Effects & Motion

### 5.1. Background Ambience

* **Orbs/Blobs:** The design uses large, blurred circles (`rounded-full blur-3xl`) positioned absolutely in the background to create depth.
* *Animation:* `animate-pulse` (slow breathing effect).
* *Colors:* Pink-500/20, Purple-500/20, Blue-500/10.



### 5.2. Staggered Animation

* Elements load with delays (`delay-100`, `delay-200`, `delay-1000`) to create a cascading entrance effect, making the UI feel "alive".

### 5.3. Custom Scrollbar

* Designed to blend into the dark theme.
* *Track:* `#1f2937` (Dark Gray).
* *Thumb:* `#4b5563` (Medium Gray) with rounded edges.

## 6. Layout Patterns

* **Hero Section:** Centered text, large gradient headline, maximum width constraint (`max-w-6xl`), surrounded by background glow effects.
* **Feature Grid:** Responsive grid (`grid-cols-1` -> `md:grid-cols-2` -> `lg:grid-cols-4`) with consistent gap spacing.
* **Marketplace Grid:** Uses `aspect-ratio` based cards with distinct sections for Preview, Metadata, and Pricing Action.

## 7. Iconography & Assets

* **Icons:** Minimalist line icons (Heroicons style) with `stroke-width={2}`.
* **Icon Containers:** Often placed inside a `w-12 h-12` container with a low-opacity background of the accent color (e.g., `bg-pink-500/20`).