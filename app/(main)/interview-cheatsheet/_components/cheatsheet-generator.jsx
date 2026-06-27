"use client";

import { useState } from "react";
import {
  FileQuestion,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateInterviewCheatSheet } from "@/actions/interview";
import { toast } from "sonner";

const TYPE_COLORS = {
  Technical: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Behavioral: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Situational: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Culture Fit": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function QuestionCard({ item, index }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border">
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground font-mono text-sm shrink-0 mt-0.5">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm font-medium leading-snug">{item.question}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                TYPE_COLORS[item.type] || "bg-muted text-muted-foreground"
              }`}
            >
              {item.type}
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Answer Framework
            </p>
            <ul className="space-y-1">
              {item.answerFramework?.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          {item.personalizedTip && (
            <div className="flex gap-2 rounded-lg bg-muted p-3">
              <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{item.personalizedTip}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function CheatSheetGenerator() {
  const [jobDescription, setJobDescription] = useState("");
  const [cheatSheet, setCheatSheet] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (jobDescription.trim().split(" ").length < 20) {
      toast.error("Please paste a more detailed job description (at least a few sentences).");
      return;
    }
    setLoading(true);
    setCheatSheet(null);
    try {
      const result = await generateInterviewCheatSheet(jobDescription);
      setCheatSheet(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCheatSheet(null);
    setJobDescription("");
  };

  if (!cheatSheet && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-teal-500" />
            Interview Cheat Sheet
          </CardTitle>
          <CardDescription>
            Paste a job description and get 10 likely interview questions with
            personalized answer frameworks based on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jd">Job Description *</Label>
            <Textarea
              id="jd"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>
          <Button onClick={handleGenerate} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Cheat Sheet
          </Button>
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
            Analyzing job description and personalizing your cheat sheet...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-teal-500" />
                {cheatSheet.roleTitle || "Interview Cheat Sheet"}
              </CardTitle>
              <CardDescription className="mt-1">
                {cheatSheet.questions?.length} personalized questions with answer frameworks
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New JD
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {cheatSheet.keySkillsToEmphasize?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Skills to emphasize from your profile
              </p>
              <div className="flex flex-wrap gap-2">
                {cheatSheet.keySkillsToEmphasize.map((skill, i) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {cheatSheet.redFlags?.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-900/10 p-3 space-y-1">
              <p className="text-xs font-semibold flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Gaps to address
              </p>
              {cheatSheet.redFlags.map((flag, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  • {flag}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions list */}
      <div className="space-y-3">
        {cheatSheet.questions?.map((item, i) => (
          <QuestionCard key={i} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
