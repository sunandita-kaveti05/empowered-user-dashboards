import React from 'react';
import { Job } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HiringFunnelChartProps {
  jobs: Job[];
  className?: string;
}

export const HiringFunnelChart: React.FC<HiringFunnelChartProps> = ({ jobs, className }) => {
  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants.length, 0);
  const underReview = jobs.reduce((sum, job) =>
    sum + job.applicants.filter(a => a.status === 'Under Review').length, 0);
  const shortlisted = jobs.reduce((sum, job) =>
    sum + job.applicants.filter(a => a.status === 'Shortlisted').length, 0);

  const data = [
    { name: 'Applications', value: totalApplicants },
    { name: 'Under Review', value: underReview },
    { name: 'Shortlisted', value: shortlisted },
  ];

  const colors = ['hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(142, 76%, 36%)'];

  return (
    <div className={className}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
