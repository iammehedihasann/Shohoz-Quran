import { Link } from "react-router-dom";
import { Seo } from "../components/common/Seo";
export default function NotFound() {
  return (
    <div className="empty-state">
      <Seo
        title="Page not found"
        description="This page could not be found. Return to the Hafezi Quran homepage."
        noindex
      />
      <span className="eyebrow">404</span>
      <h1>Let’s find your way back.</h1>
      <p>This page does not exist.</p>
      <Link className="button primary" to="/">
        Return home
      </Link>
    </div>
  );
}
