import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "./index";
import { ProjectsPage } from "../components/projects-page";

export const Route = createFileRoute("/projects")({
  beforeLoad: requireAuth,
  component: ProjectsPageRoute,
});

function ProjectsPageRoute() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ProjectsPage />
      </div>
    </main>
  );
}
