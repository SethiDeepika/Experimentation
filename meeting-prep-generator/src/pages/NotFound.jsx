import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start px-4 py-20 sm:px-6">
      <span className="text-4xl" aria-hidden="true">
        🤔
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-ink-900">
        That page doesn't exist
      </h1>
      <p className="mt-2 text-ink-500">
        Let's get you back to the meeting types.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </div>
  );
}
