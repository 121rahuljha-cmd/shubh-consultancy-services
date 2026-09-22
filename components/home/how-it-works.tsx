const steps = [
  {
    title: 'Share your requirement',
    description:
      'Call or WhatsApp us with what you need. We ask a few questions to understand your business and confirm exactly which registration or filing applies to you.',
  },
  {
    title: 'Get a fixed quote',
    description:
      'You receive a written quote with the government fee and our professional fee separated, plus a realistic timeline. No hidden charges added later.',
  },
  {
    title: 'Submit your documents',
    description:
      'We send you a simple checklist. Share the documents over WhatsApp or email and our team verifies everything before anything is filed.',
  },
  {
    title: 'We file and follow up',
    description:
      'Our experts prepare and file the application, respond to any departmental queries, and hand you the final certificate along with all acknowledgements.',
  },
]

export function HowItWorks() {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center rounded-full bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
            How it works
          </span>
          <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-[1.1] text-balance text-navy sm:text-4xl">
            Four steps from enquiry to certificate
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            We keep the process transparent so you always know which stage your
            application is at and what happens next.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 transition-all hover:border-brand hover:shadow-lg hover:shadow-navy/5"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-navy font-heading text-lg font-extrabold text-white"
              >
                {index + 1}
              </span>
              <h3 className="font-heading text-base font-bold text-navy">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
