import type { CSSProperties, ReactNode } from "react";

import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { theme } from "@offline/ui";

import "../styles.css";
import { NotFoundPage } from "../components/not-found-page";

export interface RouterContext {
  queryClient: QueryClient;
}

const themeStyle = theme.web.cssVariables as CSSProperties;

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "offline-test",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function RootDocument(props: { children: ReactNode }) {
  return (
    <html lang="en" style={themeStyle}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {props.children}
        <Scripts />
      </body>
    </html>
  );
}
