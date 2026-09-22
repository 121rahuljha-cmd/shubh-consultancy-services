import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sharp from 'sharp'

const outputDir = path.resolve('.visual-qa/latest')
const desktopWidth = 1440
const responsiveWidths = [360, 375, 390, 414, 768, 1024, 1280, 1440]

const targets = {
  reference: 'https://shubh-ten.vercel.app/',
  local: 'http://localhost:3000/',
}

const sections = [
  { key: 'statistics', selector: 'main > section:nth-of-type(2)' },
  { key: 'services', selector: 'section#services' },
  {
    key: 'how_it_works',
    selector: 'section:has-text("Four steps from enquiry to certificate")',
  },
  {
    key: 'why_choose_us',
    selector: 'section:has-text("Compliance handled properly, the first time")',
  },
  {
    key: 'testimonials',
    selector: 'section:has-text("Trusted by founders and business owners")',
  },
  {
    key: 'cta',
    selector: 'section:has-text("Not sure which registration applies to you?")',
  },
  { key: 'footer', selector: 'footer' },
]

function round(value) {
  return Math.round(value * 1_000_000) / 1_000_000
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function writeBuffer(filePath, buffer) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, buffer)
}

async function normalize(buffer, width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: buffer, top: 0, left: 0 }])
    .png()
    .toBuffer()
}

async function compareBuffers(referenceBuffer, localBuffer) {
  const referenceMeta = await sharp(referenceBuffer).metadata()
  const localMeta = await sharp(localBuffer).metadata()
  const width = Math.max(referenceMeta.width ?? 0, localMeta.width ?? 0)
  const height = Math.max(referenceMeta.height ?? 0, localMeta.height ?? 0)

  const [referencePadded, localPadded] = await Promise.all([
    normalize(referenceBuffer, width, height),
    normalize(localBuffer, width, height),
  ])

  const referencePng = PNG.sync.read(referencePadded)
  const localPng = PNG.sync.read(localPadded)
  const diffPng = new PNG({ width, height })

  const diffPixels = pixelmatch(
    referencePng.data,
    localPng.data,
    diffPng.data,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: false,
      alpha: 0.7,
      diffColor: [255, 84, 0],
      diffColorAlt: [255, 84, 0],
    },
  )

  return {
    width,
    height,
    diffPixels,
    diffRatio: round(diffPixels / (width * height)),
    referencePadded,
    localPadded,
    diffBuffer: PNG.sync.write(diffPng),
  }
}

async function hideNonProductBadges(page) {
  await page.evaluate(() => {
    const fixedElements = [...document.querySelectorAll('body *')].filter((node) => {
      const element = node
      if (!(element instanceof HTMLElement)) {
        return false
      }

      const style = window.getComputedStyle(element)
      if (style.position !== 'fixed') {
        return false
      }

      const rect = element.getBoundingClientRect()
      const text = element.innerText?.trim() ?? ''

      const isV0 = text.includes('Built with v0')
      const isNextBadge =
        text === 'N' &&
        rect.width <= 80 &&
        rect.height <= 80 &&
        rect.left <= 48 &&
        window.innerHeight - rect.bottom <= 48

      return isV0 || isNextBadge
    })

    fixedElements.forEach((element) => {
      element.style.display = 'none'
    })

    document.querySelectorAll('nextjs-portal').forEach((element) => {
      element.remove()
    })
  })
}

async function capturePage(page, url, width) {
  await page.setViewportSize({ width, height: 2400 })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
  await page.addStyleTag({
    content: `
      * {
        scroll-behavior: auto !important;
      }
    `,
  })
  await hideNonProductBadges(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1000)

  const fullPage = await page.screenshot({ fullPage: true, type: 'png' })

  return { fullPage }
}

async function captureSection(page, selector) {
  const locator = page.locator(selector).first()
  await locator.waitFor({ state: 'visible' })
  return locator.screenshot({ type: 'png' })
}

async function compareWidth(browser, width) {
  const referencePage = await browser.newPage()
  const localPage = await browser.newPage()

  try {
    const [referenceCapture, localCapture] = await Promise.all([
      capturePage(referencePage, targets.reference, width),
      capturePage(localPage, targets.local, width),
    ])

    const full = await compareBuffers(referenceCapture.fullPage, localCapture.fullPage)

    await writeBuffer(path.join(outputDir, `responsive-${width}-reference.png`), full.referencePadded)
    await writeBuffer(path.join(outputDir, `responsive-${width}-local.png`), full.localPadded)
    await writeBuffer(path.join(outputDir, `responsive-${width}-diff.png`), full.diffBuffer)

    const sectionResults = {}
    if (width === desktopWidth) {
      for (const section of sections) {
        const [referenceSection, localSection] = await Promise.all([
          captureSection(referencePage, section.selector),
          captureSection(localPage, section.selector),
        ])

        const diff = await compareBuffers(referenceSection, localSection)
        sectionResults[section.key] = {
          width: diff.width,
          height: diff.height,
          diffPixels: diff.diffPixels,
          diffRatio: diff.diffRatio,
        }

        await writeBuffer(path.join(outputDir, `${section.key}-reference.png`), diff.referencePadded)
        await writeBuffer(path.join(outputDir, `${section.key}-local.png`), diff.localPadded)
        await writeBuffer(path.join(outputDir, `${section.key}-diff.png`), diff.diffBuffer)
      }
    }

    return {
      width,
      fullPage: {
        width: full.width,
        height: full.height,
        diffPixels: full.diffPixels,
        diffRatio: full.diffRatio,
      },
      sections: sectionResults,
    }
  } finally {
    await Promise.all([referencePage.close(), localPage.close()])
  }
}

async function main() {
  await ensureDir(outputDir)

  const browser = await chromium.launch({ headless: true })

  try {
    const results = []
    for (const width of responsiveWidths) {
      results.push(await compareWidth(browser, width))
    }

    const desktop = results.find((result) => result.width === desktopWidth)
    const report = {
      generatedAt: new Date().toISOString(),
      desktop,
      responsive: results.map(({ width, fullPage }) => ({ width, diff: fullPage })),
    }

    await fs.writeFile(
      path.join(outputDir, 'report.json'),
      JSON.stringify(report, null, 2),
    )

    console.log(JSON.stringify(report, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
