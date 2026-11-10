import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, Building2, Calendar, CheckSquare, Square, ExternalLink } from 'lucide-react';

interface ComplianceChecklistProps {
  isOwnerAbsent: boolean;
  isCondo: boolean;
}

export const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({ isOwnerAbsent, isCondo }) => {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    primary: false,
    license: false,
    condo: false,
    cap: isOwnerAbsent, // Pre-highlight if owner is absent
  });

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-900 text-white rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">DC Short-Term Rental Compliance Checklist</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Statutory Guidelines
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mandatory legal requirements under the DC Short-Term Rental Regulation Act of 2019 (DLCP)
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
        {/* Item 1: Primary Residence */}
        <div
          onClick={() => toggleItem('primary')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.primary ? 'bg-blue-50/60 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="mt-0.5 text-blue-800">
            {checkedItems.primary ? <CheckSquare className="w-5 h-5 text-blue-700" /> : <Square className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[13px]">
              <span>1. Primary Residence Requirement</span>
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">
              District law requires that the host/owner must maintain the property as their primary residence, occupying it for at least 185 days per calendar year. Second homes and pure investor properties cannot be operated as short-term rentals in DC.
            </p>
          </div>
        </div>

        {/* Item 2: Short-Term Rental License */}
        <div
          onClick={() => toggleItem('license')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.license ? 'bg-blue-50/60 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="mt-0.5 text-blue-800">
            {checkedItems.license ? <CheckSquare className="w-5 h-5 text-blue-700" /> : <Square className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[13px]">
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Short-Term Rental License & Endorsement</span>
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Must obtain a Basic Business License (BBL) with either a Short-Term Rental (Hosted) or Vacation Rental (Unhosted) endorsement from the DC Department of Licensing and Consumer Protection (DLCP). Clean Hands Certification required.
            </p>
          </div>
        </div>

        {/* Item 3: Condo Association Approval */}
        <div
          onClick={() => toggleItem('condo')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.condo
              ? 'bg-blue-50/60 border-blue-300'
              : isCondo
              ? 'bg-amber-50/50 border-amber-300'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="mt-0.5 text-blue-800">
            {checkedItems.condo ? <CheckSquare className="w-5 h-5 text-blue-700" /> : <Square className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[13px]">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span>3. Condo Association / HOA By-Laws</span>
              {isCondo && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                  Client is Condo
                </span>
              )}
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Verify condominium declaration and HOA bylaws. DC law requires proof that the association does not prohibit short-term rentals (many DC condo bylaws enforce 30-day or 6-month minimum lease covenants).
            </p>
          </div>
        </div>

        {/* Item 4: 90-Night Annual Cap if Owner Absent */}
        <div
          onClick={() => toggleItem('cap')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.cap
              ? 'bg-rose-50 border-rose-300'
              : isOwnerAbsent
              ? 'bg-rose-50/60 border-rose-200'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="mt-0.5 text-rose-700">
            {checkedItems.cap ? <CheckSquare className="w-5 h-5 text-rose-700" /> : <Square className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-950 text-[13px]">
              <Calendar className="w-3.5 h-3.5 text-rose-700" />
              <span>4. 90-Night Annual Cap (Owner Absent)</span>
              {isOwnerAbsent && (
                <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-bold">
                  Applies to this Property
                </span>
              )}
            </div>
            <p className="text-rose-900/90 mt-1 leading-relaxed">
              If the owner will not live at the property during guest stays (Vacation Rental endorsement), DC law strictly caps bookings at <strong>90 nights per calendar year</strong>. Violations risk penalties starting at $1,000 per infraction and revocation of license.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>Static statutory reference pursuant to D.C. Law 22-307. Does not constitute formal legal counsel.</span>
        <span className="font-semibold text-slate-700">
          Status: {Object.values(checkedItems).filter(Boolean).length} of 4 verified
        </span>
      </div>
    </div>
  );
};
