import { CircleAlert, RotateCcw } from "lucide-react";
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> Preparing your page…
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <CircleAlert size={28} />
      <h2>We couldn’t load this content</h2>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          <RotateCcw size={16} /> Try again
        </button>
      )}
    </div>
  );
}
