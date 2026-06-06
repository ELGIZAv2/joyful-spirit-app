// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { Navigate, useParams, useLocation } from "react-router-dom";

export default function MegsyPrRedirect() {
  const { projectId } = useParams();
  const location = useLocation();
  const rest = location.pathname.replace(/^\/megsy-pr\/[^/]+/, "");
  const target = projectId ? `/build/${projectId}${rest || ""}${location.search}` : "/build";
  return <Navigate to={target} replace />;
}
