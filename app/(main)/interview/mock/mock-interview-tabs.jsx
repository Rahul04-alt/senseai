"use client";

import { GraduationCap, Mic, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Quiz from "../_components/quiz";
import VoiceInterview from "../_components/voice-interview";
import BehavioralPractice from "../_components/behavioral-practice";

export default function MockInterviewTabs() {
  return (
    <Tabs defaultValue="quiz" className="space-y-4 mx-2">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="quiz" className="gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="hidden sm:inline">Quiz Mode</span>
          <span className="sm:hidden">Quiz</span>
        </TabsTrigger>
        <TabsTrigger value="voice" className="gap-2">
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Voice Practice</span>
          <span className="sm:hidden">Voice</span>
        </TabsTrigger>
        <TabsTrigger value="behavioral" className="gap-2">
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">STAR Practice</span>
          <span className="sm:hidden">STAR</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="quiz">
        <Quiz />
      </TabsContent>

      <TabsContent value="voice">
        <VoiceInterview />
      </TabsContent>

      <TabsContent value="behavioral">
        <BehavioralPractice />
      </TabsContent>
    </Tabs>
  );
}
