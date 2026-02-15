import React from 'react';
import { Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardProps {
  job: Job;
  isApplied?: boolean;
  onApply?: () => void;
  showApplicants?: boolean;
  onViewApplicants?: () => void;
}

export const JobCard = React.forwardRef<HTMLDivElement, JobCardProps>(
  ({ job, isApplied, onApply, showApplicants, onViewApplicants }, ref) => {
    const isDeadlinePassed = new Date(job.deadline) < new Date();

    return (
      <Card ref={ref} className="h-full flex flex-col hover:shadow-elevated transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
              {job.title}
            </CardTitle>
            {isApplied && (
              <Badge className="shrink-0 bg-success text-success-foreground">Applied</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Building2 className="w-4 h-4" />
            <span>{job.company}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {job.description}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {isDeadlinePassed ? 'Closed' : `Due ${format(new Date(job.deadline), 'MMM d, yyyy')}`}
              </span>
            </div>
            {showApplicants && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{job.applicants.length} applicants</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          {showApplicants ? (
            <Button onClick={onViewApplicants} className="w-full" size="sm">
              View Applicants ({job.applicants.length})
            </Button>
          ) : (
            <Button
              onClick={onApply}
              disabled={isApplied || isDeadlinePassed}
              className="w-full"
              size="sm"
              variant={isApplied ? 'secondary' : 'default'}
            >
              {isApplied ? 'Already Applied' : isDeadlinePassed ? 'Deadline Passed' : 'Apply Now'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }
);

JobCard.displayName = 'JobCard';
