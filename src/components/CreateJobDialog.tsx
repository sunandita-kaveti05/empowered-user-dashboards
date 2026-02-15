import { useState } from 'react';
import { CreateJobRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiAPI } from '@/lib/api';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateJobRequest) => Promise<unknown>;
}

export function CreateJobDialog({ open, onOpenChange, onSubmit }: CreateJobDialogProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [resumeWeight, setResumeWeight] = useState('50');
  const [behaviourWeight, setBehaviourWeight] = useState('20');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();

  const resetForm = () => {
    setTitle(''); setCompany(''); setDescription(''); setDeadline('');
    setQ1(''); setQ2(''); setQ3('');
    setResumeWeight('50'); setBehaviourWeight('20');
  };

  const handleGenerateQuestions = async () => {
    if (!description) {
      toast({ title: 'Error', description: 'Please enter a job description first', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const questions = await aiAPI.generateQuestions(description);
      setQ1(questions[0] || ''); setQ2(questions[1] || ''); setQ3(questions[2] || '');
      toast({ title: 'AI Generated', description: 'Behavioural questions have been generated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate questions', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        title,
        company: company || 'Not specified',
        description,
        deadline,
        questions: [q1, q2, q3].filter(Boolean),
        weights: { resume: parseInt(resumeWeight) || 50, behaviour: parseInt(behaviourWeight) || 20 },
      });
      resetForm();
      onOpenChange(false);
      toast({ title: 'Success', description: 'Job posted successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create job', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Job Posting</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Engineer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. TechCorp" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and requirements..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Application Deadline *</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Behavioural Questions</Label>
              <Button type="button" variant="secondary" size="sm" onClick={handleGenerateQuestions} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Ask AI
              </Button>
            </div>
            <Input value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="Question 1" />
            <Input value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="Question 2" />
            <Input value={q3} onChange={(e) => setQ3(e.target.value)} placeholder="Question 3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resumeWeight">Resume Weight (%)</Label>
              <Input id="resumeWeight" type="number" value={resumeWeight} onChange={(e) => setResumeWeight(e.target.value)} min="0" max="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="behaviourWeight">Behaviour Weight (%)</Label>
              <Input id="behaviourWeight" type="number" value={behaviourWeight} onChange={(e) => setBehaviourWeight(e.target.value)} min="0" max="100" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
