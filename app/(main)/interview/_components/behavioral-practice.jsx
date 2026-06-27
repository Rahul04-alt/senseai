"use client";

import { useState } from "react";
import {
  Loader2,
  Sparkles,
  RotateCcw,
  ChevronRight,
  Star,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { generateBehavioralQuestion, evaluateSTARAnswer } from "@/actions/interview";
import { toast } from "sonner";

const STAR_LABELS = {
  situation: { label: "Situation", color: "bg-blue-500" },
  task: { label: "Task", color: "bg-purple-500" },
  action: { label: "Action", color: "bg-orange-500" },
  result: { label: "Result", color: "bg-green-500" },
};

function ScoreCircle({ score }) {
  const color =
    score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-5xl font-bold ${color}`}>{score}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default function BehavioralPractice() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);

  const handleGetQuestion = async () => {
    setLoadingQuestion(true);
    setEvaluation(null);
    setAnswer("");
    try {
      const q = await generateBehavioralQuestion();
      setQuestion(q);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleEvaluate = async () => {
    if (!answer.trim() || answer.trim().split(" ").length < 10) {
      toast.error("Please write a more detailed answer (at least a few sentences).");
      return;
    }
    setLoadingEval(true);
    try {
      const result = await evaluateSTARAnswer(question.question, answer);
      setEvaluation(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingEval(false);
    }
  };

  const handleReset = () => {
    setQuestion(null);
    setAnswer("");
    setEvaluation(null);
  };

  // ── Start screen ──────────────────────────────────────────────
  if (!question) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Behavioral Interview Practice
          </CardTitle>
          <CardDescription>
            Practice answering behavioral questions using the{" "}
            <span className="font-semibold">STAR method</span> — Situation,
            Task, Action, Result. Get AI feedback on your answer structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-center">
            {Object.entries(STAR_LABELS).map(([key, { label, color }]) => (
              <div key={key} className="rounded-lg border p-3 space-y-1">
                <div className={`h-2 w-full rounded-full ${color}`} />
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {key === "situation" && "Set the scene"}
                  {key === "task" && "Your responsibility"}
                  {key === "action" && "Steps you took"}
                  {key === "result" && "Outcome achieved"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGetQuestion}
            disabled={loadingQuestion}
            className="w-full"
          >
            {loadingQuestion ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Get a Behavioral Question
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ── Evaluation results ────────────────────────────────────────
  if (evaluation) {
    return (
      <div className="mx-2 space-y-4">
        {/* Score header */}
        <Card>
          <CardHeader>
            <CardTitle>STAR Evaluation Results</CardTitle>
            <CardDescription>{question.question}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-2">
              <ScoreCircle score={evaluation.overallScore} />
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {evaluation.overallFeedback}
            </p>

            {/* STAR breakdown */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">STAR Breakdown</p>
              {Object.entries(STAR_LABELS).map(([key, { label, color }]) => {
                const data = evaluation.starBreakdown?.[key];
                if (!data) return null;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{data.score}/25</span>
                    </div>
                    <Progress value={(data.score / 25) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{data.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Strengths & improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Strengths
                </p>
                <ul className="space-y-1">
                  {evaluation.strengths?.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-green-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" /> Improvements
                </p>
                <ul className="space-y-1">
                  {evaluation.improvements?.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-yellow-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Model answer */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-primary" /> Improved Answer
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {evaluation.improvedAnswer}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" /> Start Over
            </Button>
            <Button onClick={handleGetQuestion} disabled={loadingQuestion} className="flex-1">
              {loadingQuestion ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Next Question
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Question + answer form ────────────────────────────────────
  return (
    <Card className="mx-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{question.question}</CardTitle>
          <Badge variant="secondary" className="shrink-0">{question.category}</Badge>
        </div>
        {question.hint && (
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 mt-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{question.hint}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-1 text-center text-xs mb-1">
          {Object.entries(STAR_LABELS).map(([, { label, color }]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <Textarea
          placeholder="Write your answer here... Describe the Situation, your Task, the Actions you took, and the Result achieved."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={8}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Tip: Structure your answer with all four STAR components for a higher score.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset
        </Button>
        <Button
          onClick={handleEvaluate}
          disabled={loadingEval || !answer.trim()}
          className="flex-1"
        >
          {loadingEval ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Evaluate My Answer
        </Button>
      </CardFooter>
    </Card>
  );
}
