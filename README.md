# Resume Studio

A light-mode resume editor that runs entirely in the browser. Start from a blank template or upload a PDF or Word file, edit the sections, and download a PDF or Word file. There is no account, no database, and no API. Closing the tab drops unsaved work. The file you download is the save.

## Clone and run

You need [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) **20.19 or newer**, or **22.12 or newer**. Vite 8 warns on older 20.x releases.

```bash
git clone https://github.com/ayush-studio/resume-editing-website.git
cd resume-editing-website
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

| Command | What it does |
| --- | --- |
| `npm install` | Installs dependencies from `package-lock.json`. |
| `npm run dev` | Starts the local dev server with hot reload. |
| `npm test` | Runs the import mapper and hidden-payload tests. |
| `npm run build` | Type-checks and writes the static site to `dist/`. |
| `npm run preview` | Serves the production build locally. |

## How to use it

1. **Start blank.** Pick Editorial, Split, or Compact, then fill in the form.
2. **Upload a file.** Drop a `.pdf` or `.docx` on the home screen, or browse for one. Old `.doc` files are rejected; save them as `.docx` first.
3. **Review a foreign file.** If the file was not made by this app, the text is mapped into sections and shown on a review screen before the editor opens. Scanned PDFs with no text layer offer a paste box or a blank start.
4. **Edit.** Change profile, summary, experience, education, skills, projects, and certifications. Reorder sections, hide a section, undo and redo, and switch template or accent.
5. **Download.** Save as PDF or Word. Uploading that file later restores the same resume, including template and section order.

The editor asks before you leave while there are unsaved edits. A download needs a name; an empty name focuses the name field.

On a phone or tablet the section list scrolls sideways and Preview, Word, and PDF sit in a bar at the bottom. Preview opens full screen and the page scales to the width of the screen. From about 1180px wide, the section list, form, and live page sit in three columns. On very wide monitors the studio stops growing so the form stays readable.

## What a download contains

PDF and Word files from this app carry a hidden `resume.json` payload:

- PDF: an embedded file named `resume.json`.
- Word: a custom XML part inside the `.docx` zip.

Re-uploading one of those files restores the editor exactly. A file from another tool has no payload, so the app reads the visible text (PDF text layer, or Word via Mammoth) and guesses sections from headings. That guess goes through the review screen. Two-column PDFs and unusual heading styles map less reliably. Word export is structured content (headings and bullets), not a pixel copy of the PDF.

## Deploy

The production build is a static site. `vercel.json` rewrites every path to `index.html` so a refresh still loads the app.

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), import the repository.
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. No environment variables are required.

You can also host the `dist/` folder on any static host.

## Project layout

```text
index.html              Page shell and viewport settings
vercel.json             SPA rewrite for Vercel
public/fonts            Newsreader and Source Serif 4, used by the PDF
public/favicon.svg
src/main.tsx            React entry
src/app/App.tsx         View switch: home, reading, paste, review, editor
src/model/resume.ts     Resume schema, templates, accents, empty document
src/state/resumeStore.ts  In-memory document, undo/redo, dirty flag
src/import/             PDF and Word reading, heading mapper, hidden payload
src/export/             PDF templates, Word export, download
src/ui/                 Home, review, editor, preview, forms
src/index.css           Layout and breakpoints
```

Sections are profile, summary, experience, education, skills, projects, and certifications. Templates are Editorial, Split, and Compact. Accent colors are ink, vermilion, cobalt, and forest.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, and Zustand. Parsing and export stay in the browser: `pdfjs-dist` and `pdf-lib` for PDF, Mammoth and `docx` for Word, JSZip for the hidden Word payload, and `@react-pdf/renderer` for the live page and PDF download. Zod checks the resume shape. Tests use Vitest.

## Fonts

PDF text uses fonts shipped in `public/fonts/`:

- [Newsreader](https://github.com/productiontype/Newsreader) (variable font, SIL Open Font License). License: `public/fonts/OFL-Newsreader.txt`.
- [Source Serif 4](https://github.com/adobe-fonts/source-serif) (SIL Open Font License, reserved name “Source”). License: `public/fonts/LICENSE-SourceSerif.txt`.

The on-screen UI uses Familjen Grotesk, Newsreader, and Source Serif 4 from `@fontsource`, also under the SIL Open Font License.

## Limits

- Nothing is saved in the browser. Refresh or close the tab and unsaved edits are gone.
- There is no sign-in, cloud sync, AI rewrite, or cover-letter tool.
- Scanned PDFs need pasted text or a blank start.
- Foreign and multi-column files are a best effort, then a review step.
- The Word file matches the content, not the PDF page layout.
