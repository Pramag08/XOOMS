import { motion } from 'motion/react';
import SearchPill from '../components/SearchPill';
import { 
  UserCheck, Wrench, Wifi, Volume2, FileCheck, Star, 
  Search as SearchIcon, FileText, CreditCard, Heart,
  ShieldCheck, CheckCircle
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const slideUpMask = {
  hidden: { y: "100%" },
  visible: { 
    y: 0,
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function About() {
  return (
    <div className="min-h-screen bg-bone">
      {/* Section A: The Mission */}
      <section className="min-h-[80vh] px-4 md:px-12 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32 pt-32">
        <div className="order-2 lg:order-1">
          <div className="overflow-hidden">
            <motion.h1 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-charcoal leading-[0.9] tracking-tight"
            >
              <div className="overflow-hidden">
                <motion.span variants={slideUpMask} className="block">We exist to end</motion.span>
              </div>
              <div className="overflow-hidden">
                <motion.span variants={slideUpMask} className="block italic text-charcoal/80">the rental compromise.</motion.span>
              </div>
            </motion.h1>
          </div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="order-1 lg:order-2 h-[60vh] lg:h-[80vh] rounded-[2rem] overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop" 
            alt="Architectural Detail" 
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>

      {/* Section B: Platform Utility */}
      <section className="px-4 md:px-12 max-w-[1600px] mx-auto mb-40">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-charcoal/10 pt-12"
        >
          <motion.div variants={fadeInUp} className="col-span-1">
            <span className="text-xs font-bold uppercase tracking-widest text-charcoal/40">Platform Utility</span>
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-1 md:col-span-3">
            <p className="font-sans text-xl md:text-3xl text-charcoal leading-relaxed font-light">
              XOOMS is a curated marketplace of audited living spaces. We serve students and working professionals who refuse to gamble with their living standards. By rigorously vetting every square foot for safety, quality, and acoustic comfort, we replace uncertainty with guaranteed peace of mind.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Section C: The Verification Process */}
      <section className="px-4 md:px-12 max-w-[1600px] mx-auto mb-40">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">The Trust Engine</h2>
          <p className="text-charcoal/60 max-w-xl">Our proprietary 6-point vetting process ensures what you see is exactly what you get.</p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            { icon: UserCheck, title: "Staff Vetting", desc: "Complete police verification and background checks on all on-site staff." },
            { icon: Wrench, title: "Infrastructure Check", desc: "Rigorous testing of water pressure, electrical safety, and structural integrity." },
            { icon: Wifi, title: "Connectivity Audit", desc: "Verified upload/download speeds and signal strength mapping." },
            { icon: Volume2, title: "Comfort Standards", desc: "Decibel-level acoustic testing and premium mattress quality verification." },
            { icon: FileCheck, title: "Legal Safety", desc: "Direct verification of property ownership and safety NOCs." },
            { icon: Star, title: "Owner Transparency", desc: "Historical rating analysis of landlord responsiveness and fairness." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              className="bg-white p-8 rounded-2xl border border-charcoal/5 hover:border-charcoal/20 transition-colors group"
            >
              <div className="w-12 h-12 bg-bone rounded-full flex items-center justify-center mb-6 group-hover:bg-charcoal group-hover:text-white transition-colors">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-charcoal mb-3">{item.title}</h3>
              <p className="text-sm text-charcoal/60 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Section D: Verification Status Check */}
      <section className="px-4 md:px-12 max-w-[1600px] mx-auto mb-40">
        <div className="bg-charcoal text-white rounded-[3rem] p-12 lg:p-24 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px' 
            }}></div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-6">Check Status</h2>
              <p className="text-white/60 text-lg mb-12 max-w-md">
                Enter a property ID or address to view its real-time audit report and verification status.
              </p>
              
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl flex items-center max-w-md border border-white/20">
                <SearchIcon className="w-6 h-6 text-white/50 ml-4" />
                <input 
                  type="text" 
                  placeholder="Enter Property ID (e.g. XM-8921)" 
                  className="bg-transparent border-none outline-none text-white placeholder:text-white/30 w-full px-4 py-3"
                />
                <button className="bg-white text-charcoal px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-bone transition-colors">
                  Check
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-white/40 mb-1">Sample Report</span>
                  <span className="font-mono text-lg text-gold">XM-8921-A</span>
                </div>
                <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Identity Verification", status: "Passed", icon: CheckCircle, color: "text-green-400" },
                  { label: "Safety Audit", status: "Passed", icon: CheckCircle, color: "text-green-400" },
                  { label: "Legal Clearance", status: "Passed", icon: CheckCircle, color: "text-green-400" },
                  { label: "Amenity Check", status: "Passed", icon: CheckCircle, color: "text-green-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white/80">{item.label}</span>
                    <div className={`flex items-center gap-2 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-bold">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <span className="text-xs text-white/40">Last audited: 24 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section E: User Journey */}
      <section className="px-4 md:px-12 max-w-[1600px] mx-auto mb-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="sticky top-40"
            >
              <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">How it works</h2>
              <p className="text-charcoal/60 text-lg">From discovery to move-in, we've streamlined the entire rental journey.</p>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-12 relative before:absolute before:left-6 before:top-6 before:bottom-6 before:w-px before:bg-charcoal/10"
            >
              {[
                { icon: SearchIcon, step: "01", title: "Browse", desc: "Select your ideal property type using our curated arch-grid interface." },
                { icon: FileText, step: "02", title: "Review Audit", desc: "Read the detailed Standards Report for total transparency." },
                { icon: CreditCard, step: "03", title: "Book", desc: "Secure your space instantly with our dynamic, secure checkout." },
                { icon: Heart, step: "04", title: "Live", desc: "Enjoy your new standard of living with continuous XOR support." }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeInUp} className="relative pl-20">
                  <div className="absolute left-0 top-0 w-12 h-12 bg-white border border-charcoal/10 rounded-full flex items-center justify-center z-10">
                    <item.icon className="w-5 h-5 text-charcoal" />
                  </div>
                  <div className="bg-white p-8 rounded-2xl border border-charcoal/5 hover:border-charcoal/20 transition-colors">
                    <span className="text-xs font-bold text-gold uppercase tracking-widest mb-2 block">Step {item.step}</span>
                    <h3 className="font-serif text-2xl text-charcoal mb-3">{item.title}</h3>
                    <p className="text-charcoal/60">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
