"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Sparkles,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Volume2,
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
import {
  generateVoiceQuestion,
  evaluateVoiceAnswer,
} from "@/actions/interview";
import { toast } from "sonner";

// ─── Score Color Helper ─────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Keep Practicing";
}

// ─── Pulsing Mic Animation ──────────────────────────────────────
function PulsingMic({ isRecording }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {isRecording && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="absolute inline-flex h-[120%] w-[120%] rounded-full bg-red-300 opacity-40 animate-pulse" />
        </>
      )}
      <div
        className={`relative z-10 rounded-full p-6 transition-all duration-300 ${
          isRecording
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
            : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
        }`}
      >
        {isRecording ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </div>
    </div>
  );
}

export default function VoiceInterview() {
  // ── State ─────────────────────────────────────────────────────
  const [question, setQuestion] = useState(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);

  // ── Check Speech API support on mount ─────────────────────────
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setSpeechSupported(false);
    }
  }, []);

  // ── Generate a new question ───────────────────────────────────
  const handleNewQuestion = async () => {
    setIsLoadingQuestion(true);
    setQuestion(null);
    setTranscript("");
    setInterimTranscript("");
    setEvaluation(null);
    try {
      const q = await generateVoiceQuestion();
      setQuestion(q);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // ── Start / Stop recording ────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!speechSupported) {
      toast.error(
        "Your browser does not support speech recognition. Please use Chrome or Edge."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim += t;
        }
      }
      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [speechSupported]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setInterimTranscript("");
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ── Submit for evaluation ─────────────────────────────────────
  const handleSubmit = async () => {
    const finalText = transcript.trim();
    if (!finalText) {
      toast.error("Please record your answer first.");
      return;
    }
    if (finalText.split(/\s+/).length < 5) {
      toast.error(
        "Your answer is too short. Please try speaking a more detailed response."
      );
      return;
    }

    stopRecording();
    setIsEvaluating(true);
    try {
      const result = await evaluateVoiceAnswer(question.question, finalText);
      setEvaluation(result);
      toast.success("Answer evaluated!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── Reset for next question ───────────────────────────────────
  const handleNextQuestion = () => {
    setTranscript("");
    setInterimTranscript("");
    setEvaluation(null);
    handleNewQuestion();
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER — Not Supported
  // ═══════════════════════════════════════════════════════════════
  if (!speechSupported) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <MicOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Browser Not Supported
          </h3>
          <p className="text-muted-foreground max-w-md">
            Your browser does not support the Web Speech API. Please use{" "}
            <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>{" "}
            for voice interviews.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — No Question Yet
  // ═══════════════════════════════════════════════════════════════
  if (!question && !isLoadingQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Practice Interview
          </CardTitle>
          <CardDescription>
            Practice answering real interview questions out loud. The AI will
            listen to your response and provide detailed feedback on your
            answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="rounded-full bg-muted p-6 inline-flex mb-6">
            <Volume2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Click the button below to generate an interview question. You will
            then speak your answer using your microphone, and the AI will
            evaluate your response.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNewQuestion} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Interview Question
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — Loading Question
  // ═══════════════════════════════════════════════════════════════
  if (isLoadingQuestion) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Generating your interview question…
          </p>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — Question + Recording + Evaluation
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Question Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{question.type}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextQuestion}
              className="gap-1"
              disabled={isRecording || isEvaluating}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-medium leading-relaxed">
            {question.question}
          </p>
          {question.tips && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
              <span>{question.tips}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording Card */}
      {!evaluation && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Mic Button */}
              <button
                onClick={toggleRecording}
                disabled={isEvaluating}
                className="cursor-pointer focus:outline-none"
                aria-label={isRecording ? "Stop recording" : "Start recording"}
              >
                <PulsingMic isRecording={isRecording} />
              </button>

              <p className="text-sm text-muted-foreground">
                {isRecording
                  ? "Listening… Click the mic to stop"
                  : transcript
                  ? "Click the mic to continue recording, or submit your answer"
                  : "Click the microphone and start speaking your answer"}
              </p>

              {/* Live Transcript */}
              {(transcript || interimTranscript) && (
                <div className="w-full space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Your Answer:
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[100px] text-sm leading-relaxed">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-muted-foreground italic">
                        {interimTranscript}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {transcript.split(/\s+/).filter(Boolean).length} words
                    </span>
                    {isRecording && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Recording
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            {transcript && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTranscript("");
                    setInterimTranscript("");
                  }}
                  disabled={isRecording || isEvaluating}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isRecording || isEvaluating}
                  className="flex-1 gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Evaluating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Score Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-3">
                <div
                  className={`text-5xl font-bold ${getScoreColor(
                    evaluation.score
                  )}`}
                >
                  {evaluation.score}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getScoreLabel(evaluation.score)}
                </div>
                <Progress value={evaluation.score} className="w-full max-w-xs" />
              </div>
              {evaluation.overallFeedback && (
                <p className="text-sm text-center text-muted-foreground mt-4 max-w-lg mx-auto">
                  {evaluation.overallFeedback}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.improvements?.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Model Answer */}
          {evaluation.modelAnswer && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Model Answer
                </CardTitle>
                <CardDescription>
                  Here&apos;s how an ideal answer might sound
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed">
                  {evaluation.modelAnswer}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Transcript */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Your Answer (Transcript)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed text-muted-foreground">
                {transcript}
              </div>
            </CardContent>
          </Card>

          {/* Next Question */}
          <Button onClick={handleNextQuestion} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Another Question
          </Button>
        </div>
      )}
    </div>
  );
}
