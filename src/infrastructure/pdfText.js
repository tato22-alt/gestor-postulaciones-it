// Extracts the text of a PDF in the browser with pdf.js. The file never leaves the device.
// The library is loaded only when a PDF is chosen, so it does not slow down the app.
//
// The PDF is untrusted input: only its text is read, XFA forms are off, its fonts are not
// installed in the page, and nothing is rendered. pdf.js 6 no longer evaluates code from
// fonts (the cause of CVE-2024-4367), so the old `isEvalSupported` option no longer exists.

const MAX_PAGES = 20

export async function extractPdfText(file) {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({
    data,
    enableXfa: false,
    disableFontFace: true,
    useSystemFonts: false,
  })

  try {
    const document = await loadingTask.promise
    const pageCount = Math.min(document.numPages, MAX_PAGES)
    const pages = []

    for (let number = 1; number <= pageCount; number += 1) {
      const page = await document.getPage(number)
      const content = await page.getTextContent()
      const lines = []
      let line = ''

      for (const item of content.items) {
        if (typeof item.str !== 'string') continue

        line += item.str

        if (item.hasEOL) {
          lines.push(line)
          line = ''
        } else if (item.str && !item.str.endsWith(' ')) {
          line += ' '
        }
      }

      lines.push(line)
      pages.push(lines.join('\n'))
      page.cleanup()
    }

    return { ok: true, text: pages.join('\n\n'), truncatedPages: document.numPages > MAX_PAGES }
  } catch (error) {
    return { ok: false, status: error?.name === 'PasswordException' ? 'password_protected' : 'unreadable' }
  } finally {
    await loadingTask.destroy()
  }
}
