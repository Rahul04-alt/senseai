import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyBriefGenerator from "./_components/company-brief";

export const metadata = {
  title: "Company Research Brief | AI Career Coach",
};

export default function CompanyResearchPage() {
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
            <Building2 className="h-10 w-10" />
            Company Research Brief
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter a company name to get an AI-generated interview prep guide — culture insights,
            likely questions, and tips tailored to your profile.
          </p>
        </div>
      </div>

      <CompanyBriefGenerator />
    </div>
  );
}
