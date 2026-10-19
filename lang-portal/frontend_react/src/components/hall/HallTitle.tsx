/**
 * The Great Hall's heading and welcome line, set over the central arches. A soft, localised light
 * haze (not a panel) keeps the dark burgundy text readable against the bright sky and stone.
 * The <h1> is focusable by script only: Layout moves focus to it after navigation.
 */
function HallTitle() {
  return (
    <div className="relative isolate mx-auto [text-shadow:0_0_10px_rgb(255_249_232/0.95),0_0_3px_rgb(255_249_232/0.9)] max-w-[26rem] px-2 text-center sm:max-w-[28rem] before:absolute before:-inset-x-14 before:-inset-y-8 before:-z-10 before:bg-[radial-gradient(ellipse_farthest-side,rgb(255_249_232/0.82),rgb(255_246_225/0.6)_55%,transparent)] lg:max-w-[32rem] xl:max-w-xl">
      <h1
        id="hall-title"
        tabIndex={-1}
        className="font-display text-[clamp(2rem,3.8vw,3.5rem)] font-bold leading-tight tracking-wide text-burgundy-950"
      >
        The Great Hall
      </h1>
      <div aria-hidden="true" className="my-3 flex items-center justify-center gap-3 text-gold-700">
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-700 sm:w-28" />
        <span className="size-2 rotate-45 border border-gold-700 bg-gold-400" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-700 sm:w-28" />
      </div>
      <p className="text-[clamp(1.05rem,1.35vw,1.35rem)] font-medium leading-snug text-ink-900">
        Welcome, scholar. Choose an activity to continue your journey in the realm of Greek.
      </p>
    </div>
  )
}

export default HallTitle
