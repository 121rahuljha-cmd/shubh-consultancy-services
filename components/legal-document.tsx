export function LegalDocument({ title }: { title: string }) {
  return (
    <main className="bg-surface py-14 md:py-20">
      <article className="container-page max-w-4xl">
        <p className="eyebrow">Legal information</p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold text-navy">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last Updated: To be added</p>
        <section className="mt-10 rounded-lg border border-border bg-background p-6 md:p-8">
          <p className="text-base leading-8 text-foreground">Legal content will be added here.</p>
        </section>
      </article>
    </main>
  )
}
