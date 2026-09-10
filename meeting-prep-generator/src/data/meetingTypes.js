// Static content bank for every meeting type. No backend — this is the entire
// "database" for the app. Add a new meeting type by adding an entry here and
// it will automatically appear on the home page grid and get a route.

export const meetingTypes = [
  {
    slug: "sprint-planning",
    name: "Sprint Planning",
    icon: "🗂️",
    tagline: "Turn a backlog review into a committed, shared sprint goal.",
    outcomeTemplate:
      "By the end of this meeting, the team has committed to [sprint goal] and everyone can name the top 1-2 risks to hitting it.",
    before: [
      "Backlog groomed and estimated ahead of time",
      "Capacity confirmed with team leads (PTO, on-call, other commitments)",
      "Carryover items flagged with reasons they didn't finish last sprint",
      "Draft sprint goal written down before the meeting, not invented live",
    ],
    during: [
      "State the sprint goal first, not just the ticket list",
      "Timebox debate on any single ticket to 2 minutes — park it if it runs longer",
      "Confirm dependencies (cross-team, design, infra) are called out loud, not assumed",
      "Ask directly: \"does anyone see a reason we can't commit to this?\"",
    ],
    after: [
      "Sprint goal + committed scope documented and shared same day",
      "Parked items logged with an owner and a follow-up time",
    ],
    largeGroupTip:
      "With this many people in the room, run a quick round-robin so quieter engineers still get a chance to flag risk before commitment — don't let the loudest voice set the pace.",
    shortMeetingTip:
      "This is a tight window — groom and size beforehand so the meeting is purely about sequencing and commitment, not estimation.",
  },
  {
    slug: "exec-update",
    name: "Stakeholder / Exec Update",
    icon: "📊",
    tagline: "Lead with the outcome, not the journey.",
    outcomeTemplate:
      "By the end of this meeting, execs know the status of [initiative], understand the one decision or ask on the table, and have said yes/no/more-info-needed to it.",
    before: [
      "One-slide summary prepared (not a full deck walkthrough)",
      "Anticipate the 2 hardest questions and pre-answer them",
      "Know the ONE ask, if there is one — don't leave it implicit",
      "Confirm who in the room actually has decision authority",
    ],
    during: [
      "Lead with the outcome/status, not the journey that got you there",
      "Explicitly separate \"FYI\" from \"need a decision from you\"",
      "Watch for silent disagreement — invite it directly (\"does this land the way we expect?\")",
      "Hold the room to the ask; don't let tangents eat the decision point",
    ],
    after: [
      "Send a 3-line recap even if no action needed, to reinforce alignment",
      "Log any decision made (or deferred) with the reasoning, not just the outcome",
    ],
    largeGroupTip:
      "In a large exec audience, assign one person in the room to watch the chat/reactions for questions — big groups go quiet even when confused, so build in an explicit pause for questions rather than assuming silence means alignment.",
    shortMeetingTip:
      "15-30 minutes with execs means zero time for scene-setting — open with the headline result or ask in the first sentence.",
  },
  {
    slug: "user-research",
    name: "User Research / Discovery Call",
    icon: "🔍",
    tagline: "Protect the questions you can't leave without answering.",
    outcomeTemplate:
      "By the end of this call, you have an answer (or a clear non-answer) to [top question], and at least one verbatim quote or surprising detail worth sharing with the team.",
    before: [
      "Write down your top 3 questions you cannot leave without answering",
      "Prepare neutral framing for each question (avoid leading questions)",
      "Confirm recording/consent logistics before the call starts",
      "Re-read notes from any prior session with this user or segment",
    ],
    during: [
      "Let silence sit before jumping in — the best detail often comes after the pause",
      "Ask \"why\" one level deeper than feels natural",
      "Note surprising language the user uses verbatim, not your paraphrase",
      "Resist pitching or explaining the product — you're here to listen",
    ],
    after: [
      "Write up findings within 24 hours while memory is fresh",
      "Separate \"what they said\" from \"what we think it means\"",
    ],
    largeGroupTip:
      "With multiple observers on the call, assign one note-taker so the moderator can stay fully present with the participant instead of splitting attention on typing.",
    shortMeetingTip:
      "In a 15-30 minute call, cut intros to a sentence and get to your top question by minute 3 — you won't get a second pass at the deep questions if time runs out.",
  },
  {
    slug: "design-review",
    name: "Cross-Functional Design Review",
    icon: "🎨",
    tagline: "Make it a discussion, not a first reaction.",
    outcomeTemplate:
      "By the end of this review, [design/prototype] has explicit sign-off or a specific list of what needs another pass, and engineering has flagged any feasibility concerns.",
    before: [
      "Share designs/prototype ahead of time so the meeting is discussion, not first reaction",
      "Identify which decisions are reversible vs. one-way doors",
      "Confirm who has authority to approve vs. who is there to give input",
      "Prepare the specific questions you want feedback on, not just \"thoughts?\"",
    ],
    during: [
      "Ask engineering for feasibility flags early, not after visual buy-in",
      "Separate aesthetic feedback from functional feedback explicitly",
      "Redirect \"I don't like it\" toward \"what specifically isn't working, and for whom?\"",
      "Track open questions live so nothing gets lost in the discussion",
    ],
    after: [
      "Document what was approved vs. what needs another pass",
      "Assign owners to any follow-up design iterations with a date",
    ],
    largeGroupTip:
      "With a big cross-functional group, go around by discipline (design, eng, PM) rather than open floor — otherwise the loudest function dominates and quieter functional concerns (like accessibility or feasibility) get skipped.",
    shortMeetingTip:
      "In a short review, pre-circulate the prototype and spend the whole meeting on the 2-3 specific questions you need answered — don't spend the clock on a first walkthrough.",
  },
  {
    slug: "one-on-ones",
    name: "1:1s",
    icon: "💬",
    tagline: "Their agenda first, your problem-solving second.",
    outcomeTemplate:
      "By the end of this 1:1, [person] feels heard on what mattered to them, and any commitments either of us made are written down.",
    before: [
      "Let the other person set at least half the agenda",
      "Review notes from last 1:1 for follow-through on prior commitments",
      "Check in on anything you know is happening in their life/work outside this project",
      "Come with 1-2 topics of your own, but hold them loosely",
    ],
    during: [
      "Resist problem-solving immediately",
      "Ask what they need (advice vs. venting vs. a decision) before giving it",
      "Leave real space for silence — don't fill every pause",
      "Follow their lead on topic order rather than working strictly down a list",
    ],
    after: [
      "Note any commitments YOU made, not just theirs",
      "Follow through visibly before the next 1:1, even on small things",
    ],
    largeGroupTip: null,
    shortMeetingTip:
      "In a 15-minute 1:1, ask what's most important to them first thing — don't spend the first 5 minutes on status updates that could've been async.",
  },
  {
    slug: "roadmap-prioritization",
    name: "Roadmap / Prioritization Debate",
    icon: "🧭",
    tagline: "Depersonalize the debate with a shared framework.",
    outcomeTemplate:
      "By the end of this meeting, [roadmap items] are ranked with an agreed rationale, and everyone understands why what's out is out.",
    before: [
      "Bring data/evidence for your position, not just opinion",
      "Know which constraints are fixed (deadline, budget, team size) vs. negotiable",
      "Pre-share the framework (RICE, impact/effort, etc.) you'll use to evaluate options",
      "Identify likely points of disagreement in advance so they aren't a surprise",
    ],
    during: [
      "Separate \"I disagree\" from \"I don't understand\" — ask clarifying questions before pushback",
      "Use the shared framework to depersonalize the debate",
      "Name trade-offs explicitly (\"choosing A means B slips to next quarter\")",
      "Watch for false consensus — silence isn't agreement, ask directly",
    ],
    after: [
      "Document the decision AND the reasoning, so it doesn't get relitigated in 2 weeks",
      "Communicate the outcome to anyone affected who wasn't in the room",
    ],
    largeGroupTip:
      "With many stakeholders debating priorities, capture disagreement on the framework criteria itself (not just the ranking) — it's easier to align on what \"high impact\" means than to argue rankings item by item.",
    shortMeetingTip:
      "A short prioritization session only works if the framework and data are pre-read — use the meeting time strictly for debate and decision, not for explaining the method.",
  },
  {
    slug: "post-mortem",
    name: "Post-Mortem / Incident Review",
    icon: "🩹",
    tagline: "Timeline and facts first, blameless by design.",
    outcomeTemplate:
      "By the end of this review, the team agrees on what happened, why, and has action items with owners and dates to prevent recurrence.",
    before: [
      "Gather timeline facts before the meeting, not during",
      "Explicitly frame the meeting as blameless in the invite and at the start",
      "Identify who needs to be in the room to speak to each part of the timeline",
      "Pre-draft a rough timeline so the meeting can correct/refine it instead of building from zero",
    ],
    during: [
      "Stick to the timeline before jumping to root cause",
      "Separate \"what happened\" from \"what we should change\"",
      "Redirect any blame-shaped language toward the system or process, not a person",
      "Ask \"what would have caught this sooner?\" for each stage of the timeline",
    ],
    after: [
      "Assign owners to action items with dates, not just a list of good intentions",
      "Share the write-up broadly, including what went well in the response",
    ],
    largeGroupTip:
      "With many responders and stakeholders present, appoint a single facilitator to hold the timeline-first structure — large post-mortems drift into root-cause debate fastest when no one is explicitly holding the process.",
    shortMeetingTip:
      "In a short review, pre-circulate the draft timeline so the meeting is spent validating and identifying action items, not building the timeline live.",
  },
];

export function getMeetingType(slug) {
  return meetingTypes.find((m) => m.slug === slug);
}
