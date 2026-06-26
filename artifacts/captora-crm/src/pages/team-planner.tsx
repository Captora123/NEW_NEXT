import { useListShoots } from "@workspace/api-client-react";
import type { Shoot } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, CalendarDays, MapPin } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-500/10 text-blue-400",
  Completed: "bg-green-500/10 text-green-400",
  Cancelled: "bg-destructive/10 text-destructive",
  Postponed: "bg-yellow-500/10 text-yellow-400",
};

function ShootCard({ shoot }: { shoot: Shoot }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{shoot.clientName || `Shoot #${shoot.id}`}</h3>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {shoot.shootDate}{shoot.shootTime ? ` @ ${shoot.shootTime}` : ""}
            </span>
            {shoot.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {shoot.venue}
              </span>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[shoot.status] || "bg-muted text-muted-foreground"}`}>
          {shoot.status}
        </span>
      </div>

      {shoot.functions && shoot.functions.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Functions</p>
          <div className="flex flex-wrap gap-1.5">
            {shoot.functions.map((fn, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">{fn}</span>
            ))}
          </div>
        </div>
      )}

      {shoot.specialInstructions && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2">{shoot.specialInstructions}</p>
        </div>
      )}
    </div>
  );
}

export default function TeamPlanner() {
  const { data: shoots, isLoading } = useListShoots();
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const filtered = shoots?.filter(s =>
    filter === "all" ? true : s.shootDate >= today && s.status === "Scheduled"
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of shoots and their details</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "upcoming" ? "default" : "outline"} size="sm" onClick={() => setFilter("upcoming")}>
            Upcoming
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All Shoots
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading shoots...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No {filter === "upcoming" ? "upcoming " : ""}shoots found.</p>
          <p className="text-sm mt-1">Add shoots from the Shoots module.</p>
          <Link href="/shoots">
            <Button className="mt-4" variant="outline">Go to Shoots</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(shoot => (
            <ShootCard key={shoot.id} shoot={shoot} />
          ))}
        </div>
      )}
    </div>
  );
}
