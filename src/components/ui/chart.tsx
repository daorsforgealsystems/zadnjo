import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

type LegendPayload = RechartsPrimitive.LegendPayload

export type ChartItemConfig = {
  label?: React.ReactNode
  icon?: React.ComponentType<any>
  theme?: Partial<Record<keyof typeof THEMES, string>>
  color?: string
  nameKey?: string
  labelKey?: string
}

export type ChartConfig = Record<string, ChartItemConfig>

type ChartContextProps = { config: ChartConfig }

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be used within a <ChartContainer />")
  return ctx
}

type ChartContainerProps = Omit<React.ComponentProps<"div">, "children"> & {
  config: ChartConfig
  children: React.ReactElement
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        // Allow parent to control height. Keep a sensible min-height.
        className={cn(
          "w-full flex justify-center text-xs min-h-[160px] [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
  <RechartsPrimitive.ResponsiveContainer>{children as React.ReactElement}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle: React.FC<{ id: string; config: ChartConfig }> = ({ id, config }) => {
  const entries = Object.entries(config).filter(([_, v]) => v?.theme || v?.color)
  if (!entries.length) return null

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const vars = entries
        .map(([key, item]) => {
          const color = (item.theme && item.theme[theme as keyof typeof item.theme]) || item.color
          return color ? `  --color-${key}: ${color};` : null
        })
        .filter(Boolean)
        .join("\n")

      return `${prefix} [data-chart=${id}] {\n${vars}\n}`
    })
    .join("\n")

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

const ChartTooltip = RechartsPrimitive.Tooltip

type ChartTooltipContentProps = {
  active?: boolean
  payload?: LegendPayload[]
  className?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: React.ReactNode
  labelFormatter?: (value: React.ReactNode, payload?: LegendPayload[]) => React.ReactNode
  labelClassName?: string
  formatter?: (
    value: string | number | boolean,
    name: string,
    item: LegendPayload,
    index: number,
    payload?: LegendPayload[]
  ) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()
    const payloadItems = (payload as LegendPayload[] | undefined) ?? undefined

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payloadItems?.length) return null
      const item = payloadItems[0]
          const key = `${labelKey || item.dataKey || (item as any).name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value = !labelKey && typeof label === "string" ? config[label as keyof typeof config]?.label || label : itemConfig?.label

      if (labelFormatter) return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payloadItems)}</div>
      if (!value) return null
      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [label, labelFormatter, payloadItems, hideLabel, labelClassName, config, labelKey])

    if (!active || !payloadItems?.length) return null

    const nestLabel = payloadItems.length === 1 && indicator !== "dot"

    return (
      <div ref={ref} className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className)}>
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payloadItems.map((item: LegendPayload, index: number) => {
            const key = `${nameKey || (item as any).name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const payloadObj = (item.payload as Record<string, unknown> | undefined) ?? undefined
            const indicatorColor = color || (payloadObj && (payloadObj["fill"] as string | undefined)) || (item.color as string | undefined)

            return (
              <div
                key={String(item.dataKey ?? index)}
                className={cn("flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground", indicator === "dot" && "items-center")}
              >
                {formatter && item.value !== undefined && item.value !== null && (item as any).name ? (
                  formatter(item.value as string | number | boolean, (item as any).name as string, item, index, payloadItems)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          })}
                          style={{
                            ["--color-bg" as any]: indicatorColor,
                            ["--color-border" as any]: indicatorColor,
                          } as React.CSSProperties}
                        />
                      )
                    )}

                    <div className={cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center")}>
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">{itemConfig?.label || (item as any).name}</span>
                      </div>
                      {item.value !== undefined && item.value !== null && (
                        <span className="font-mono font-medium tabular-nums text-foreground">{String(item.value)}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { payload?: LegendPayload[]; verticalAlign?: "top" | "bottom" | "middle"; hideIcon?: boolean; nameKey?: string }
>(({ className, hideIcon = false, payload: legendPayload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart()
  const payload = (legendPayload as LegendPayload[] | undefined) ?? undefined
  if (!payload?.length) return null

  return (
    <div ref={ref} className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
      {payload.map((item: LegendPayload) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div key={String(item.value ?? item.dataKey ?? Math.random())} className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}>
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: (item.color as string) ?? undefined }} />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined

  const asAny = payload as any
  const innerPayload = asAny.payload && typeof asAny.payload === "object" ? (asAny.payload as Record<string, unknown>) : undefined

  let configLabelKey = key
  if (key in asAny && typeof asAny[key] === "string") {
    configLabelKey = asAny[key]
  } else if (innerPayload && key in innerPayload && typeof innerPayload[key] === "string") {
    configLabelKey = innerPayload[key] as string
  }

  return configLabelKey in config ? config[configLabelKey] : (config[key as keyof typeof config] as ChartItemConfig | undefined)
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle }
