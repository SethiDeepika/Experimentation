import { Link } from "react-router-dom";

export default function MeetingCard({ meeting }) {
  return (
    <Link
      to={`/meeting/${meeting.slug}`}
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <span className="text-3xl" aria-hidden="true">
        {meeting.icon}
      </span>
      <div>
        <h3 className="text-base font-bold text-ink-900 group-hover:text-brand-700">
          {meeting.name}
        </h3>
        <p className="mt-1 text-sm text-ink-500">{meeting.tagline}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
        Get checklist
        <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
