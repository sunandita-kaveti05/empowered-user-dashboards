import { useState } from 'react';
import { Job, Applicant } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FitScoreGauge } from '@/components/FitScoreGauge';
import { PersonalityTraitsChart } from '@/components/PersonalityTraitsChart';
import { SkillRadarChart } from '@/components/SkillRadarChart';
import { FileText, User, Calendar, ExternalLink, CheckCircle, XCircle, Edit, Brain, Target } from 'lucide-react';
import { applicationsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ApplicantsDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ApplicantsDialog({ job, open, onOpenChange, onUpdate }: ApplicantsDialogProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  if (!job) return null;

  const calculateFinalScore = (applicant: Applicant) => {
    if (applicant.fitScore) return applicant.fitScore;
    const { resume, behaviour } = job.weights;
    return Math.round((applicant.resumeScore * resume + applicant.behaviourScore * behaviour) / (resume + behaviour));
  };

  const handleStatusUpdate = async (status: 'Shortlisted' | 'Rejected') => {
    if (!selectedApplicant) return;
    setIsUpdating(true);
    try {
      await applicationsAPI.updateStatus(job.id, selectedApplicant.id, status);
      setSelectedApplicant({ ...selectedApplicant, status, locked: true });
      onUpdate();
      toast({ title: 'Decision Saved', description: `Candidate ${status === 'Shortlisted' ? 'shortlisted' : 'rejected'} successfully` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditDecision = async () => {
    if (!selectedApplicant) return;
    setIsUpdating(true);
    try {
      await applicationsAPI.unlockDecision(job.id, selectedApplicant.id);
      setSelectedApplicant({ ...selectedApplicant, locked: false });
      toast({ title: 'Decision Unlocked', description: 'You can now change your decision' });
    } catch {
      toast({ title: 'Error', description: 'Failed to unlock decision', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <Badge className="bg-success text-success-foreground">{status}</Badge>;
      case 'Rejected': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const sortedApplicants = [...job.applicants].sort((a, b) => calculateFinalScore(b) - calculateFinalScore(a));

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedApplicant(null); }}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {selectedApplicant ? selectedApplicant.name : 'Applicants'}
          </DialogTitle>
          <p className="text-muted-foreground">
            {selectedApplicant
              ? `Applied for ${job.title}`
              : `${job.applicants.length} applicants for ${job.title} (ranked by fit score)`}
          </p>
        </DialogHeader>

        {!selectedApplicant ? (
          <div className="space-y-3">
            {job.applicants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No applicants yet</p>
              </div>
            ) : (
              sortedApplicants.map((applicant, index) => (
                <Card key={applicant.id} className="cursor-pointer hover:shadow-elevated transition-all" onClick={() => setSelectedApplicant(applicant)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{applicant.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{applicant.appliedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            calculateFinalScore(applicant) >= 80 ? 'text-success' :
                            calculateFinalScore(applicant) >= 60 ? 'text-primary' : 'text-warning'
                          }`}>
                            {calculateFinalScore(applicant)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Fit Score</p>
                        </div>
                        {getStatusBadge(applicant.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)} className="mb-2">
              ← Back to list
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex justify-center">
                  <FitScoreGauge
                    score={calculateFinalScore(selectedApplicant)}
                    resumeScore={selectedApplicant.resumeScore}
                    behaviourScore={selectedApplicant.behaviourScore}
                    resumeWeight={job.weights.resume}
                    behaviourWeight={job.weights.behaviour}
                    size="lg"
                  />
                </CardContent>
              </Card>
              {selectedApplicant.personalityTraits && (
                <Card>
                  <CardContent className="p-4">
                    <PersonalityTraitsChart traits={selectedApplicant.personalityTraits} />
                  </CardContent>
                </Card>
              )}
            </div>

            {selectedApplicant.extractedSkills && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Extracted Skills</span>
                  </div>
                  <SkillRadarChart skills={selectedApplicant.extractedSkills} title="" showCategories={true} />
                </CardContent>
              </Card>
            )}

            {selectedApplicant.matchExplanation && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-semibold">AI Match Analysis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedApplicant.matchExplanation}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Resume</span>
                    </div>
                    <a href={selectedApplicant.resumeURL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      {selectedApplicant.resumeName}<ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2"><strong>AI Insights:</strong> {selectedApplicant.resumeInsights}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Resume Score:</span>
                    <Progress value={selectedApplicant.resumeScore} className="flex-1 h-2" />
                    <span className="font-semibold">{selectedApplicant.resumeScore}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Behavioural Analysis</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2"><strong>AI Insights:</strong> {selectedApplicant.behaviourInsights}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Behaviour Score:</span>
                    <Progress value={selectedApplicant.behaviourScore} className="flex-1 h-2" />
                    <span className="font-semibold">{selectedApplicant.behaviourScore}%</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current Status:</span>
                  {getStatusBadge(selectedApplicant.status)}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground" disabled={selectedApplicant.locked || isUpdating} onClick={() => handleStatusUpdate('Shortlisted')}>
                  <CheckCircle className="w-4 h-4" /> Proceed
                </Button>
                <Button variant="destructive" className="flex-1" disabled={selectedApplicant.locked || isUpdating} onClick={() => handleStatusUpdate('Rejected')}>
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
                <Button variant="secondary" disabled={!selectedApplicant.locked || isUpdating} onClick={handleEditDecision}>
                  <Edit className="w-4 h-4" /> Edit Decision
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
