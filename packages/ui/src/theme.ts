export interface ThemeColorTokens {
  readonly canvas: string;
  readonly surface: string;
  readonly border: string;
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
}

export interface ThemeSemanticColors {
  readonly background: string;
  readonly foreground: string;
  readonly card: string;
  readonly cardForeground: string;
  readonly popover: string;
  readonly popoverForeground: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly secondary: string;
  readonly secondaryForeground: string;
  readonly muted: string;
  readonly mutedForeground: string;
  readonly accent: string;
  readonly accentForeground: string;
  readonly destructive: string;
  readonly destructiveForeground: string;
  readonly border: string;
  readonly input: string;
  readonly ring: string;
}

export interface ThemeRadiusTokens {
  readonly base: string;
}

export interface WebThemeVariables {
  readonly "--background": string;
  readonly "--foreground": string;
  readonly "--card": string;
  readonly "--card-foreground": string;
  readonly "--popover": string;
  readonly "--popover-foreground": string;
  readonly "--primary": string;
  readonly "--primary-foreground": string;
  readonly "--secondary": string;
  readonly "--secondary-foreground": string;
  readonly "--muted": string;
  readonly "--muted-foreground": string;
  readonly "--accent": string;
  readonly "--accent-foreground": string;
  readonly "--destructive": string;
  readonly "--destructive-foreground": string;
  readonly "--border": string;
  readonly "--input": string;
  readonly "--ring": string;
  readonly "--radius": string;
}

export interface ThemeDefinition {
  readonly color: ThemeColorTokens;
  readonly semantic: ThemeSemanticColors;
  readonly radius: ThemeRadiusTokens;
  readonly web: {
    readonly cssVariables: WebThemeVariables;
  };
}

const color = {
  canvas: "#f3ede4",
  surface: "#fffaf4",
  border: "#e4d7c7",
  ink: "#2b241d",
  muted: "#6f6254",
  accent: "#af5d2a",
} as const satisfies ThemeColorTokens;

const semantic = {
  background: "#f5efe7",
  foreground: color.ink,
  card: color.surface,
  cardForeground: color.ink,
  popover: color.surface,
  popoverForeground: color.ink,
  primary: color.accent,
  primaryForeground: color.surface,
  secondary: "#eadfce",
  secondaryForeground: color.ink,
  muted: "#efe6da",
  mutedForeground: color.muted,
  accent: "#f8efe7",
  accentForeground: color.accent,
  destructive: "#b42318",
  destructiveForeground: "#fff7f3",
  border: color.border,
  input: "#fbf7f2",
  ring: color.accent,
} as const satisfies ThemeSemanticColors;

const radius = {
  base: "1rem",
} as const satisfies ThemeRadiusTokens;

export const webThemeVariables = {
  "--background": semantic.background,
  "--foreground": semantic.foreground,
  "--card": semantic.card,
  "--card-foreground": semantic.cardForeground,
  "--popover": semantic.popover,
  "--popover-foreground": semantic.popoverForeground,
  "--primary": semantic.primary,
  "--primary-foreground": semantic.primaryForeground,
  "--secondary": semantic.secondary,
  "--secondary-foreground": semantic.secondaryForeground,
  "--muted": semantic.muted,
  "--muted-foreground": semantic.mutedForeground,
  "--accent": semantic.accent,
  "--accent-foreground": semantic.accentForeground,
  "--destructive": semantic.destructive,
  "--destructive-foreground": semantic.destructiveForeground,
  "--border": semantic.border,
  "--input": semantic.input,
  "--ring": semantic.ring,
  "--radius": radius.base,
} as const satisfies WebThemeVariables;

export const theme = {
  color,
  semantic,
  radius,
  web: {
    cssVariables: webThemeVariables,
  },
} as const satisfies ThemeDefinition;

export const tokens = theme;
