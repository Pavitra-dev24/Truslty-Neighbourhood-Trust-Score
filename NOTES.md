# Project notes: why this, and why built this way

A short, honest record of the reasoning behind this project — useful for
a README, a cover letter, or an interview answer, and worth updating in
your own words as you build. There are two pivots in this project's
history, both worth being able to explain, since together they show a
realistic pattern: research → attempt the ideal design → hit a real
constraint → adapt honestly rather than fake it or give up.

## Why this problem, originally

Google Maps removes well over 100 million fake or policy-violating
reviews a year through automated detection, and yet independent surveys
of Indian users still find a majority consider Maps ratings unreliable or
inflated. That gap is the interesting part: Google's existing system is
almost entirely about *removing bad content after publication* — spam
detection, fake-account takedowns. Nothing in that pipeline gives an
ordinary user a *ranking* signal for the reviews that survive moderation.
That's the specific, narrow gap this project targets.

## Pivot 1: from "reviewer history" to "review signal"

The original idea was framed as scoring how "locally established" a
reviewer is — effectively building a trust graph from a reviewer's
history of other reviews. Google's public Places API does not expose
that data (a reviewer's other reviews are only visible in the Google
Maps UI itself; scraping it would violate Google's Terms of Service).

Rather than fake that signal, the project was scoped down to what the
public API *did* expose — review timing, text-rating consistency,
genericness, reviewer profile completeness.

## Pivot 2: from a live Places API lookup to paste-in reviews

The second pivot went further. Even the scaled-down version above still
depended on a Google Places API key — and getting one requires enabling
billing on a Google Cloud project, with a real payment method on file,
*even if actual usage always stays at $0*. That's a genuine, deliberate
choice not to make for a solo demo project shared publicly.

Rather than accept that trade-off, the project's dependency on Google's
API was removed entirely. The person using the tool now pastes reviews
in themselves — copied from Google Maps or anywhere else — and every
signal is computed from that pasted text on this project's own backend.
Two knock-on adjustments came from this:

- The "default profile photo" signal (from Places API image URLs) became
  an **anonymous reviewer** signal instead — checking for a blank name or
  a generic placeholder like "A Google User" (Google's own label for
  accounts with no name set). Same idea, different, still-honest signal.
- The "timing cluster" check, which depended on Google's own review
  timestamps, now runs on optional user-typed dates instead, and simply
  skips itself gracefully if too few dates are provided rather than
  guessing.

## The pattern worth naming in an interview

Both pivots follow the same shape: start from the most powerful version
of the idea, hit a real constraint (a Terms of Service boundary, then a
billing/payment boundary), and adapt the design honestly rather than
either faking the missing capability or abandoning the idea. Being able
to walk through *why* each adaptation was the right call — not just that
it happened — is arguably a stronger interview answer than a system that
never had to make a trade-off at all.

## What would change with more time or different constraints

- With a willingness to link a payment method, the original live-lookup
  version (Pivot 2) becomes buildable again, with the same scoring logic
  underneath — the two pivots are independent design decisions.
- With access to Google Maps' internal APIs (not available to an
  individual developer), the very first idea — a full reviewer-history
  trust graph — becomes buildable, which is worth naming as the "if I had
  real access" version.
- The sentiment lexicon in `scoring.py` is intentionally small and
  hand-built rather than a trained model; a natural next step is
  validating it against a larger sample of real, pasted-in reviews and
  seeing where it breaks.

## What this project is not claiming

- Not a claim that any specific review is fake.
- Not a replacement for Google's own moderation — a complement to it.
- Not a production system — a solo, non-commercial portfolio piece,
  scoped and documented as such throughout.
