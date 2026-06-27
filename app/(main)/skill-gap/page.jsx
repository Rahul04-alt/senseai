import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import SkillGapRoadmapGenerator from "./_components/skill-gap-roadmap";

export const metadata = {
  title: "Skill Gap Roadmap | AI Career Coach",
};

export default function SkillGapPage() {
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
            <Map className="h-10 w-10" />
            Skill Gap Roadmap
          </h1>
          <p className="text-muted-foreground mt-2">
            Compares your current skills against industry standards and generates
            a personalized 4-week learning plan with free resources.
          </p>
        </div>
      </div>

      <SkillGapRoadmapGenerator />
    </div>
  );
}
