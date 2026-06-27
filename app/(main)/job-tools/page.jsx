import { getResume } from "@/actions/resume";
import JobToolsDashboard from "./_components/job-tools-dashboard";

export default async function JobToolsPage() {
  const resume = await getResume();

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">
          Job Tools & Outreach
        </h1>
      </div>
      <JobToolsDashboard hasResume={!!resume?.content} />
    </div>
  );
}
