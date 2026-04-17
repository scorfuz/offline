import { useEffect, useState } from "react";

import type { ProjectType, ProjectStatusType } from "@offline/contracts";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useTechUsersQuery,
} from "../lib/projects-client";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectType | null;
}

const STATUS_OPTIONS: { value: ProjectStatusType; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: ProjectFormDialogProps) {
  const isEditing = !!project;
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const { data: techs = [] } = useTechUsersQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatusType>("open");
  const [assignedTechId, setAssignedTechId] = useState<string>("unassigned");

  useEffect(() => {
    if (open) {
      setTitle(project?.title ?? "");
      setDescription(project?.description ?? "");
      setStatus((project?.status as ProjectStatusType) ?? "open");
      setAssignedTechId(project?.assignedTechId ?? "unassigned");
    }
  }, [open, project]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const techId = assignedTechId === "unassigned" ? null : assignedTechId;

    if (isEditing) {
      updateMutation.mutate(
        {
          id: project.id,
          title,
          description,
          status,
          assignedTechId: techId,
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(
        { title, description, status, assignedTechId: techId },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Project" : "Create Project"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the project details."
                : "Create a new project and assign it to a tech."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatusType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignedTech">Assigned Tech</Label>
              <Select value={assignedTechId} onValueChange={setAssignedTechId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tech..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {techs.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.displayName ?? tech.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
