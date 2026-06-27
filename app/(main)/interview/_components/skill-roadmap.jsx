"use client";

import { useState } from "react";
import {
  Loader2,
  Sparkles,
  BookOpen,
  CheckSquare,
  ExternalLink,
  Map,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { generateSkillRoadmap } from "@/actions/interview";
import { toast } from "sonner";

// ─── Resource Type Badge Colors ─────────────────────────────────
const resourceTypeColors = {
  Article: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Video:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Documentation:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Tutorial:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Practice:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

// ─── Week Progress Colors ───────────────────────────────────────
const weekColors = [
  "border-l-blue-500",
  "border-l-green-500",
  "border-l-purple-500",
  "border-l-orange-500",
];

export default function SkillRoadmap({ assessmentId, quizScore }) {
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setRoadmap(null);
    try {
      const result = await generateSkillRoadmap(assessmentId);
      setRoadmap(result);
      toast.success("Learning roadmap generated!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Generate Button (not yet generated) ───────────────────────
  if (!roadmap && !isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Map className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Learning Roadmap</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Get a personalized 4-week learning plan based on the questions you
            got wrong.
          </p>
          <Button onClick={handleGenerate} className="gap-2" size="sm">
            <Sparkles className="h-4 w-4" />
            Generate Roadmap
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Loading State ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Creating your personalized learning roadmap…
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Roadmap Display ───────────────────────────────────────────
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            {roadmap.title}
          </CardTitle>
          {roadmap.summary && (
            <CardDescription>{roadmap.summary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["week-1"]} className="space-y-3">
            {roadmap.weeks?.map((week, index) => (
              <AccordionItem
                key={`week-${week.week}`}
                value={`week-${week.week}`}
                className={`border rounded-lg px-4 border-l-4 ${
                  weekColors[index] || "border-l-primary"
                }`}
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold shrink-0">
                      {week.week}
                    </div>
                    <div>
                      <div className="font-medium">{week.topic}</div>
                      <div className="text-xs text-muted-foreground">
                        Week {week.week} of 4
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {week.description}
                  </p>

                  {/* Tasks */}
                  {week.tasks?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <CheckSquare className="h-3.5 w-3.5" />
                        Tasks
                      </div>
                      <ul className="space-y-2">
                        {week.tasks.map((task, tIdx) => (
                          <li
                            key={tIdx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resources */}
                  {week.resources?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <BookOpen className="h-3.5 w-3.5" />
                        Free Resources
                      </div>
                      <div className="space-y-2">
                        {week.resources.map((resource, rIdx) => (
                          <a
                            key={rIdx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  resourceTypeColors[resource.type] ||
                                  "bg-muted text-muted-foreground"
                                }`}
                              >
                                {resource.type}
                              </span>
                              <span className="text-sm font-medium group-hover:underline">
                                {resource.title}
                              </span>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <Button
        variant="outline"
        onClick={handleGenerate}
        className="w-full gap-2"
        disabled={isLoading}
      >
        <Sparkles className="h-4 w-4" />
        Regenerate Roadmap
      </Button>
    </div>
  );
}
