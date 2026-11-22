import { motion } from 'motion/react';
import { NewspaperEdition } from '../types';

interface NewspaperPageProps {
  edition: NewspaperEdition;
}

export function NewspaperPage({ edition }: NewspaperPageProps) {
  return (
    <div className="min-h-screen bg-[#15120e] px-4 py-10 sm:px-8 sm:py-14">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: edition.paperBg,
          color: edition.inkColor,
        }}
        className="mx-auto max-w-5xl rounded-sm border border-black/25 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)] sm:p-12"
      >
        {/* Top Masthead Rule */}
        <div
          style={{ borderColor: edition.inkColor }}
          className="border-b-4 pb-4 text-center"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/20 pb-2 font-mono text-[11px] tracking-widest uppercase opacity-75">
            <span>{edition.volumeLabel}</span>
            <span>{edition.dateLabel}</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.16em' }}
            animate={{ opacity: 1, letterSpacing: '0.06em' }}
            transition={{ duration: 0.7 }}
            className="mt-4 font-display text-4xl font-extrabold tracking-wide uppercase sm:text-6xl"
          >
            {edition.masthead}
          </motion.h1>
        </div>

        {/* Double hairline divider */}
        <div
          style={{ borderColor: edition.accentColor }}
          className="mt-1 border-b-2"
        />

        {/* Lead Headline */}
        <div className="mt-7 text-center">
          <h2
            style={{ color: edition.accentColor }}
            className="font-display text-2xl leading-tight font-extrabold uppercase sm:text-4xl"
          >
            {edition.headline}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl font-display text-base italic opacity-85 sm:text-lg">
            {edition.subheadline}
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="mt-8 grid gap-8 border-t border-black/20 pt-8 lg:grid-cols-12">
          {/* Main Column */}
          <div className="space-y-5 lg:col-span-8 lg:border-r lg:border-black/20 lg:pr-8">
            {edition.featuredImageUrl && (
              <figure className="overflow-hidden border border-black/30 bg-black/5">
                <img
                  src={edition.featuredImageUrl}
                  alt={edition.headline}
                  referrerPolicy="no-referrer"
                  className="aspect-[16/9] w-full object-cover"
                />
              </figure>
            )}

            <p
              style={{ color: edition.accentColor }}
              className="font-mono text-xs font-bold tracking-wider uppercase"
            >
              {edition.leadAuthor}
            </p>

            <div className="space-y-4 text-[15px] leading-relaxed whitespace-pre-line">
              {edition.leadBody}
            </div>
          </div>

          {/* Right Sidebar Column */}
          <aside className="flex flex-col justify-between gap-6 lg:col-span-4">
            <div className="border border-black/25 bg-black/[0.03] p-5">
              <h3
                style={{ color: edition.accentColor }}
                className="border-b border-black/20 pb-2 font-display text-lg font-bold uppercase"
              >
                {edition.sideTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                {edition.sideBody}
              </p>
            </div>

            <blockquote
              style={{ borderColor: edition.accentColor }}
              className="border-y-2 py-5 text-center"
            >
              <p className="font-display text-lg italic leading-snug">
                “{edition.quoteText}”
              </p>
              <footer className="mt-2 font-mono text-xs font-semibold uppercase opacity-75">
                — {edition.quoteAuthor}
              </footer>
            </blockquote>
          </aside>
        </div>
      </motion.article>
    </div>
  );
}
