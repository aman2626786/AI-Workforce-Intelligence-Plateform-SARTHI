'use client';

import React from 'react';
import { Filter, Briefcase, MapPin, Calendar } from 'lucide-react';

export interface RoleCategoryGroup {
  category: string;
  roles: string[];
}

export const DEFAULT_ROLE_GROUPS: RoleCategoryGroup[] = [
  {
    category: 'Software Engineering',
    roles: [
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'Software Engineer',
      'Mobile App Developer',
      'Systems Engineer',
    ],
  },
  {
    category: 'Data Science & Analytics',
    roles: [
      'Data Scientist',
      'Data Analyst',
      'Data Engineer',
      'Business Intelligence Analyst',
      'Data Analytics Consultant',
    ],
  },
  {
    category: 'AI & Machine Learning',
    roles: [
      'Machine Learning Engineer',
      'AI Engineer',
      'Generative AI Specialist',
      'MLOps Engineer',
      'NLP / LLM Engineer',
      'Computer Vision Engineer',
    ],
  },
  {
    category: 'Cloud, DevOps & Infrastructure',
    roles: [
      'Cloud Engineer',
      'DevOps Engineer',
      'Site Reliability Engineer (SRE)',
      'Solutions Architect',
    ],
  },
  {
    category: 'Cybersecurity',
    roles: [
      'Cybersecurity Analyst',
      'Security Engineer',
      'SOC Analyst',
    ],
  },
  {
    category: 'Product & Quality',
    roles: [
      'Product Manager',
      'QA / Automation Engineer',
    ],
  },
  {
    category: 'Robotics & Embedded Systems',
    roles: [
      'Robotics Engineer',
      'Embedded Systems Engineer',
      'IoT Engineer',
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
  selectedLocation?: string;
  onLocationChange?: (loc: string) => void;
  hideLocation?: boolean;
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
  hideLocation = false,
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
    <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-soft-sm flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Filter className="w-4 h-4 text-sky-600" />
        Market Filters
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Role Select */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
          <Briefcase className="w-4 h-4 text-sky-600" />
          <span className="text-slate-400 font-semibold">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[220px] truncate text-sm"
          >
            {isCustomSelected && (
              <option value={selectedRole} className="bg-white text-slate-900 font-bold">
                {selectedRole} (Active Focus)
              </option>
            )}

            {rolesList ? (
              rolesList.map((role) => (
                <option key={role} value={role} className="bg-white text-slate-800 font-medium py-1">
                  {role}
                </option>
              ))
            ) : (
              roleGroups.map((group) => (
                <optgroup key={group.category} label={group.category} className="bg-slate-100 text-slate-900 font-bold py-1">
                  {group.roles.map((role) => (
                    <option key={role} value={role} className="bg-white text-slate-800 font-medium py-1">
                      {role}
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
        </div>

        {/* Location Select (hidden if hideLocation is true) */}
        {!hideLocation && selectedLocation && onLocationChange && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-400 font-semibold">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-sm"
            >
              {locationsList.map((loc) => (
                <option key={loc} value={loc} className="bg-white text-slate-800 font-medium py-1">
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timeframe Select */}
        {onTimeframeChange && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span className="text-slate-400 font-semibold">Period:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-sm"
            >
              {timeframesList.map((tf) => (
                <option key={tf} value={tf} className="bg-white text-slate-800 font-medium py-1">
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
