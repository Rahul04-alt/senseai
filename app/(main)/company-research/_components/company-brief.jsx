"use client";

import { useState } from "react";
import {
  Building2,
  Loader2,
  Sparkles,
  Lightbulb,
  HelpCircle,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { generateCompanyBrief } from "@/actions/interview";
import { toast } from "sonner";

export default function CompanyBriefGenerator() {
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showImproved, setShowImproved] = useState(false);

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter a company name.");
      return;
    }
    setLoading(true);
    setBrief(null);
    try {
      const result = await generateCompanyBrief(companyName.trim(), jobTitle.trim());
      setBrief(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBrief(null);
    setCompanyName("");
    setJobTitle("");
  };

  if (!brief && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Company Research Brief
          </CardTitle>
          <CardDescription>
            Enter a company name and get an AI-generated interview preparation
            brief covering company culture, likely questions, and insider tips.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              placeholder="e.g. Google, Stripe, Shopify..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Job Title (optional)</Label>
            <Input
              id="role"
              placeholder="e.g. Software Engineer, Product Manager..."
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          <Button onClick={handleGenerate} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Brief
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
            Researching {companyName}...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                {companyName}
                {jobTitle && (
                  <Badge variant="secondary" className="ml-1">
                    {jobTitle}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">{brief.companyOverview}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brief.culture?.map((trait, i) => (
              <Badge key={i} variant="outline">
                {trait}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid: Interview Style + Key Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-500" /> Interview Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{brief.interviewStyle}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-yellow-500" /> Key Topics to Know
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {brief.keyTopics?.map((topic, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary mt-0.5">•</span> {topic}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Likely Questions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-purple-500" /> Likely Interview Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {brief.likelyQuestions?.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Prep Tips + Red Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-green-500" /> Preparation Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {brief.prepTips?.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-green-500 mt-0.5">✓</span> {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Common Mistakes to Avoid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {brief.redFlags?.map((flag, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-red-500 mt-0.5">✗</span> {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
