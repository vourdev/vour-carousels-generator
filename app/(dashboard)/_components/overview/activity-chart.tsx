"use client";

import { useMemo, useState } from "react";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface ActivityPoint {
  /** yyyy-mm-dd, local time. */
  date: string;
  exported: number;
  scheduled: number;
  posted: number;
}

const chartConfig = {
  exported: { label: "Diekspor", color: "var(--chart-2)" },
  scheduled: { label: "Terjadwal", color: "var(--chart-3)" },
  posted: { label: "Diposting", color: "var(--chart-1)" },
} satisfies ChartConfig;

const RANGES = { "14": 14, "30": 30, "90": 90 } as const;
type Range = keyof typeof RANGES;

const dayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

/**
 * Production per day: decks exported on the day they were made, and scheduled/posted on
 * the day they go out. The window ends 14 days ahead so upcoming posts are visible too.
 */
export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const [range, setRange] = useState<Range>("30");
  const visible = useMemo(() => data.slice(-RANGES[range]), [data, range]);
  const total = visible.reduce((n, d) => n + d.exported + d.scheduled + d.posted, 0);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Aktivitas konten</CardTitle>
        <CardDescription>
          {total} carousel dalam {RANGES[range]} hari (termasuk 14 hari ke depan)
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={range}
            onValueChange={(v) => v && setRange(v as Range)}
            aria-label="Rentang waktu"
          >
            <ToggleGroupItem value="14">14 hari</ToggleGroupItem>
            <ToggleGroupItem value="30">30 hari</ToggleGroupItem>
            <ToggleGroupItem value="90">90 hari</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={visible} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(v: string) => dayLabel.format(new Date(`${v}T00:00:00`))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => dayLabel.format(new Date(`${String(v)}T00:00:00`))}
                  indicator="dot"
                />
              }
            />
            <Bar dataKey="exported" stackId="a" fill="var(--color-exported)" />
            <Bar dataKey="scheduled" stackId="a" fill="var(--color-scheduled)" />
            <Bar dataKey="posted" stackId="a" fill="var(--color-posted)" radius={[3, 3, 0, 0]} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
