import { Link } from 'react-router-dom'
import lexiconCard from '@/assets/images/card-lexicon.webp'
import lexiconCardSmall from '@/assets/images/card-lexicon-560.webp'
import memoryScrollsCard from '@/assets/images/card-memory-scrolls.webp'
import memoryScrollsCardSmall from '@/assets/images/card-memory-scrolls-560.webp'
import trialOfWitsCard from '@/assets/images/card-trial-of-wits.webp'
import trialOfWitsCardSmall from '@/assets/images/card-trial-of-wits-560.webp'

/*
  The three activity portals. Each card is a finished piece of artwork (frame, scene, emblem, title
  and description are all in the image), so it is shown whole: never cropped, covered or restyled.
  The words printed in the artwork are repeated as visually hidden text, so assistive technology
  gets them once (the images themselves are decorative, alt="").
*/

const portals = [
  {
    kind: 'link' as const,
    to: '/lexicon',
    title: 'The Lexicon',
    description: 'Explore words and their meanings.',
    src: lexiconCard,
    small: lexiconCardSmall,
    width: 891,
    height: 1357,
  },
  {
    kind: 'link' as const,
    to: '/memory-scrolls',
    title: 'Memory Scrolls',
    description: 'Practise writing and recall words.',
    src: memoryScrollsCard,
    small: memoryScrollsCardSmall,
    width: 899,
    height: 1359,
  },
  {
    // Not implemented yet: shown, but deliberately not a link and with no hover or press effects
    kind: 'soon' as const,
    title: 'Trial of Wits',
    description: 'Coming soon.',
    src: trialOfWitsCard,
    small: trialOfWitsCardSmall,
    width: 895,
    height: 1372,
  },
]

// Phones: one card per row. Small tablets: two per row. From `lg`: all three in one row, sized by the
// viewport height (so the whole composition fits one screen) and capped by its width.
const widthClass = 'w-[min(86vw,20rem)] sm:w-[min(40vw,19rem)] lg:w-auto'
const imageClass =
  'block h-auto w-full select-none lg:h-[min(clamp(340px,44dvh,560px),38vw)] lg:w-auto'
// Two drop-shadows at rest and on hover, so the browser can animate between them
const groundShadow = '[filter:drop-shadow(0_6px_10px_rgb(44_12_20/0.35))_drop-shadow(0_0_0_rgb(201_169_79/0))]'

function ActivityPortals() {
  return (
    <section aria-labelledby="portals-heading">
      <h2 id="portals-heading" className="sr-only">
        Choose an activity
      </h2>
      <ul className="flex flex-wrap justify-center gap-6 lg:flex-nowrap lg:gap-[2.4vw]">
        {portals.map((portal) => {
          const art = (
            <img
              src={portal.src}
              srcSet={`${portal.small} 560w, ${portal.src} ${portal.width}w`}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 86vw"
              width={portal.width}
              height={portal.height}
              alt=""
              draggable={false}
              className={`${imageClass} ${groundShadow} ${
                portal.kind === 'link'
                  ? 'motion-safe:transition-[filter] motion-safe:duration-200 group-hover:[filter:drop-shadow(0_0_10px_rgb(201_169_79/0.85))_drop-shadow(0_0_28px_rgb(201_169_79/0.4))] group-focus-visible:[filter:drop-shadow(0_0_10px_rgb(201_169_79/0.85))_drop-shadow(0_0_28px_rgb(201_169_79/0.4))]'
                  : ''
              }`}
            />
          )

          if (portal.kind === 'soon') {
            return (
              <li key={portal.title} className={widthClass}>
                {art}
                <span className="sr-only">
                  {portal.title}. {portal.description}
                </span>
              </li>
            )
          }

          const descriptionId = `portal-${portal.to.slice(1)}-description`
          return (
            <li key={portal.title} className={widthClass}>
              <Link
                to={portal.to}
                draggable={false}
                aria-describedby={descriptionId}
                className="group block rounded-2xl outline-offset-4 focus-visible:outline-3 focus-visible:outline-gold-100 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:active:translate-y-0.5 motion-safe:active:scale-[0.985] motion-safe:active:duration-100 motion-safe:focus-visible:-translate-y-1.5 motion-safe:focus-visible:scale-[1.02]"
              >
                {art}
                <span className="sr-only">{portal.title}</span>
              </Link>
              <span id={descriptionId} className="sr-only">
                {portal.description}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ActivityPortals
