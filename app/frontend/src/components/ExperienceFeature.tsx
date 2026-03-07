import { motion } from 'motion/react';

export default function ExperienceFeature() {
  return (
    <section id="verification" className="py-24 px-4 md:px-12 bg-bone">
      <div className="max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden bg-charcoal text-white min-h-[600px] flex items-center">
        
        {/* Content */}
        <div className="relative z-10 p-12 md:p-24 max-w-2xl">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-5xl md:text-6xl leading-[1.1] mb-8"
          >
            Discover a new <br/>
            <span className="italic text-gold">unique</span> living experience
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-sans text-white/70 text-lg leading-relaxed mb-12 max-w-md"
          >
            Take a step into the extraordinary. Every XOOMS property is rigorously vetted for safety, comfort, and design quality. Your home away from everywhere is waiting.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white text-charcoal px-8 py-4 rounded-full font-sans text-xs uppercase tracking-widest font-bold hover:bg-gold hover:text-white transition-colors"
          >
            Discover Standards
          </motion.button>
        </div>

        {/* Floating Circles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Circle 1 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, x: 100 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="absolute top-12 right-12 w-48 h-48 rounded-full overflow-hidden border-4 border-white/10"
          >
            <img src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2069&auto=format&fit=crop" className="w-full h-full object-cover" alt="Detail" />
          </motion.div>

          {/* Circle 2 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute bottom-24 right-1/4 w-32 h-32 rounded-full overflow-hidden border-4 border-white/10"
          >
            <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Detail" />
          </motion.div>

           {/* Circle 3 */}
           <motion.div 
            initial={{ opacity: 0, scale: 0.5, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 opacity-60"
          >
            <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Detail" />
          </motion.div>

          {/* Circle 4 - Bottom Right Large */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full overflow-hidden border-4 border-white/10"
          >
            <img src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Detail" />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
