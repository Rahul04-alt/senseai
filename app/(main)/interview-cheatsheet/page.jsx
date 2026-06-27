import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import CheatSheetGenerator from "./_components/cheatsheet-generator";

export const metadata = {
  title: "Interview Cheat Sheet | AI Career Coach",
};

export default function InterviewCheatSheetPage() {
  return (
    <div className="container mx-auto space-y-6 py-6 px-4">
      <div className="flex flex-col space-y-2">
        <Link href="/growth-tools">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Growth Tools
          </Button>
        </Link>
        <div>
          <h1 className="text-5xl md:text-6xl font-bold gradient-title flex items-center gap-3">
            <FileQuestion className="h-10 w-10" />
            Interview Cheat Sheet
          </h1>
          <p className="text-muted-foreground mt-2">
            Paste a job description to get 10 likely questions with personalized
            answer frameworks based on your experience and skills.
          </p>
        </div>
      </div>

      <CheatSheetGenerator />
    </div>
  );
}
