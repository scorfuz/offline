import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "./index";
import { ProjectDetailPage } from "../components/project-detail-page";

export const Route = createFileRoute("/projects/$projectId")({
  beforeLoad: requireAuth,
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ProjectDetailPage projectId={projectId} />
      </div>
    </main>
  );
}
