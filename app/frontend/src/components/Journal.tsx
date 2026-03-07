import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const articles = [
  {
    title: "More and more EU hosts rely on annuity income",
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Helping Hosts in Massachusetts make their homes more energy efficient",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "How four owners turned their historic homes into legendary stays",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function Journal() {
  return (
    <section id="about" className="py-24 px-4 md:px-12 bg-bone">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-12">
          Stay up to date
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group cursor-pointer"
            >
              <div className="overflow-hidden rounded-2xl mb-6 aspect-[4/3]">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-sans font-medium text-lg leading-snug text-charcoal group-hover:text-gold transition-colors">
                {article.title}
              </h3>
            </motion.div>
          ))}
        </div>

        <div className="mt-12">
          <button className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-charcoal hover:text-gold transition-colors">
            Show All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
