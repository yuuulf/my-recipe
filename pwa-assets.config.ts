import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// The source logo fills the square with the primary green (#347859, the same
// as --color-primary in src/index.css), so icons keep that green instead of
// the generator's default white padding.
const primaryGreen = '#347859'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    // Android crops maskable icons to a circle (the inner 80%); shrinking the
    // logo to 70% keeps the spatula's corner inside it.
    maskable: { ...minimal2023Preset.maskable, padding: 0.3, resizeOptions: { background: primaryGreen } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: primaryGreen } },
  },
  images: ['public/logo-source.png'],
})
