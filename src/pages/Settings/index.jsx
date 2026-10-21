import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings2, Activity, Zap, CheckCheck,
  Users, MapPin, Layers, Plane, Shield
} from 'lucide-react';
import { useMotion } from '../../hooks/useMotion';
import GeneralTab    from './tabs/GeneralTab';
import NodesTab      from './tabs/NodesTab';
import OperationsTab from './tabs/OperationsTab';
import DronesTab     from './tabs/DronesTab';
import ChecklistTab  from './tabs/ChecklistTab';
import TeamsTab      from './tabs/TeamsTab';
import CampsTab      from './tabs/CampsTab';
import UsersTab      from './tabs/UsersTab';

const TABS = [
  { id: 'general',    label: 'General',         icon: Settings2,  desc: 'System configuration'    },
  { id: 'nodes',      label: 'Sensor Nodes',     icon: Activity,   desc: 'Node management'         },
  { id: 'operations', label: 'Operations',       icon: Layers,     desc: 'Operation management'    },
  { id: 'drones',     label: 'Drones',           icon: Plane,      desc: 'Drone management'        },
  { id: 'checklist',  label: 'Preflight Checks', icon: CheckCheck, desc: 'Checklist management'    },
  { id: 'teams',      label: 'Rescue Teams',     icon: Users,      desc: 'Team management'         },
  { id: 'camps',      label: 'Rescue Camps',     icon: MapPin,     desc: 'Camp management'         },
  { id: 'users',      label: 'Users',            icon: Shield,     desc: 'Access control'          },
];

const TAB_COMPONENTS = {
  general:    GeneralTab,
  nodes:      NodesTab,
  operations: OperationsTab,
  drones:     DronesTab,
  checklist:  ChecklistTab,
  teams:      TeamsTab,
  camps:      CampsTab,
  users:      UsersTab,
};

const SettingsPage = () => {
  const motion_config = useMotion();
  const [activeTab, setActiveTab] = useState('general');
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <motion.div {...motion_config.fadeSlideUp}>
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">Settings</h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          System configuration and data management
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Left Sub-Nav ─────────────────────────────── */}
        <div className="lg:w-[200px] lg:flex-shrink-0">
          <nav className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden
                          flex lg:flex-col overflow-x-auto">
            {TABS.map((tab, idx) => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3
                              whitespace-nowrap flex-shrink-0
                              lg:w-full text-left transition-colors duration-100
                              lg:border-t lg:border-[#F8FAFC] first:border-0
                              border-r border-[#F8FAFC] lg:border-r-0
                              ${isActive
                                ? 'bg-[#EFF6FF] text-[#2563EB]'
                                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                              }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'} />
                  <span className="text-[12px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right Content ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ActiveComponent />
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default SettingsPage;
