"use client";

import { useState } from "react";
import { useListShoots } from "@workspace/api-client-react";
import type { Shoot } from "@workspace/api-client-react";
import Link from "next/link";
import { Camera, CalendarDays, MapPin, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Postponed: "bg-amber-50 text-amber-700 border border-amber-200",
};

function ShootCard({ shoot }: { shoot: Shoot }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFF1F0" }}>
            <Camera className="w-5 h-5" style={{ color: "#E0533C" }} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{shoot.clientName || `Shoot #${shoot.id}`}</h3>
            <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{shoot.shootDate}</span>
              {shoot.shootTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{shoot.shootTime}</span>}
              {shoot.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{shoot.venue}</span>}
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLORS[shoot.status] || "bg-slate-100 text-slate-600"}`}>
          {shoot.status}
        </span>
      </div>
      {shoot.functions && shoot.functions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {shoot.functions.map((fn, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#E0533C] border border-orange-200">{fn}</span>
          ))}
        </div>
      )}
      {shoot.specialInstructions && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 leading-relaxed">{shoot.specialInstructions}</p>
        </div>
      )}
    </div>
  );
}

export default function TeamPlanner() {
  const { data: shoots, isLoading } = useListShoots();
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const filtered = shoots?.filter(s => filter === "all" ? true : s.shootDate >= today && s.status === "Scheduled") || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Planner</h1>
          <p className="text-slate-500 text-sm mt-0.5">Shoot overview and crew assignments</p>
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(["upcoming", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {f === "upcoming" ? "Upcoming" : "All Shoots"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="text-slate-400 text-sm">Loading shoots...</div> : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Camera className="w-12 h-12 mx-auto mb-4 text-slate-200" />
          <p className="font-semibold text-slate-500">No {filter === "upcoming" ? "upcoming " : ""}shoots found.</p>
          <p className="text-sm text-slate-400 mt-1">Add shoots from the Shoots module.</p>
          <Link href="/shoots">
            <button className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#E0533C" }}>Go to Shoots</button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(shoot => <ShootCard key={shoot.id} shoot={shoot} />)}
        </div>
      )}
    </div>
  );
}
