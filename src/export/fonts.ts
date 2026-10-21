import { Font } from '@react-pdf/renderer'

let registered = false

export function registerResumeFonts() {
  if (registered || typeof window === 'undefined') return
  registered = true
  Font.register({
    family: 'Newsreader',
    src: '/fonts/Newsreader.ttf',
    fontWeight: 400,
  })
  Font.register({
    family: 'Source Serif 4',
    fonts: [
      { src: '/fonts/SourceSerif4-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/SourceSerif4-Semibold.ttf', fontWeight: 600 },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
}
