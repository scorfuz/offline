import { type ReactNode, useState } from "react";
import { ArrowRight, Layers, ShieldCheck } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";

import { useLoginMutation } from "../lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);

      try {
        const result = await loginMutation.mutateAsync(value);

        if (result.type === "authenticated") {
          navigate({ to: "/" });
          return;
        }

        setError("Login failed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    },
  });

  const isLoading = loginMutation.isPending;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_30px_80px_-40px_rgba(43,36,29,0.45)] backdrop-blur lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(175,93,42,0.18),transparent_35%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="space-y-6">
              <Badge className="w-fit">offline-test</Badge>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Your starting point for full-stack apps
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  A production-ready monorepo with authentication, RBAC, and
                  everything you need to ship fast.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ValueCard
                icon={<Layers className="size-4" />}
                title="Full-stack monorepo"
                description="TanStack Start web, Expo mobile, and Node.js API — all wired up with shared packages."
              />
              <ValueCard
                icon={<ShieldCheck className="size-4" />}
                title="Auth & RBAC built in"
                description="Role-based access control with admin, tech, and manager roles."
              />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-md border-border/80 bg-card/96">
            <CardHeader className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Welcome back
              </Badge>
              <div className="space-y-1.5">
                <CardTitle className="text-3xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to continue.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void form.handleSubmit();
                }}
              >
                <form.Field
                  name="email"
                  validators={{
                    onSubmit: ({ value }) =>
                      value.trim().length === 0
                        ? "Email is required"
                        : undefined,
                  }}
                >
                  {(field) => {
                    const [fieldError] = field.state.meta.errors;

                    return (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Email</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="you@example.com"
                          autoFocus
                        />
                        {typeof fieldError === "string" ? (
                          <p className="text-sm text-destructive">
                            {fieldError}
                          </p>
                        ) : null}
                      </div>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="password"
                  validators={{
                    onSubmit: ({ value }) =>
                      value.trim().length === 0
                        ? "Password is required"
                        : undefined,
                  }}
                >
                  {(field) => {
                    const [fieldError] = field.state.meta.errors;

                    return (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Password</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="••••••••"
                        />
                        {typeof fieldError === "string" ? (
                          <p className="text-sm text-destructive">
                            {fieldError}
                          </p>
                        ) : null}
                      </div>
                    );
                  }}
                </form.Field>

                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to sign in</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ValueCard(props: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-5 backdrop-blur-sm">
      <div className="mb-3 inline-flex rounded-full bg-primary/10 p-2 text-primary">
        {props.icon}
      </div>
      <h2 className="mb-2 text-lg font-semibold">{props.title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">
        {props.description}
      </p>
    </div>
  );
}
