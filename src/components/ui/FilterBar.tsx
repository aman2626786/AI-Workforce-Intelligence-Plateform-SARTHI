'use client';

import React from 'react';
import { Filter, Briefcase, MapPin, Calendar } from 'lucide-react';

export interface RoleCategoryGroup {
  category: string;
  roles: string[];
}

export const DEFAULT_ROLE_GROUPS: RoleCategoryGroup[] = [
  {
    category: '🤖 Robotics & Embedded Systems',
    roles: [
      'Robotics Engineer',
      'Autonomous Systems Engineer',
      'Embedded Systems Engineer',
      'IoT & Firmware Engineer',
      'Mechatronics Engineer',
      'Hardware / PCB Design Engineer',
    ],
  },
  {
    category: '🧠 AI & Machine Learning',
    roles: [
      'AI Engineer',
      'Machine Learning Engineer',
      'Computer Vision Engineer',
      'NLP / LLM Engineer',
      'MLOps Engineer',
      'Generative AI Specialist',
    ],
  },
  {
    category: '💻 Software Engineering',
    roles: [
      'Full Stack Developer',
      'Software Engineer',
      'Backend Developer',
      'Frontend Developer',
      'Systems Engineer',
      'Mobile App Developer',
    ],
  },
  {
    category: '📊 Data & Analytics',
    roles: [
      'Data Scientist',
      'Data Analyst',
      'Data Engineer',
      'BI Analyst',
      'Business Analytics Specialist',
    ],
  },
  {
    category: '🛡️ Cloud, DevOps & Security',
    roles: [
      'Cloud & DevOps Engineer',
      'Site Reliability Engineer (SRE)',
      'Cybersecurity Analyst',
      'Security Engineer',
      'SOC Analyst',
    ],
  },
  {
    category: '🚀 Product & Quality',
    roles: [
      'Product Manager',
      'QA / Automation Engineer',
    ],
  },
];

export const DEFAULT_LOCATIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Delhi NCR',
  'Mumbai',
  'Chennai',
  'Noida / Gurgaon',
  'Remote (India / Global)',
  'Pan India',
];

interface FilterBarProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  selectedTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  rolesList?: string[];
  roleGroups?: RoleCategoryGroup[];
  locationsList?: string[];
  timeframesList?: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedRole,
  onRoleChange,
  selectedLocation,
  onLocationChange,
  selectedTimeframe = 'Last 6 Months',
  onTimeframeChange,
  rolesList,
  roleGroups = DEFAULT_ROLE_GROUPS,
  locationsList = DEFAULT_LOCATIONS,
  timeframesList = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Past Year'],
}) => {
  // Check if selectedRole is in groups or list, if not add as custom option at top
  const allKnownRoles = rolesList || roleGroups.flatMap((g) => g.roles);
  const isCustomSelected = selectedRole && !allKnownRoles.includes(selectedRole);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft-sm flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Filter className="w-4 h-4 text-brand-600" />
        Market Filters
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Role Select */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <Briefcase className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-slate-400">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            {isCustomSelected && (
              <option value={selectedRole}>
                ✨ {selectedRole} (Your Focus)
              </option>
            )}

            {rolesList ? (
              rolesList.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))
            ) : (
              roleGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
        </div>

        {/* Location Select */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-400">Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            {locationsList.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Select */}
        {onTimeframeChange && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-slate-400">Period:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {timeframesList.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
