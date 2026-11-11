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
    <div className="bg-white rounded-xl border border-[#EFE3D8] shadow-xs p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EFE3D8]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1877A3] text-white rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1877A3]">DC Short-Term Rental Compliance Checklist</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#D8EEF5] text-[#1877A3] px-2 py-0.5 rounded border border-[#BBE0EC]">
                Statutory Guidelines
              </span>
            </div>
            <p className="text-xs text-[#4B6375]">
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
            checkedItems.primary ? 'bg-[#D8EEF5]/50 border-[#1877A3]' : 'bg-[#FFF8F3] border-[#EFE3D8] hover:bg-[#D8EEF5]/20'
          }`}
        >
          <div className="mt-0.5 text-[#1877A3]">
            {checkedItems.primary ? <CheckSquare className="w-5 h-5 text-[#39B8A2]" /> : <Square className="w-5 h-5 text-[#BBE0EC]" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1F3442] text-[13px]">
              <span>1. Primary Residence Requirement</span>
            </div>
            <p className="text-[#4B6375] mt-1 leading-relaxed">
              District law requires that the host/owner must maintain the property as their primary residence, occupying it for at least 185 days per calendar year. Second homes and pure investor properties cannot be operated as short-term rentals in DC.
            </p>
          </div>
        </div>

        {/* Item 2: Short-Term Rental License */}
        <div
          onClick={() => toggleItem('license')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.license ? 'bg-[#D8EEF5]/50 border-[#1877A3]' : 'bg-[#FFF8F3] border-[#EFE3D8] hover:bg-[#D8EEF5]/20'
          }`}
        >
          <div className="mt-0.5 text-[#1877A3]">
            {checkedItems.license ? <CheckSquare className="w-5 h-5 text-[#39B8A2]" /> : <Square className="w-5 h-5 text-[#BBE0EC]" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1F3442] text-[13px]">
              <FileText className="w-3.5 h-3.5 text-[#1877A3]" />
              <span>2. Short-Term Rental License & Endorsement</span>
            </div>
            <p className="text-[#4B6375] mt-1 leading-relaxed">
              Must obtain a Basic Business License (BBL) with either a Short-Term Rental (Hosted) or Vacation Rental (Unhosted) endorsement from the DC Department of Licensing and Consumer Protection (DLCP). Clean Hands Certification required.
            </p>
          </div>
        </div>

        {/* Item 3: Condo Association Approval */}
        <div
          onClick={() => toggleItem('condo')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.condo
              ? 'bg-[#D8EEF5]/50 border-[#1877A3]'
              : isCondo
              ? 'bg-[#D8EEF5]/30 border-[#BBE0EC]'
              : 'bg-[#FFF8F3] border-[#EFE3D8] hover:bg-[#D8EEF5]/20'
          }`}
        >
          <div className="mt-0.5 text-[#1877A3]">
            {checkedItems.condo ? <CheckSquare className="w-5 h-5 text-[#39B8A2]" /> : <Square className="w-5 h-5 text-[#BBE0EC]" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1F3442] text-[13px]">
              <Building2 className="w-3.5 h-3.5 text-[#1877A3]" />
              <span>3. Condo Association / HOA By-Laws</span>
              {isCondo && (
                <span className="text-[10px] bg-[#D8EEF5] text-[#1877A3] px-1.5 py-0.2 rounded font-semibold border border-[#BBE0EC]">
                  Client is Condo
                </span>
              )}
            </div>
            <p className="text-[#4B6375] mt-1 leading-relaxed">
              Verify condominium declaration and HOA bylaws. DC law requires proof that the association does not prohibit short-term rentals (many DC condo bylaws enforce 30-day or 6-month minimum lease covenants).
            </p>
          </div>
        </div>

        {/* Item 4: 90-Night Annual Cap if Owner Absent */}
        <div
          onClick={() => toggleItem('cap')}
          className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
            checkedItems.cap
              ? 'bg-[#FDF0EC] border-[#E76F51]'
              : isOwnerAbsent
              ? 'bg-[#FDF0EC]/80 border-[#E76F51]/40'
              : 'bg-[#FFF8F3] border-[#EFE3D8] hover:bg-[#D8EEF5]/20'
          }`}
        >
          <div className="mt-0.5 text-[#E76F51]">
            {checkedItems.cap ? <CheckSquare className="w-5 h-5 text-[#E76F51]" /> : <Square className="w-5 h-5 text-[#BBE0EC]" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1F3442] text-[13px]">
              <Calendar className="w-3.5 h-3.5 text-[#E76F51]" />
              <span>4. 90-Night Annual Cap (Owner Absent)</span>
              {isOwnerAbsent && (
                <span className="text-[10px] bg-[#E76F51]/20 text-[#E76F51] px-1.5 py-0.2 rounded font-bold border border-[#E76F51]/30">
                  Applies to this Property
                </span>
              )}
            </div>
            <p className="text-[#4B6375] mt-1 leading-relaxed">
              If the owner will not live at the property during guest stays (Vacation Rental endorsement), DC law strictly caps bookings at <strong>90 nights per calendar year</strong>. Violations risk penalties starting at $1,000 per infraction and revocation of license.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#EFE3D8] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#4B6375] gap-2">
        <span>Static statutory reference pursuant to D.C. Law 22-307. Does not constitute formal legal counsel.</span>
        <span className="font-semibold text-[#1877A3]">
          Status: {Object.values(checkedItems).filter(Boolean).length} of 4 verified
        </span>
      </div>
    </div>
  );
};
