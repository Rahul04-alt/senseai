"use client";

import { useState } from "react";
import {
  Map,
  Loader2,
  Sparkles,
  ExternalLink,
  CheckSquare,
  BookOpen,
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
import { generateProfileSkillRoadmap } from "@/actions/interview";
import { toast } from "sonner";

const RESOURCE_COLORS = {
  Article: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Video: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Documentation: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Tutorial: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Practice: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const WEEK_BORDER_COLORS = [
  "border-l-blue-500",
  "border-l-green-500",
  "border-l-purple-500",
  "border-l-orange-500",
];

export default function SkillGapRoadmapGenerator() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setRoadmap(null);
    try {
      const result = await generateProfileSkillRoadmap();
      setRoadmap(result);
      toast.success("Skill gap roadmap generated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!roadmap && !loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Map className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Profile-Based Skill Gap Roadmap</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Compares your current skills against industry-recommended skills and
              generates a personalized 4-week learning plan with free resources.
            </p>
          </div>
          <Button onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate My Roadmap
          </Button>
          <p className="text-xs text-muted-foreground">
            Requires industry insights to be loaded — visit your{" "}
            <a href="/dashboard" className="underline">
              dashboard
            </a>{" "}
            first if you haven&apos;t already.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            Analyzing your skill gaps and building your roadmap...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            {roadmap.title}
          </CardTitle>
          <CardDescription>{roadmap.summary}</CardDescription>
        </CardHeader>
        {roadmap.skillsAddressed?.length > 0 && (
          <CardContent>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Skills covered in this roadmap
            </p>
            <div className="flex flex-wrap gap-2">
              {roadmap.skillsAddressed.map((skill, i) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Weekly plan */}
      <Accordion type="multiple" defaultValue={["week-1"]} className="space-y-3">
        {roadmap.weeks?.map((week, i) => (
          <AccordionItem
            key={i}
            value={`week-${week.week}`}
            className={`border-l-4 ${WEEK_BORDER_COLORS[i % 4]} rounded-lg border border-border pl-0`}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold shrink-0">
                  {week.week}
                </div>
                <div>
                  <p className="font-semibold text-sm">{week.topic}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {week.description}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">{week.description}</p>

              {/* Tasks */}
              {week.tasks?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5" /> This Week&apos;s Tasks
                  </p>
                  <ul className="space-y-1.5">
                    {week.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5 shrink-0">→</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {week.resources?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> Free Resources
                  </p>
                  <div className="space-y-2">
                    {week.resources.map((res, j) => (
                      <a
                        key={j}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              RESOURCE_COLORS[res.type] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {res.type}
                          </span>
                          <span className="truncate">{res.title}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button variant="outline" onClick={handleGenerate} disabled={loading} className="w-full">
        <Sparkles className="h-4 w-4 mr-2" />
        Regenerate Roadmap
      </Button>
    </div>
  );
}
