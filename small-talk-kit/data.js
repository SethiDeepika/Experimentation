// Built-in library: used instantly for "I'm stuck" moments, and as a fallback kit
// whenever the Groq proxy can't be reached.

export const EVENTS = [
  {
    id: "team-meeting",
    icon: "🗓️",
    label: "Before a work meeting",
    kit: {
      summary: "Those two minutes before the agenda starts are low stakes: one easy question is plenty.",
      openers: [
        { line: "How's your week going so far? Busy one?", why: "Everyone has an answer, and it's never too personal." },
        { line: "Did you end up doing anything fun over the weekend?", why: "Invites a story without putting them on the spot." },
        { line: "Are you working on anything interesting outside this project right now?", why: "Work-adjacent, so it feels natural in the room." },
      ],
      about_me:
        "I'm on the [team] side, mostly working on [one thing]. Lately I've been spending a lot of time on [current project].",
      follow_ups: [
        "Oh nice, how did that go?",
        "Is that something you do often?",
        "What's the part of it you're enjoying most?",
        "How did you get into that?",
      ],
      rescue_lines: [
        "Anyone tried the new coffee place downstairs?",
        "I think we're still waiting on a couple of people, so how's everyone doing?",
        "Did anyone else's calendar explode this week?",
      ],
      exits: [
        "Looks like we're about to start. Let's catch up after.",
        "I'll grab a seat before it fills up. Good talking to you!",
        "Let me get my laptop set up. Tell me how that goes, though.",
      ],
      avoid: ["Complaining about the meeting or colleagues", "Deep personal questions", "Politics"],
    },
  },
  {
    id: "video-call",
    icon: "💻",
    label: "Video call small talk",
    kit: {
      summary: "On video, silence feels louder than it is. Keep a light question ready and let others pick it up.",
      openers: [
        { line: "Where are you dialling in from today?", why: "A classic video-call opener, and easy for anyone to answer." },
        { line: "How's the weather where you are?", why: "Harmless, and it often leads somewhere." },
        { line: "Is that a [plant/painting/guitar] behind you? I love it.", why: "Their background is a ready-made topic." },
      ],
      about_me: "I'm [role] on [team]. Right now I'm mostly focused on [project].",
      follow_ups: [
        "How long have you been there?",
        "Do you mostly work from home these days?",
        "What's the best thing about working from there?",
        "Is it a busy time of year for you?",
      ],
      rescue_lines: [
        "While we wait for everyone, anyone have plans for the weekend?",
        "I'll give it one more minute for others to join.",
        "Has anyone watched anything good lately?",
      ],
      exits: [
        "Should we get started? I'm conscious of time.",
        "I'll drop the agenda in the chat so we can kick off.",
        "Let's dive in. Thanks for the chat!",
      ],
      avoid: ["Commenting on how someone looks on camera", "Asking why their camera is off", "Long tangents while others wait"],
    },
  },
  {
    id: "happy-hour",
    icon: "🍻",
    label: "Work happy hour / offsite",
    kit: {
      summary: "You don't need to work the whole room. Two or three good conversations make it a success.",
      openers: [
        { line: "I don't think we've properly met. I'm [name], I work on [team].", why: "A simple, clear intro that's very hard to get wrong." },
        { line: "Have you been to one of these before? What are they usually like?", why: "Makes them the expert, and it's fine to admit you're new." },
        { line: "What are you drinking? Is it any good?", why: "Uses what's right in front of you." },
      ],
      about_me:
        "I'm on [team], mostly working on [thing]. Outside work I've been getting into [hobby], slowly.",
      follow_ups: [
        "How long have you been with the company?",
        "What does a normal day look like for you?",
        "Any plans for the holidays / summer?",
        "What got you into that?",
      ],
      rescue_lines: [
        "So what's been the highlight of your month?",
        "Have you tried the food yet? Anything worth getting?",
        "What's keeping you busy outside of work these days?",
      ],
      exits: [
        "I'm going to grab another drink. Really nice meeting you.",
        "I promised I'd say hi to [colleague]. Let's catch up again soon.",
        "I'm heading out soon, but I'm glad we finally talked.",
      ],
      avoid: ["Gossip about colleagues", "Drinking to cope with nerves", "Shop talk for the entire conversation"],
    },
  },
  {
    id: "networking",
    icon: "🤝",
    label: "Networking event / conference",
    kit: {
      summary: "Everyone there came to meet people, so you're not interrupting. You're doing exactly what the event is for.",
      openers: [
        { line: "What brings you to this one?", why: "Everyone has a reason, and it tells you what to ask next." },
        { line: "Have you been to any good talks so far?", why: "The shared setting makes it an easy starting point." },
        { line: "Mind if I join you? I don't know anyone here yet.", why: "Being honest is disarming, and most people feel the same." },
      ],
      about_me:
        "I'm a [role] working on [area]. I'm here mostly to learn about [topic] and meet people working on it.",
      follow_ups: [
        "What are you working on at the moment?",
        "What's the most interesting thing you've heard today?",
        "How did you end up in this field?",
        "Is there anyone here you're hoping to meet?",
      ],
      rescue_lines: [
        "What's one thing you're hoping to take away from today?",
        "Any talks you'd recommend for this afternoon?",
        "Is this your first time at this conference?",
      ],
      exits: [
        "I want to catch the next session, but can I connect with you on LinkedIn?",
        "I'll let you mingle. It was really great to meet you.",
        "I'm going to grab a coffee before the next talk. Enjoy the rest of the day!",
      ],
      avoid: ["Pitching or selling in the first minute", "Only looking at name badges", "Hovering silently at the edge of a group"],
    },
  },
  {
    id: "client-dinner",
    icon: "🍽️",
    label: "Client or business dinner",
    kit: {
      summary: "At a business dinner, small talk builds trust. Curiosity counts for more than clever remarks.",
      openers: [
        { line: "Have you been to this restaurant before? Anything you'd recommend?", why: "Easy, shared, and it gets you through ordering." },
        { line: "How was the trip in?", why: "A gentle, safe way to warm up." },
        { line: "What's been keeping your team busy lately?", why: "Professional, but lets them choose how deep to go." },
      ],
      about_me:
        "I've been with [company] for [time], mostly on [area]. It's been a fun stretch because [one genuine thing].",
      follow_ups: [
        "How did you get started in the industry?",
        "Do you get to travel much for work?",
        "What do you like to do when you're not working?",
        "That sounds tough. How did you handle it?",
      ],
      rescue_lines: [
        "Any big plans for the rest of the year?",
        "Have you been anywhere good on holiday recently?",
        "This place is lovely. How did you find it?",
      ],
      exits: [
        "Thank you so much for tonight. This was really lovely.",
        "I should head off, but let's pick this up next week.",
        "I'm going to call it a night. Safe travels home!",
      ],
      avoid: ["Talking money or deal terms at the table unless they bring it up", "Politics and religion", "Over-sharing after a drink"],
    },
  },
  {
    id: "party",
    icon: "🎉",
    label: "Party where I only know the host",
    kit: {
      summary: "The host is the thing you have in common with every guest. Start there and let the conversation build.",
      openers: [
        { line: "How do you know [host]?", why: "The most natural party question there is." },
        { line: "Have you tried the [dish]? I can't stop eating it.", why: "Food is a safe, easy topic." },
        { line: "I love this playlist. Do you know who picked it?", why: "It comments on something you're both experiencing." },
      ],
      about_me:
        "[Host] and I met through [how]. I work in [field], but lately I've mostly been into [hobby].",
      follow_ups: [
        "Oh fun, have you known each other long?",
        "Do you live around here?",
        "What's been keeping you busy lately?",
        "Wait, tell me more about that.",
      ],
      rescue_lines: [
        "Seen anything good on TV lately?",
        "Any fun plans coming up?",
        "Have you been to one of [host]'s parties before?",
      ],
      exits: [
        "I'm going to go find [host] and say hi. Great chatting!",
        "I need a refill. Can I get you anything?",
        "I'm heading out soon. So nice meeting you!",
      ],
      avoid: ["Standing in the corner on your phone", "Interview mode, with question after question", "Heavy topics early on"],
    },
  },
  {
    id: "family",
    icon: "🏡",
    label: "Family gathering",
    kit: {
      summary: "With family, the hard part is usually the questions coming your way. Have your answers ready and steer back to them.",
      openers: [
        { line: "How have you been? It feels like ages.", why: "Warm, open, and it gives them the floor." },
        { line: "What's new with [kids/work/garden]?", why: "Shows you remember what matters to them." },
        { line: "Can I help with anything in the kitchen?", why: "Doing something together is easier than face-to-face chat." },
      ],
      about_me:
        "Work's good. I'm busy with [one thing]. Honestly the highlight lately has been [something light].",
      follow_ups: [
        "How's that going?",
        "What was that like?",
        "Have you got any trips planned?",
        "How's everyone else doing?",
      ],
      rescue_lines: [
        "Has anyone got photos from [recent event]?",
        "What's everyone watching these days?",
        "Remember when we [shared memory]?",
      ],
      exits: [
        "I'm going to get some air for a bit. Back in a minute.",
        "Let me go help with the dishes.",
        "I'm going to head home, but this was lovely. Thanks for having me.",
      ],
      avoid: ["Rehashing old arguments", "Politics at the table", "Answering personal questions you're not comfortable with (a vague, friendly answer is enough)"],
    },
  },
  { id: "custom", icon: "✏️", label: "Something else", kit: null },
];

export const ENERGY_PLANS = {
  low: [
    "Arrive a little early. Smaller groups are easier than a full room.",
    "Set one goal only: one real conversation. Anything more is a bonus.",
    "Take a 5-minute break (restroom, fresh air) after each conversation.",
    "Choose a leaving time in advance and stick to it without guilt.",
  ],
  medium: [
    "Arrive on time and say hi to the host or organiser first.",
    "Aim for 2–3 conversations; it's fine to stay with a good one.",
    "Take a short recharge break around the halfway point.",
    "Leave while you still feel okay, not once you're completely drained.",
  ],
  high: [
    "Use your energy to introduce yourself to someone standing alone.",
    "Aim for 3–4 conversations and introduce people to each other.",
    "Follow up with one person afterwards (a message or a LinkedIn connection).",
    "Still plan a wind-down afterwards; high energy runs out fast.",
  ],
};

export const SITUATIONS = [
  {
    id: "silence",
    icon: "🤐",
    label: "Awkward silence",
    lines: [
      "So, what's been the best part of your week?",
      "I keep meaning to ask: how did you get into what you do?",
      "Have you got anything fun planned for the weekend?",
    ],
    tip: "Pauses feel longer to you than to them. Take a sip, smile, then ask about something you can both see.",
  },
  {
    id: "what-do-you-do",
    icon: "💼",
    label: "“So, what do you do?”",
    lines: [
      "I'm a [role]. Basically I help [who] do [what]. What about you?",
      "I work on [thing] at [company]. The fun part lately has been [one detail].",
      "Short version: [one sentence]. Honestly I'd rather hear about you. What keeps you busy?",
    ],
    tip: "One sentence plus a question back is plenty. You don't owe anyone your full CV.",
  },
  {
    id: "forgot-name",
    icon: "🙈",
    label: "I forgot their name",
    lines: [
      "I'm so sorry, I'm terrible with names. Remind me of yours?",
      "Have you met [friend]? (then let them introduce themselves)",
      "Can I grab your LinkedIn? How do you spell your name?",
    ],
    tip: "Everyone forgets names. Asking early is far less awkward than dodging it for an hour.",
  },
  {
    id: "join-group",
    icon: "👥",
    label: "Joining a group already talking",
    lines: [
      "Mind if I join you?",
      "That sounds interesting. What are we talking about?",
      "(Stand nearby, listen, nod, and wait for a natural pause before speaking.)",
    ],
    tip: "Groups of three or more that are standing loosely are usually open. Listen first, then add one comment.",
  },
  {
    id: "exit",
    icon: "🚪",
    label: "I want to leave this conversation",
    lines: [
      "I'm going to grab a drink. It was really nice talking to you.",
      "I promised I'd say hi to someone, but I'm glad we chatted.",
      "I'll let you mingle. Enjoy the rest of the evening!",
    ],
    tip: "End on something positive and move away straight after. Hanging around afterwards is what makes exits awkward.",
  },
  {
    id: "monologue",
    icon: "🗣️",
    label: "They won't stop talking",
    lines: [
      "That's fascinating. It actually reminds me of [related thing].",
      "Wow, sounds like a lot! I'm going to grab some water, but good luck with it.",
      "Hold that thought. Have you met [person]? They'd love this.",
    ],
    tip: "You're allowed to leave. Wait for them to take a breath, then say something warm and step away.",
  },
  {
    id: "said-something-awkward",
    icon: "😬",
    label: "I just said something awkward",
    lines: [
      "Ha, that came out wrong. What I meant was…",
      "Okay, let me try that again.",
      "Anyway! (smile) You were saying about…",
    ],
    tip: "Owning it lightly and moving on makes you more relatable. Nobody remembers it as much as you do.",
  },
  {
    id: "senior-person",
    icon: "🎖️",
    label: "Talking to someone senior",
    lines: [
      "I really enjoyed your point about [topic] earlier. How did you arrive at that?",
      "What's something you wish you'd known earlier in your career?",
      "What are you most excited about for the team this year?",
    ],
    tip: "Senior people like thoughtful questions. Keep it short and thank them for their time.",
  },
];
