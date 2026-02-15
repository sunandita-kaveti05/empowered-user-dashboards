import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useJobs } from '@/context/JobContext';
import { Job, HiringMetrics } from '@/types';
import { StatCard } from '@/components/StatCard';
import { CreateJobDialog } from '@/components/CreateJobDialog';
import { ApplicantsDialog } from '@/components/ApplicantsDialog';
import { HiringFunnelChart } from '@/components/HiringFunnelChart';
import { SkillGapChart } from '@/components/SkillGapChart';
import { PersonalityTraitsChart } from '@/components/PersonalityTraitsChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Users, Plus, BarChart3, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export function RecruiterDashboard() {
  const { user } = useAuth();
  const { jobs, createJob, refreshJobs } = useJobs();

  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicantsOpen, setApplicantsOpen] = useState(false);
  const [selectedJobForAnalytics, setSelectedJobForAnalytics] = useState<string>('all');

  const metrics: HiringMetrics = useMemo(() => {
    const allApplicants = jobs.flatMap(job => job.applicants);
    return {
      totalApplicants: allApplicants.length,
      shortlisted: allApplicants.filter(a => a.status === 'Shortlisted').length,
      rejected: allApplicants.filter(a => a.status === 'Rejected').length,
      underReview: allApplicants.filter(a => a.status === 'Under Review').length,
      averageTimeToHire: 5.2,
      averageFitScore: allApplicants.length > 0
        ? Math.round(allApplicants.reduce((sum, a) => sum + (a.fitScore || a.resumeScore), 0) / allApplicants.length)
        : 0,
    };
  }, [jobs]);

  const handleViewApplicants = (job: Job) => {
    setSelectedJob(job);
    setApplicantsOpen(true);
  };

  const chartData = jobs.map(job => ({
    name: job.title.length > 15 ? job.title.slice(0, 15) + '...' : job.title,
    applicants: job.applicants.length,
  }));

  const colors = ['hsl(217, 91%, 60%)', 'hsl(217, 91%, 50%)', 'hsl(217, 91%, 70%)', 'hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)'];

  const statusChartData = [
    { name: 'Under Review', value: metrics.underReview, color: 'hsl(217, 91%, 60%)' },
    { name: 'Shortlisted', value: metrics.shortlisted, color: 'hsl(142, 76%, 36%)' },
    { name: 'Rejected', value: metrics.rejected, color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  const jobForSkillGap = selectedJobForAnalytics === 'all'
    ? jobs[0]
    : jobs.find(j => j.id === selectedJobForAnalytics);

  const aggregatedTraits = useMemo(() => {
    const allApplicants = jobs.flatMap(job => job.applicants);
    const applicantsWithTraits = allApplicants.filter(a => a.personalityTraits);
    if (applicantsWithTraits.length === 0) return null;
    return {
      openness: Math.round(applicantsWithTraits.reduce((sum, a) => sum + (a.personalityTraits?.openness || 0), 0) / applicantsWithTraits.length),
      conscientiousness: Math.round(applicantsWithTraits.reduce((sum, a) => sum + (a.personalityTraits?.conscientiousness || 0), 0) / applicantsWithTraits.length),
      extraversion: Math.round(applicantsWithTraits.reduce((sum, a) => sum + (a.personalityTraits?.extraversion || 0), 0) / applicantsWithTraits.length),
      agreeableness: Math.round(applicantsWithTraits.reduce((sum, a) => sum + (a.personalityTraits?.agreeableness || 0), 0) / applicantsWithTraits.length),
      neuroticism: Math.round(applicantsWithTraits.reduce((sum, a) => sum + (a.personalityTraits?.neuroticism || 0), 0) / applicantsWithTraits.length),
    };
  }, [jobs]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Recruiter Dashboard</h2>
          <p className="text-muted-foreground">Manage job postings and review candidates</p>
        </div>
        <Button onClick={() => setCreateJobOpen(true)} size="lg">
          <Plus className="w-5 h-5" /> Create Job
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={jobs.length} icon={Briefcase} variant="primary" />
        <StatCard label="Total Applicants" value={metrics.totalApplicants} icon={Users} variant="default" />
        <StatCard label="Shortlisted" value={metrics.shortlisted} icon={Target} variant="success" />
        <StatCard label="Avg. Fit Score" value={`${metrics.averageFitScore}%`} icon={TrendingUp} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.totalApplicants > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Hiring Funnel
            </h3>
            <HiringFunnelChart jobs={jobs} />
          </div>
        )}

        {statusChartData.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Application Status Distribution
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobForSkillGap && jobForSkillGap.requiredSkills && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Skill Gap Analysis
              </h3>
              <Select value={selectedJobForAnalytics} onValueChange={setSelectedJobForAnalytics}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title.length > 20 ? job.title.slice(0, 20) + '...' : job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SkillGapChart job={jobForSkillGap} />
          </div>
        )}

        {aggregatedTraits && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Average Candidate Personality Profile
            </h3>
            <PersonalityTraitsChart traits={aggregatedTraits} />
          </div>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Applicants by Job
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="applicants" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-4">Posted Jobs</h3>
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Shortlisted</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No jobs posted yet. Create your first job posting!
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      <Badge variant={new Date(job.deadline) < new Date() ? 'destructive' : 'secondary'}>
                        {format(new Date(job.deadline), 'MMM d, yyyy')}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{job.applicants.length}</Badge></TableCell>
                    <TableCell>
                      <Badge className="bg-success text-success-foreground">
                        {job.applicants.filter(a => a.status === 'Shortlisted').length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleViewApplicants(job)}>View Applicants</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateJobDialog open={createJobOpen} onOpenChange={setCreateJobOpen} onSubmit={createJob} />
      <ApplicantsDialog job={selectedJob} open={applicantsOpen} onOpenChange={setApplicantsOpen} onUpdate={refreshJobs} />
    </div>
  );
}
