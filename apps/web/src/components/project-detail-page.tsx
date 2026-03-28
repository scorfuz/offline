import { Link } from "@tanstack/react-router";

import { useProjectQuery, useTechUsersQuery } from "../lib/projects-client";
import { useAuthSessionQuery } from "../lib/auth-client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { CommentThread } from "./comment-thread";

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const { data: project, isLoading, error } = useProjectQuery(projectId);
  const { data: techs = [] } = useTechUsersQuery();
  const { data: session } = useAuthSessionQuery();

  const currentUserId =
    session?.type === "authenticated" ? session.user.id : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading project...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load project: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Project not found.
        </CardContent>
      </Card>
    );
  }

  const techName = project.assignedTechId
    ? (techs.find((t) => t.id === project.assignedTechId)?.displayName ??
      techs.find((t) => t.id === project.assignedTechId)?.email ??
      "Unknown")
    : "Unassigned";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="outline" size="sm">
            ← Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <CardDescription className="mt-1">
                Created {new Date(project.createdAt).toLocaleDateString()}
                {project.updatedAt !== project.createdAt &&
                  ` · Updated ${new Date(project.updatedAt).toLocaleDateString()}`}
              </CardDescription>
            </div>
            <Badge variant={statusBadgeVariant(project.status)}>
              {statusLabel(project.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="mt-1">{project.description}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Assigned Tech
            </h3>
            <p className="mt-1">{techName}</p>
          </div>
        </CardContent>
      </Card>

      <CommentThread projectId={projectId} currentUserId={currentUserId} />
    </div>
  );
}
