import { chromium } from 'playwright'

const WIDTH = Number(process.env.VIEWPORT_WIDTH ?? 1440)
const HEIGHT = Number(process.env.VIEWPORT_HEIGHT ?? 2400)

const targets = [
  { name: 'reference', url: 'https://shubh-ten.vercel.app/' },
  { name: 'local', url: 'http://localhost:3000/' },
]

const sectionConfigs = [
  {
    key: 'statistics',
    label: 'Statistics',
    selector: 'main > section:nth-of-type(2)',
    cardSelector: '.container-page > div',
  },
  {
    key: 'services',
    label: 'Services',
    selector: 'section#services',
    headingSelector: 'div:has(> h2)',
    cardSelector: 'article',
  },
  {
    key: 'how_it_works',
    label: 'How It Works',
    selector: 'section:has-text("Four steps from enquiry to certificate")',
    headingSelector: 'div:has(> h2)',
    cardSelector: 'ol > li',
  },
  {
    key: 'why_choose_us',
    label: 'Why Choose Us',
    selector: 'section:has-text("Compliance handled properly, the first time")',
    headingSelector: 'div:has(> h2)',
    cardSelector: 'ul > li',
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    selector: 'section:has-text("Trusted by founders and business owners")',
    headingSelector: 'div:has(> h2)',
    cardSelector: 'ul > li',
  },
  {
    key: 'cta',
    label: 'CTA',
    selector: 'section:has-text("Not sure which registration applies to you?")',
    headingSelector: 'div:has(> h2)',
    cardSelector: 'a',
  },
  {
    key: 'footer',
    label: 'Footer',
    selector: 'footer',
    cardSelector: 'div.container-page > *',
  },
]

function round(value) {
  return Math.round(value * 100) / 100
}

function pickCardStats(cards) {
  if (!cards.length) {
    return null
  }

  const heights = cards.map((card) => card.height)
  const widths = cards.map((card) => card.width)
  const ys = [...new Set(cards.map((card) => Math.round(card.top)))]
  const rowSizes = ys.map((top) => cards.filter((card) => Math.round(card.top) === top))

  const rowGap =
    rowSizes.length > 1
      ? rowSizes[1][0].top - (rowSizes[0][0].top + rowSizes[0][0].height)
      : 0

  let columnGap = 0
  if (rowSizes[0]?.length > 1) {
    columnGap = rowSizes[0][1].left - (rowSizes[0][0].left + rowSizes[0][0].width)
  }

  return {
    count: cards.length,
    averageHeight: round(heights.reduce((sum, value) => sum + value, 0) / heights.length),
    averageWidth: round(widths.reduce((sum, value) => sum + value, 0) / widths.length),
    minHeight: round(Math.min(...heights)),
    maxHeight: round(Math.max(...heights)),
    columns: rowSizes[0]?.length ?? cards.length,
    rowGap: round(rowGap),
    columnGap: round(columnGap),
  }
}

async function measureSection(page, config) {
  const section = page.locator(config.selector).first()
  await section.waitFor({ state: 'visible' })

  return section.evaluate((node, sectionConfig) => {
    const roundInPage = (value) => Math.round(value * 100) / 100
    const style = window.getComputedStyle(node)
    const rect = node.getBoundingClientRect()

    const container =
      node.querySelector('.container-page') ??
      node.querySelector('.container') ??
      node.firstElementChild ??
      node
    const containerRect = container.getBoundingClientRect()

    const headingHost =
      (sectionConfig.headingSelector
        ? node.querySelector(sectionConfig.headingSelector)
        : null) ??
      node.querySelector('h2')?.parentElement ??
      null

    const heading = node.querySelector('h2')
    const headingRect = heading?.getBoundingClientRect() ?? null
    const headingHostRect = headingHost?.getBoundingClientRect() ?? null

    const cards = sectionConfig.cardSelector
      ? [...node.querySelectorAll(sectionConfig.cardSelector)].map((card) => {
          const cardRect = card.getBoundingClientRect()
          const cardStyle = window.getComputedStyle(card)
          return {
            top: roundInPage(cardRect.top - rect.top),
            left: roundInPage(cardRect.left - rect.left),
            width: roundInPage(cardRect.width),
            height: roundInPage(cardRect.height),
            paddingTop: roundInPage(parseFloat(cardStyle.paddingTop) || 0),
            paddingBottom: roundInPage(parseFloat(cardStyle.paddingBottom) || 0),
          }
        })
      : []

    return {
      sectionHeight: roundInPage(rect.height),
      sectionWidth: roundInPage(rect.width),
      paddingTop: roundInPage(parseFloat(style.paddingTop) || 0),
      paddingBottom: roundInPage(parseFloat(style.paddingBottom) || 0),
      marginTop: roundInPage(parseFloat(style.marginTop) || 0),
      marginBottom: roundInPage(parseFloat(style.marginBottom) || 0),
      containerWidth: roundInPage(containerRect.width),
      containerHeight: roundInPage(containerRect.height),
      headingBlockHeight: headingHostRect ? roundInPage(headingHostRect.height) : null,
      headingHeight: headingRect ? roundInPage(headingRect.height) : null,
      headingText: heading?.textContent?.trim() ?? null,
      cards,
    }
  }, config)
}

async function measureTarget(browser, target) {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })

  await page.goto(target.url, { waitUntil: 'networkidle', timeout: 120000 })
  await page.addStyleTag({
    content: `
      * {
        scroll-behavior: auto !important;
      }
    `,
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)

  const sections = {}
  for (const config of sectionConfigs) {
    sections[config.key] = await measureSection(page, config)
  }

  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const mainHeight = await page.locator('main').evaluate((node) => node.getBoundingClientRect().height)

  await page.close()

  return {
    url: target.url,
    viewport: { width: WIDTH, height: HEIGHT },
    fullHeight: round(fullHeight),
    mainHeight: round(mainHeight),
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, section]) => [
        key,
        {
          ...section,
          cardStats: pickCardStats(section.cards),
          cards: section.cards.slice(0, 4),
        },
      ]),
    ),
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  try {
    const results = {}
    for (const target of targets) {
      results[target.name] = await measureTarget(browser, target)
    }

    const comparisons = Object.fromEntries(
      sectionConfigs.map((config) => {
        const reference = results.reference.sections[config.key]
        const local = results.local.sections[config.key]
        return [
          config.key,
          {
            label: config.label,
            referenceHeight: reference.sectionHeight,
            localHeight: local.sectionHeight,
            delta: round(local.sectionHeight - reference.sectionHeight),
            referencePaddingTop: reference.paddingTop,
            localPaddingTop: local.paddingTop,
            referencePaddingBottom: reference.paddingBottom,
            localPaddingBottom: local.paddingBottom,
            referenceHeadingBlockHeight: reference.headingBlockHeight,
            localHeadingBlockHeight: local.headingBlockHeight,
            referenceContainerWidth: reference.containerWidth,
            localContainerWidth: local.containerWidth,
            referenceCardStats: reference.cardStats,
            localCardStats: local.cardStats,
          },
        ]
      }),
    )

    const output = {
      generatedAt: new Date().toISOString(),
      fullHeightDelta: round(results.local.fullHeight - results.reference.fullHeight),
      mainHeightDelta: round(results.local.mainHeight - results.reference.mainHeight),
      targets: results,
      comparisons,
    }

    console.log(JSON.stringify(output, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
