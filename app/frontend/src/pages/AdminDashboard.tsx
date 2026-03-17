/* --- File: src/pages/AdminDashboard.tsx --- */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, Home, Clock, CheckCircle, XCircle, 
  Search, Filter, ChevronRight, Eye 
} from 'lucide-react';

// Mock Data for demonstration
const pendingUsers = [
  { id: 'U-101', name: 'John Doe', email: 'john@example.com', type: 'Owner', date: '2024-03-10' },
  { id: 'U-102', name: 'Sarah Smith', email: 'sarah@example.com', type: 'User', date: '2024-03-11' },
];

const pendingProperties = [
  { id: 'P-501', title: 'The Kensington Suite', owner: 'John Doe', location: 'London', price: '£2,500/mo' },
  { id: 'P-502', title: 'Skyline Apartment', owner: 'Alice Wang', location: 'New York', price: '$3,200/mo' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'properties'>('users');

  return (
    <div className="min-h-screen bg-bone pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-5xl text-charcoal">Admin Portal</h1>
              <div className="bg-gold/10 text-gold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border border-gold/20">
                System Oversight
              </div>
            </div>
            <p className="font-sans text-charcoal/40 text-sm uppercase tracking-widest">
              StayMadeSimple Control Center • {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-charcoal/5 flex items-center gap-4">
              <div className="bg-blue-50 p-2 rounded-xl"><Users className="w-5 h-5 text-blue-600"/></div>
              <div>
                <p className="text-[10px] uppercase text-charcoal/40 font-bold">Total Pending</p>
                <p className="text-xl font-serif text-charcoal">{pendingUsers.length + pendingProperties.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Selection */}
        <div className="flex gap-8 border-b border-charcoal/10 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'users' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            User Verification
            {activeTab === 'users' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
          <button 
            onClick={() => setActiveTab('properties')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'properties' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            Property Approvals
            {activeTab === 'properties' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
        </div>

        {/* Dynamic Content Table */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] border border-charcoal/5 overflow-hidden shadow-sm"
        >
          <table className="w-full text-left">
            <thead className="bg-charcoal/[0.02] border-b border-charcoal/5">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Details</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Submission Date</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              <AnimatePresence mode='popLayout'>
                {(activeTab === 'users' ? pendingUsers : pendingProperties).map((item) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id} 
                    className="group hover:bg-bone/30 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-bone flex items-center justify-center font-serif text-charcoal border border-charcoal/10">
                          {'name' in item ? item.name[0] : <Home className="w-4 h-4"/>}
                        </div>
                        <div>
                          <p className="font-serif text-lg text-charcoal leading-none mb-1">
                            {'name' in item ? item.name : item.title}
                          </p>
                          <p className="text-xs text-charcoal/40">{'email' in item ? item.email : item.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gold">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Pending</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-charcoal/60">
                      {'date' in item ? item.date : 'Mar 12, 2024'}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 rounded-lg hover:bg-charcoal hover:text-white border border-charcoal/5 transition-all" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {/* Empty State */}
          {(activeTab === 'users' ? pendingUsers : pendingProperties).length === 0 && (
            <div className="py-20 text-center">
              <ShieldCheck className="w-12 h-12 text-charcoal/10 mx-auto mb-4" />
              <p className="font-serif text-xl text-charcoal/40">All clearances complete.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}