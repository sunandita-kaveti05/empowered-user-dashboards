import React from 'react';
import { Job, SkillGapAnalysis } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SkillGapChartProps {
  job: Job;
  className?: string;
}

export const SkillGapChart: React.FC<SkillGapChartProps> = ({ job, className }) => {
  const skillGapData: SkillGapAnalysis[] = (job.requiredSkills || []).map(skill => {
    const applicantsWithSkill = job.applicants.filter(a =>
      a.extractedSkills?.some(s => s.name.toLowerCase() === skill.toLowerCase())
    ).length;
    const maxAvailable = job.applicants.length;
    const availablePercentage = maxAvailable > 0 ? (applicantsWithSkill / maxAvailable) * 100 : 0;

    return {
      skill,
      required: 100,
      available: Math.round(availablePercentage),
      gap: Math.round(100 - availablePercentage),
    };
  });

  if (skillGapData.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-4">
          No required skills defined for this job.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={skillGapData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis dataKey="skill" type="category" width={80} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="available" name="Available" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="gap" name="Gap" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
