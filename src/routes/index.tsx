import { createFileRoute } from "@tanstack/react-router";
import { PennyGame } from "@/components/PennyGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PennyGame />;
}
