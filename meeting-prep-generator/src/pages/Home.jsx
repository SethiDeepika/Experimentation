import { meetingTypes } from "../data/meetingTypes.js";
import MeetingCard from "../components/MeetingCard.jsx";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="section-label">For Product Managers</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          Walk into any meeting with the right prep, not a generic agenda.
        </h1>
        <p className="mt-4 text-lg text-ink-500">
          Pick the type of meeting you're running or attending and get a
          tailored outcome statement, before/during/after checklist, and
          tactics built for that specific room.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meetingTypes.map((meeting) => (
          <MeetingCard key={meeting.slug} meeting={meeting} />
        ))}
      </div>
    </div>
  );
}
