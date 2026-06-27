"use client";

import React, { useState } from "react";
import {
  Search,
  Send,
  Copy,
  Check,
  AlertCircle,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Mail,
  Linkedin,
  MessageCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { analyzeJobFit, generateOutreachMessages } from "@/actions/job-tools";
import { toast } from "sonner";

// ─── Circular Score Gauge ───────────────────────────────────────────
function ScoreGauge({ score, size = 160, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s) => {
    if (s >= 80) return "#22c55e";
    if (s >= 60) return "#eab308";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (s) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground mt-1">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Mini breakdown bar ─────────────────────────────────────────────
function BreakdownBar({ label, value }) {
  const getColor = (v) => {
    if (v >= 80) return "bg-green-500";
    if (v >= 60) return "bg-yellow-500";
    if (v >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor(
            value
          )}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Priority Badge ─────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const variants = {
    High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        variants[priority] || variants.Medium
      }`}
    >
      {priority}
    </span>
  );
}

// ─── Copy Button ────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ─── No Resume Alert ────────────────────────────────────────────────
function NoResumeAlert() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Resume Required</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          To analyze how well your profile matches a job description, you need to
          create your resume first. The ATS analyzer compares your resume against
          the job posting.
        </p>
        <Link href="/resume">
          <Button className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Build Your Resume
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function JobToolsDashboard({ hasResume }) {
  // ── ATS Analyzer State ──────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── Outreach Generator State ────────────────────────────────────
  const [outreachForm, setOutreachForm] = useState({
    companyName: "",
    jobTitle: "",
    contactRole: "",
    additionalContext: "",
  });
  const [outreachResult, setOutreachResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeJobFit(jobDescription);
      setAnalysisResult(result);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!outreachForm.companyName.trim() || !outreachForm.jobTitle.trim()) {
      toast.error("Please fill in the company name and job title.");
      return;
    }
    setIsGenerating(true);
    setOutreachResult(null);
    try {
      const result = await generateOutreachMessages(outreachForm);
      setOutreachResult(result);
      toast.success("Messages generated!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <Tabs defaultValue="ats" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ats" className="gap-2">
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">ATS Fit Analyzer</span>
          <span className="sm:hidden">ATS</span>
        </TabsTrigger>
        <TabsTrigger value="outreach" className="gap-2">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Outreach Generator</span>
          <span className="sm:hidden">Outreach</span>
        </TabsTrigger>
      </TabsList>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ATS FIT ANALYZER TAB                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <TabsContent value="ats" className="space-y-6">
        {!hasResume ? (
          <NoResumeAlert />
        ) : (
          <>
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Paste Job Description
                </CardTitle>
                <CardDescription>
                  Paste the full job description below. We&apos;ll compare it
                  with your saved resume and tell you exactly how well you
                  match.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  placeholder="Paste the job description here…
                  
Example:
We are looking for a Senior React Developer with 3+ years of experience in building modern web applications. The ideal candidate should have experience with Next.js, TypeScript, and RESTful APIs..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isAnalyzing}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {jobDescription.length > 0
                      ? `${jobDescription.split(/\s+/).filter(Boolean).length} words`
                      : "Tip: Include the full job posting for the best results"}
                  </p>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !jobDescription.trim()}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze Match
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {analysisResult && (
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                {/* Score + Breakdown Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Overall Score */}
                  <Card className="md:col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Overall Match Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pt-2 pb-6">
                      <ScoreGauge score={analysisResult.overallScore} />
                    </CardContent>
                  </Card>

                  {/* Breakdown */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Match Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      {analysisResult.matchBreakdown &&
                        Object.entries(analysisResult.matchBreakdown).map(
                          ([key, value]) => (
                            <BreakdownBar key={key} label={key} value={value} />
                          )
                        )}
                    </CardContent>
                  </Card>
                </div>

                {/* Keywords Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched Keywords */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Matched Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.matchedKeywords?.map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Missing Keywords */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Missing Keywords
                      </CardTitle>
                      <CardDescription>
                        Add these to your resume to boost your ATS score
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missingKeywords?.map((kw) => (
                          <Badge
                            key={kw}
                            variant="outline"
                            className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Strong Points */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Your Strong Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysisResult.strongPoints?.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Improvements */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      Recommended Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResult.improvements?.map((imp, i) => (
                        <div
                          key={i}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {imp.area}
                            </span>
                            <PriorityBadge priority={imp.priority} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {imp.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Bullet Points */}
                {analysisResult.suggestedBulletPoints?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        AI-Suggested Resume Bullet Points
                      </CardTitle>
                      <CardDescription>
                        Copy these optimized bullet points into your resume to
                        improve your match
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {analysisResult.suggestedBulletPoints.map(
                          (point, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 group"
                            >
                              <span className="text-muted-foreground text-sm font-mono mt-0.5 shrink-0">
                                •
                              </span>
                              <span className="text-sm flex-1">{point}</span>
                              <CopyButton text={point} />
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* OUTREACH GENERATOR TAB                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <TabsContent value="outreach" className="space-y-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Generate Outreach Messages
            </CardTitle>
            <CardDescription>
              Fill in the details below and we&apos;ll generate personalized
              networking messages for LinkedIn and email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google"
                  value={outreachForm.companyName}
                  onChange={(e) =>
                    setOutreachForm({
                      ...outreachForm,
                      companyName: e.target.value,
                    })
                  }
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Frontend Engineer"
                  value={outreachForm.jobTitle}
                  onChange={(e) =>
                    setOutreachForm({
                      ...outreachForm,
                      jobTitle: e.target.value,
                    })
                  }
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactRole">Contact Person&apos;s Role</Label>
              <Input
                id="contactRole"
                placeholder="e.g., Hiring Manager, Recruiter, Engineering Lead"
                value={outreachForm.contactRole}
                onChange={(e) =>
                  setOutreachForm({
                    ...outreachForm,
                    contactRole: e.target.value,
                  })
                }
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalContext">
                Additional Context (optional)
              </Label>
              <textarea
                id="additionalContext"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                placeholder="e.g., I saw their recent blog post about…, We have a mutual connection…, I attended their tech talk at…"
                value={outreachForm.additionalContext}
                onChange={(e) =>
                  setOutreachForm({
                    ...outreachForm,
                    additionalContext: e.target.value,
                  })
                }
                disabled={isGenerating}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateOutreach}
                disabled={
                  isGenerating ||
                  !outreachForm.companyName.trim() ||
                  !outreachForm.jobTitle.trim()
                }
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Messages
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Outreach Results */}
        {outreachResult && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* LinkedIn Connection Request */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  LinkedIn Connection Request
                </CardTitle>
                <CardDescription>
                  Short, punchy message for connection requests (200 char limit)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 relative">
                  <p className="text-sm pr-20">
                    {outreachResult.linkedInConnectionRequest}
                  </p>
                  <div className="absolute top-3 right-3">
                    <CopyButton
                      text={outreachResult.linkedInConnectionRequest}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {outreachResult.linkedInConnectionRequest?.length || 0}/200
                  characters
                </p>
              </CardContent>
            </Card>

            {/* Formal Email */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  Professional Email
                </CardTitle>
                <CardDescription>
                  Formal outreach email with subject line
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <span className="text-xs font-medium text-muted-foreground">
                      Subject:
                    </span>
                    <span className="text-sm font-medium">
                      {outreachResult.formalEmail?.subject}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">
                    {outreachResult.formalEmail?.body}
                  </p>
                </div>
                <div className="flex justify-end">
                  <CopyButton
                    text={`Subject: ${outreachResult.formalEmail?.subject}\n\n${outreachResult.formalEmail?.body}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Casual Message */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-teal-600" />
                  Casual Networking Message
                </CardTitle>
                <CardDescription>
                  Warm and friendly message for LinkedIn DMs or informal
                  outreach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 relative">
                  <p className="text-sm pr-20 whitespace-pre-line">
                    {outreachResult.casualMessage}
                  </p>
                  <div className="absolute top-3 right-3">
                    <CopyButton text={outreachResult.casualMessage} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
