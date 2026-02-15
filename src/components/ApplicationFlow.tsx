import React, { useState, useEffect, useCallback } from 'react';
import { Job, ResumeAnalysis } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Upload, Loader2, Clock, CheckCircle, AlertTriangle, BookOpen, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiAPI, applicationsAPI } from '@/lib/api';

interface ApplicationFlowProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'analysis' | 'behavioural' | 'submitting';

export const ApplicationFlow = React.forwardRef<HTMLDivElement, ApplicationFlowProps>(
  ({ job, open, onOpenChange, onSuccess }, ref) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [step, setStep] = useState<Step>('upload');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [answers, setAnswers] = useState<string[]>(['', '', '']);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [timerActive, setTimerActive] = useState(false);
    const [timeExpired, setTimeExpired] = useState(false);

    useEffect(() => {
      if (!open) {
        setStep('upload');
        setResumeFile(null);
        setAnalysis(null);
        setAnswers(['', '', '']);
        setTimeLeft(180);
        setTimerActive(false);
        setTimeExpired(false);
      }
    }, [open]);

    useEffect(() => {
      if (!timerActive || timeExpired) return;
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimeExpired(true);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [timerActive, timeExpired]);

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          setResumeFile(file);
          toast({ title: 'File Uploaded', description: file.name });
        } else {
          toast({ title: 'Invalid File', description: 'Please upload a PDF or DOCX file', variant: 'destructive' });
        }
      }
    };

    const handleAnalyzeResume = async () => {
      if (!resumeFile) return;
      setIsAnalyzing(true);
      try {
        const result = await aiAPI.parseResume(resumeFile);
        setAnalysis(result);
        setStep('analysis');
      } catch {
        toast({ title: 'Error', description: 'Failed to analyze resume', variant: 'destructive' });
      } finally {
        setIsAnalyzing(false);
      }
    };

    const startBehavioural = () => {
      setStep('behavioural');
      setTimerActive(true);
    };

    const handleAnswerChange = useCallback((index: number, value: string) => {
      if (timeExpired) return;
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[index] = value;
        return newAnswers;
      });
    }, [timeExpired]);

    const handleSubmit = async () => {
      if (!job || !user || !resumeFile) return;
      setIsSubmitting(true);
      setStep('submitting');
      try {
        await applicationsAPI.submit(job.id, user.id, user.name, resumeFile, answers);
        toast({ title: 'Application Submitted!', description: 'Your application has been submitted successfully.' });
        onOpenChange(false);
        onSuccess();
      } catch {
        toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
        setStep('behavioural');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!job) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {step === 'upload' && 'Upload Resume'}
              {step === 'analysis' && 'AI Resume Analysis'}
              {step === 'behavioural' && 'Behavioural Assessment'}
              {step === 'submitting' && 'Submitting...'}
            </DialogTitle>
            <p className="text-muted-foreground">{job.title} at {job.company}</p>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            {['upload', 'analysis', 'behavioural'].map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-full h-1.5 rounded-full ${
                  step === s ? 'bg-primary' :
                  ['upload', 'analysis', 'behavioural'].indexOf(step) > i ? 'bg-success' : 'bg-muted'
                }`} />
              </div>
            ))}
          </div>

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <Label htmlFor="resume" className="cursor-pointer">
                  <span className="text-lg font-medium block mb-2">
                    {resumeFile ? resumeFile.name : 'Click to upload your resume'}
                  </span>
                  <span className="text-sm text-muted-foreground">PDF or DOCX (max 10MB)</span>
                </Label>
                <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button className="flex-1" disabled={!resumeFile || isAnalyzing} onClick={handleAnalyzeResume}>
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <>Next <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {step === 'analysis' && analysis && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Match Score</span>
                  <span className="text-2xl font-bold text-primary">{analysis.matchScore}%</span>
                </div>
                <Progress value={analysis.matchScore} className="h-2" />
                {analysis.matchExplanation && (
                  <p className="text-sm text-muted-foreground mt-2">{analysis.matchExplanation}</p>
                )}
              </div>

              {analysis.extractedEntities?.skills && (
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Extracted Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedEntities.skills.slice(0, 8).map((skill, i) => (
                      <Badge key={i} variant={skill.relevance > 80 ? 'default' : 'secondary'} className="text-xs">
                        {skill.name} ({skill.relevance}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.extractedEntities && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Experience</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{analysis.experience}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Education</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{analysis.education}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-semibold">Strengths</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {analysis.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                  </ul>
                </div>
                <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <span className="font-semibold">Improvements</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {analysis.improvements.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('upload')}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1" onClick={startBehavioural}>
                  Continue to Assessment <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'behavioural' && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                timeExpired ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Time Left: {formatTime(timeLeft)}</span>
                {timeExpired && <span className="ml-auto text-sm">Time is over. Answers are locked.</span>}
              </div>

              <div className="space-y-4">
                {job.questions.slice(0, 3).map((question, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium">{question}</Label>
                    <Textarea
                      value={answers[index]}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      disabled={timeExpired}
                      rows={3}
                      placeholder="Type your answer here..."
                      onPaste={(e) => e.preventDefault()}
                      className={timeExpired ? 'opacity-60' : ''}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setTimerActive(false); setStep('analysis'); }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
                </Button>
              </div>
            </div>
          )}

          {step === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Submitting your application...</p>
              <p className="text-muted-foreground">Please wait</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

ApplicationFlow.displayName = 'ApplicationFlow';
