import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getMeetingType, meetingTypes } from "../data/meetingTypes.js";

const DURATIONS = [15, 30, 45, 60];
const LARGE_GROUP_THRESHOLD = 8;

function ChecklistSection({ title, description, items, sectionKey, checked, onToggle }) {
  return (
    <div className="card p-5 sm:p-6">
      <p className="section-label">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => {
          const id = `${sectionKey}-${i}`;
          const isChecked = Boolean(checked[id]);
          return (
            <li key={id} className="flex items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => onToggle(id)}
                className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border transition ${
                  isChecked
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-300 bg-white hover:border-brand-400"
                }`}
              >
                {isChecked && (
                  <svg viewBox="0 0 12 10" className="h-2.5 w-3" fill="none">
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm leading-relaxed ${
                  isChecked ? "text-ink-400 line-through" : "text-ink-700"
                }`}
              >
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MeetingPage() {
  const { slug } = useParams();
  const meeting = getMeetingType(slug);

  const [duration, setDuration] = useState(30);
  const [attendeeCount, setAttendeeCount] = useState(6);
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);

  const toggleChecked = (id) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const isLargeGroup = attendeeCount >= LARGE_GROUP_THRESHOLD;
  const isShortMeeting = duration <= 30;

  const checklistText = useMemo(() => {
    if (!meeting) return "";
    const section = (title, items) =>
      `${title}\n${items.map((i) => `- [ ] ${i}`).join("\n")}`;

    const tips = [];
    if (isLargeGroup && meeting.largeGroupTip) tips.push(meeting.largeGroupTip);
    if (isShortMeeting && meeting.shortMeetingTip) tips.push(meeting.shortMeetingTip);

    return [
      `${meeting.name} — Meeting Prep`,
      `Duration: ${duration} min · Attendees: ${attendeeCount}`,
      "",
      `Outcome statement:\n${meeting.outcomeTemplate}`,
      "",
      section("Before", meeting.before),
      "",
      section("During", meeting.during),
      "",
      section("After", meeting.after),
      tips.length ? `\nTips for this setup:\n${tips.map((t) => `- ${t}`).join("\n")}` : "",
    ]
      .join("\n")
      .trim();
  }, [meeting, duration, attendeeCount, isLargeGroup, isShortMeeting]);

  if (!meeting) {
    return <Navigate to="/" replace />;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checklistText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-brand-600"
      >
        ← All meeting types
      </Link>

      <div className="mt-4 flex items-start gap-3">
        <span className="text-4xl" aria-hidden="true">
          {meeting.icon}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {meeting.name}
          </h1>
          <p className="mt-1 text-ink-500">{meeting.tagline}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6 rounded-xl border border-ink-200/70 bg-white p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Duration
          </span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Attendee count
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={attendeeCount}
            onChange={(e) =>
              setAttendeeCount(Math.max(1, Number(e.target.value) || 1))
            }
            className="w-24 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <button type="button" onClick={handleCopy} className="btn-primary ml-auto">
          {copied ? "Copied ✓" : "Copy checklist to clipboard"}
        </button>
      </div>

      {(isLargeGroup && meeting.largeGroupTip) ||
      (isShortMeeting && meeting.shortMeetingTip) ? (
        <div className="mt-6 space-y-2">
          {isLargeGroup && meeting.largeGroupTip && (
            <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <span className="font-semibold">Large group tip ({attendeeCount} attendees): </span>
              {meeting.largeGroupTip}
            </p>
          )}
          {isShortMeeting && meeting.shortMeetingTip && (
            <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <span className="font-semibold">Short meeting tip ({duration} min): </span>
              {meeting.shortMeetingTip}
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-6 card p-5 sm:p-6">
        <p className="section-label">Outcome statement</p>
        <p className="mt-2 text-lg font-medium leading-relaxed text-ink-800">
          {meeting.outcomeTemplate}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChecklistSection
          title="Before"
          items={meeting.before}
          sectionKey="before"
          checked={checked}
          onToggle={toggleChecked}
        />
        <ChecklistSection
          title="During"
          items={meeting.during}
          sectionKey="during"
          checked={checked}
          onToggle={toggleChecked}
        />
        <ChecklistSection
          title="After"
          items={meeting.after}
          sectionKey="after"
          checked={checked}
          onToggle={toggleChecked}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-ink-200/70 pt-6">
        <span className="text-sm text-ink-400">Other meeting types:</span>
        {meetingTypes
          .filter((m) => m.slug !== meeting.slug)
          .map((m) => (
            <Link
              key={m.slug}
              to={`/meeting/${m.slug}`}
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-700"
            >
              {m.icon} {m.name}
            </Link>
          ))}
      </div>
    </div>
  );
}
