"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-emerald-600" />,
        info: <InfoIcon className="size-5 text-[hsl(var(--primary))]" />,
        warning: <TriangleAlertIcon className="size-5 text-amber-500" />,
        error: <OctagonXIcon className="size-5 text-[hsl(var(--destructive))]" />,
        loading: <Loader2Icon className="size-5 animate-spin text-[hsl(var(--primary))]" />,
      }}
      style={
        {
          // The site stores colours as raw HSL components, so they must be
          // wrapped in hsl(); otherwise the toast background is invalid and
          // renders transparent.
          "--normal-bg": "hsl(var(--card))",
          "--normal-text": "hsl(var(--card-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--border-radius": "var(--radius)",
          // Sit above everything (modals, sticky headers, etc.).
          zIndex: 999999,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast group !bg-[hsl(var(--card))] !text-[hsl(var(--card-foreground))] !border !border-[hsl(var(--primary)/0.25)] !rounded-[var(--radius)] !shadow-xl !p-4 !gap-3",
          title: "!font-semibold !text-[hsl(var(--card-foreground))]",
          description: "!text-[hsl(var(--muted-foreground))]",
          actionButton:
            "!bg-[hsl(var(--primary))] !text-[hsl(var(--primary-foreground))]",
          cancelButton:
            "!bg-[hsl(var(--secondary))] !text-[hsl(var(--secondary-foreground))]",
          closeButton:
            "!bg-[hsl(var(--card))] !border-[hsl(var(--border))] !text-[hsl(var(--card-foreground))]",
          success: "!border-l-4 !border-l-emerald-500",
          error: "!border-l-4 !border-l-[hsl(var(--destructive))]",
          warning: "!border-l-4 !border-l-amber-500",
          info: "!border-l-4 !border-l-[hsl(var(--primary))]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, Sonner }
