import type { Metadata } from "next";

import { TopicBank } from "./topic-bank";

export const metadata: Metadata = { title: "Topics" };

export default function TopicsPage() {
  return <TopicBank />;
}
