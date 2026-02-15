import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useJobs } from '@/context/JobContext';
import { Job, Applicant, ApplicationStats } from '@/types';
import { applicationsAPI } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { JobCard } from '@/components/JobCard';
import { ApplicationFlow } from '@/components/ApplicationFlow';
import { ApplicationTimeline } from '@/components/ApplicationTimeline';
import { SkillRadarChart } from '@/components/SkillRadarChart';
import { FitScoreGauge } from '@/components/FitScoreGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileCheck, CheckCircle, XCircle, Briefcase, TrendingUp, Eye, Brain } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export function CandidateDashboard() {
  const { user } = useAuth();
  const { jobs, refreshJobs } = useJobs();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [myApplications, setMyApplications] = useState<{ job: Job; applicant: Applicant }[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({ applied: 0, shortlisted: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<{ job: Job; applicant: Applicant } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const apps = await applicationsAPI.getMyApplications(user.id);
      setMyApplications(apps);
      const newStats = apps.reduce(
        (acc, { applicant }) => {
          acc.applied++;
          if (applicant.status === 'Shortlisted') acc.shortlisted++;
          if (applicant.status === 'Rejected') acc.rejected++;
          return acc;
        },
        { applied: 0, shortlisted: 0, rejected: 0 }
      );
      setStats(newStats);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications, jobs]);

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setApplicationOpen(true);
  };

  const handleApplicationSuccess = async () => {
    await refreshJobs();
    setTimeout(() => loadApplications(), 500);
  };

  const isApplied = (jobId: string) => myApplications.some(app => app.job.id === jobId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <Badge className="bg-success text-success-foreground">{status}</Badge>;
      case 'Rejected': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const chartData = [
    { name: 'Under Review', value: stats.applied - stats.shortlisted - stats.rejected, color: 'hsl(217, 91%, 60%)' },
    { name: 'Shortlisted', value: stats.shortlisted, color: 'hsl(142, 76%, 36%)' },
    { name: 'Rejected', value: stats.rejected, color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  const allSkills = myApplications.flatMap(app => app.applicant.extractedSkills || []);
  const uniqueSkills = allSkills.reduce((acc, skill) => {
    if (!acc.find(s => s.name === skill.name)) acc.push(skill);
    return acc;
  }, [] as typeof allSkills);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
        <p className="text-muted-foreground">Track your applications and explore new opportunities</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-28 rounded-xl" /></>
        ) : (
          <>
            <StatCard label="Total Applied" value={stats.applied} icon={FileCheck} variant="primary" />
            <StatCard label="Shortlisted" value={stats.shortlisted} icon={CheckCircle} variant="success" />
            <StatCard label="Rejected" value={stats.rejected} icon={XCircle} variant="destructive" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.applied > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Application Analytics
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {uniqueSkills.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> My Skills Profile
            </h3>
            <SkillRadarChart skills={uniqueSkills.slice(0, 8)} title="" showCategories={true} />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Available Jobs
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} isApplied={isApplied(job.id)} onApply={() => handleApply(job)} />
            ))}
          </div>
        )}
      </div>

      {myApplications.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">My Applications</h3>
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Fit Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myApplications.map(({ job, applicant }) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        (applicant.fitScore || applicant.resumeScore) >= 80 ? 'text-success' :
                        (applicant.fitScore || applicant.resumeScore) >= 60 ? 'text-primary' : 'text-warning'
                      }`}>
                        {applicant.fitScore || applicant.resumeScore}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedApplication({ job, applicant }); setDetailsOpen(true); }}>
                        <Eye className="w-4 h-4 mr-1" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ApplicationFlow job={selectedJob} open={applicationOpen} onOpenChange={setApplicationOpen} onSuccess={handleApplicationSuccess} />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedApplication.job.title}</h3>
                  <p className="text-muted-foreground">{selectedApplication.job.company}</p>
                </div>
                {getStatusBadge(selectedApplication.applicant.status)}
              </div>
              <div className="flex justify-center">
                <FitScoreGauge
                  score={selectedApplication.applicant.fitScore || selectedApplication.applicant.resumeScore}
                  resumeScore={selectedApplication.applicant.resumeScore}
                  behaviourScore={selectedApplication.applicant.behaviourScore}
                  resumeWeight={selectedApplication.job.weights.resume}
                  behaviourWeight={selectedApplication.job.weights.behaviour}
                />
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-3">Application Progress</h4>
                <ApplicationTimeline applicant={selectedApplication.applicant} />
              </div>
              {selectedApplication.applicant.extractedSkills && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Your Skills Match</h4>
                  <SkillRadarChart skills={selectedApplication.applicant.extractedSkills} title="" showCategories={false} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                  <h4 className="font-medium text-sm mb-2">Resume Insights</h4>
                  <p className="text-xs text-muted-foreground">{selectedApplication.applicant.resumeInsights}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <h4 className="font-medium text-sm mb-2">Behavioural Insights</h4>
                  <p className="text-xs text-muted-foreground">{selectedApplication.applicant.behaviourInsights}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
