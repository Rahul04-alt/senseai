import Link from "next/link";
import {
  FileText,
  PenBox,
  GraduationCap,
  Briefcase,
  Building2,
  FileQuestion,
  Map,
  ArrowRight,
} from "lucide-react";

const tools = [
  {
    href: "/resume",
    icon: FileText,
    title: "Build Resume",
    description:
      "Create a polished, ATS-friendly resume tailored to your target role using AI assistance.",
    color: "from-blue-500/20 to-blue-600/10",
    border: "hover:border-blue-500/50",
    iconColor: "text-blue-500",
  },
  {
    href: "/ai-cover-letter",
    icon: PenBox,
    title: "Cover Letter",
    description:
      "Generate compelling, personalized cover letters that highlight your strengths for any job.",
    color: "from-purple-500/20 to-purple-600/10",
    border: "hover:border-purple-500/50",
    iconColor: "text-purple-500",
  },
  {
    href: "/interview",
    icon: GraduationCap,
    title: "Interview Prep",
    description:
      "Practice mock interviews, get AI feedback, and track your performance over time.",
    color: "from-green-500/20 to-green-600/10",
    border: "hover:border-green-500/50",
    iconColor: "text-green-500",
  },
  {
    href: "/job-tools",
    icon: Briefcase,
    title: "Job & Outreach Tools",
    description:
      "Analyze job fit against your resume and generate personalized outreach messages.",
    color: "from-orange-500/20 to-orange-600/10",
    border: "hover:border-orange-500/50",
    iconColor: "text-orange-500",
  },
  {
    href: "/company-research",
    icon: Building2,
    title: "Company Research Brief",
    description:
      "Enter a company name to get an AI-generated interview prep guide — culture, likely questions, and insider tips.",
    color: "from-indigo-500/20 to-indigo-600/10",
    border: "hover:border-indigo-500/50",
    iconColor: "text-indigo-500",
  },
  {
    href: "/interview-cheatsheet",
    icon: FileQuestion,
    title: "Interview Cheat Sheet",
    description:
      "Paste a job description to get 10 likely questions with personalized answer frameworks from your profile.",
    color: "from-teal-500/20 to-teal-600/10",
    border: "hover:border-teal-500/50",
    iconColor: "text-teal-500",
  },
  {
    href: "/skill-gap",
    icon: Map,
    title: "Skill Gap Roadmap",
    description:
      "Compare your skills against industry standards and get a free 4-week learning plan to close the gaps.",
    color: "from-rose-500/20 to-rose-600/10",
    border: "hover:border-rose-500/50",
    iconColor: "text-rose-500",
  },
];

export default function GrowthToolsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-bold gradient-title mb-4">
          Growth Tools
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Everything you need to accelerate your career — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tools.map(({ href, icon: Icon, title, description, color, border, iconColor }) => (
          <Link key={href} href={href}>
            <div
              className={`group relative rounded-2xl border border-border bg-gradient-to-br ${color} ${border} p-6 h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 shrink-0 ${iconColor}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Get started <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
