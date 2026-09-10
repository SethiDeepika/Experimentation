export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="section-label">About this tool</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
        Why a meeting-type-specific checklist, not a generic template
      </h1>

      <div className="prose-ink mt-8 space-y-6 text-ink-700">
        <section>
          <h2 className="text-lg font-bold text-ink-900">The problem</h2>
          <p className="mt-2 leading-relaxed">
            Most meeting-prep advice is generic: "have an agenda," "know your
            desired outcome." True, and useless in the moment. A PM's calendar
            in a given week might hold a sprint planning session, an exec
            update, a user interview, and a 1:1 — and each of those needs a
            genuinely different kind of preparation, not the same three bullet
            points reused. The failure mode I kept seeing (in myself and
            others) wasn't a lack of effort, it was applying the wrong kind of
            prep to the wrong room: bringing a slide deck's worth of journey
            to an exec update that wanted a one-line status, or letting a
            design review turn into a first-reaction session because nothing
            was shared ahead of time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">The framework</h2>
          <p className="mt-2 leading-relaxed">
            Every meeting type here is broken into the same four pieces, on
            purpose:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-ink-900">
                An outcome statement
              </span>{" "}
              — a fill-in-the-blank sentence that forces you to name what
              "done" looks like before you walk in, not after.
            </li>
            <li>
              <span className="font-semibold text-ink-900">Before</span> — the
              prep that has to happen outside the meeting, because it can't be
              done live without wasting the room's time.
            </li>
            <li>
              <span className="font-semibold text-ink-900">During</span> —
              tactics, not topics. Things you actively do or watch for while
              the meeting is happening.
            </li>
            <li>
              <span className="font-semibold text-ink-900">After</span> — the
              minimum follow-through that keeps the meeting's decisions from
              evaporating.
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            The duration and attendee-count inputs are a small nod to the same
            idea: an exec update with 20 people in the room has a different
            failure mode (silent disagreement, nobody flags confusion) than
            one with 3. The tips are deliberately light-touch — they nudge,
            they don't redesign the checklist.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">
            Why structure it by meeting type
          </h2>
          <p className="mt-2 leading-relaxed">
            Because "prep well" isn't a skill you can apply generically — it's
            pattern-matching to context, and most PMs already have the
            patterns, just not written down and ready to reach for at 8:58am
            before the 9:00 stands up. Structuring the tool as one page per
            meeting type (rather than one long checklist with caveats) means
            you get exactly the prep relevant to the next 30 minutes of your
            day, nothing else to scroll past.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">How it's built</h2>
          <p className="mt-2 leading-relaxed">
            This is a fully static React app (Vite + Tailwind + React Router,
            using a hash router so it works cleanly on GitHub Pages with no
            server-side routing). There's no backend and no data collection —
            the content bank lives in the codebase, and anything you type
            (like the attendee count) stays in your browser only.
          </p>
        </section>
      </div>
    </div>
  );
}
