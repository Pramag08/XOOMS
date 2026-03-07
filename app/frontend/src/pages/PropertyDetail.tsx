import { motion } from 'motion/react';
import { 
  Wifi, Shield, Sparkles, Coffee, Star, CheckCircle, 
  MapPin, Bed, Bath, Square, Car, Dumbbell, 
  Thermometer, Monitor, Heart, Share2,
  Maximize2, Mail, Phone
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

// Mock data for the specific property
const propertyDetails = {
  id: 1,
  title: "The Kensington Suite",
  location: "Indiranagar, Bangalore",
  type: "Serviced Apartment",
  price: "₹35,000",
  rating: 4.9,
  description: "Welcome to your potential new home! This lovely home features with 4 bedrooms and 4 bathrooms, making it ideal for your family's needs. With a generous 1,500m² square footage, there's plenty of space for relaxation and entertaining. You'll appreciate the modern amenities, such as smart home system, gym, pool, and backyard. Situated in the sought-after Indiranagar neighborhood, you'll enjoy easy access to local shops, dining, and parks.",
  specs: {
    bedrooms: 4,
    bathrooms: 4,
    area: "1,500m²",
    parking: "Garage",
    pool: "Private Pool"
  },
  facilities: [
    { icon: Wifi, label: "Free WiFi" },
    { icon: Monitor, label: "Smart TV" },
    { icon: Thermometer, label: "AC & Heating" },
    { icon: Car, label: "Free Parking" },
    { icon: Shield, label: "24/7 Security" },
    { icon: Sparkles, label: "Housekeeping" },
    { icon: Coffee, label: "Coffee Machine" },
    { icon: Dumbbell, label: "Gym Access" }
  ],
  images: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070&auto=format&fit=crop"
  ],
  agent: {
    name: "Sarah Jenkins",
    role: "Senior Property Manager",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop"
  }
};

// Mock data for recommendations
const recommendations = [
  {
    id: 2,
    title: "Urban Heights",
    location: "Koramangala, Bangalore",
    price: "₹18,000",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
    type: "Premium PG",
    rating: 4.7
  },
  {
    id: 3,
    title: "Azure Living",
    location: "Whitefield, Bangalore",
    price: "₹22,000",
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop",
    type: "Co-living",
    rating: 4.8
  },
  {
    id: 4,
    title: "The Minimalist",
    location: "HSR Layout, Bangalore",
    price: "₹28,000",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070&auto=format&fit=crop",
    type: "Studio",
    rating: 4.9
  }
];

// Mock data for reviews
const reviews = [
  {
    id: 1,
    name: "Emily Watson",
    date: "October 2023",
    rating: 5,
    comment: "Absolutely stunning property. The amenities are top-notch and the location is perfect. The management team was very responsive.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Michael Chen",
    date: "September 2023",
    rating: 4,
    comment: "Great place to live. The gym is well-equipped and the pool is always clean. Only minor issue was some noise from the street on weekends.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Sarah Johnson",
    date: "August 2023",
    rating: 5,
    comment: "I've lived here for 6 months and I love it. The apartment is spacious and modern. Highly recommend!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1770&auto=format&fit=crop"
  }
];

export default function PropertyDetail() {
  const { id } = useParams();

  return (
    <div className="pt-32 pb-20 px-4 md:px-12 min-h-screen bg-bone">
      <div className="max-w-7xl mx-auto">
        
        {/* Gallery Section */}
        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[500px] mb-12 rounded-3xl overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="col-span-4 md:col-span-2 row-span-2 relative group"
          >
            <img src={propertyDetails.images[0]} className="w-full h-full object-cover" alt="Main" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
          </motion.div>
          {propertyDetails.images.slice(1, 4).map((img, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 * (i + 1) }}
              className="col-span-2 md:col-span-1 row-span-1 relative group"
            >
              <img src={img} className="w-full h-full object-cover" alt={`Detail ${i+1}`} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
            </motion.div>
          ))}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="col-span-2 md:col-span-1 row-span-1 relative group cursor-pointer"
          >
            <img src={propertyDetails.images[4]} className="w-full h-full object-cover" alt="Detail 4" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-white hover:text-charcoal transition-all">
                <Maximize2 className="w-4 h-4" />
                Show all photos
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Title & Actions */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-serif text-3xl md:text-5xl text-charcoal mb-2">{propertyDetails.title}</h1>
                <p className="font-sans text-charcoal/60 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-charcoal/40" />
                  {propertyDetails.location}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 rounded-full border border-charcoal/10 hover:bg-charcoal hover:text-white transition-colors text-charcoal/60">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full border border-charcoal/10 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors text-charcoal/60">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Specs Bar */}
            <div className="flex flex-wrap gap-8 py-8 border-y border-charcoal/10">
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-charcoal/40" />
                <div>
                  <span className="block text-sm font-bold text-charcoal">{propertyDetails.specs.bedrooms} Bedrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath className="w-5 h-5 text-charcoal/40" />
                <div>
                  <span className="block text-sm font-bold text-charcoal">{propertyDetails.specs.bathrooms} Bathrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Square className="w-5 h-5 text-charcoal/40" />
                <div>
                  <span className="block text-sm font-bold text-charcoal">{propertyDetails.specs.area}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-charcoal/40" />
                <div>
                  <span className="block text-sm font-bold text-charcoal">{propertyDetails.specs.parking}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-lg text-charcoal/80 font-sans max-w-none">
              <h3 className="font-serif text-2xl text-charcoal mb-4">Description</h3>
              <p className="leading-relaxed">
                {propertyDetails.description}
              </p>
              <button className="text-gold font-bold text-sm uppercase tracking-wider mt-2 hover:underline">
                Read More
              </button>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="font-serif text-2xl text-charcoal mb-6">Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {propertyDetails.facilities.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-charcoal/5">
                    <item.icon className="w-5 h-5 text-gold" />
                    <span className="text-sm font-medium text-charcoal">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Map */}
            <div>
              <h3 className="font-serif text-2xl text-charcoal mb-6">Location</h3>
              <div className="w-full h-[400px] rounded-3xl overflow-hidden relative bg-charcoal/5">
                {/* Placeholder Map Image - In a real app, use Google Maps API */}
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
                  alt="Map Location" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      <img src={propertyDetails.images[0]} className="w-full h-full object-cover" alt="Thumbnail" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-charcoal">{propertyDetails.title}</p>
                      <p className="text-[10px] text-charcoal/60">{propertyDetails.location}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-charcoal/60 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {propertyDetails.location}, India
              </p>
            </div>

          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-8">
              
              {/* Price Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-charcoal/5 border border-charcoal/5">
                <div className="mb-6">
                  <span className="text-charcoal/60 text-sm block mb-1">Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-serif text-charcoal">{propertyDetails.price}</span>
                  </div>
                </div>

                <button className="w-full border border-charcoal text-charcoal py-4 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-charcoal/5 transition-colors mb-3">
                  Try Mortgage Scheme
                </button>
              </div>

              {/* Agent Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-charcoal/5 border border-charcoal/5">
                <h3 className="font-serif text-lg text-charcoal mb-6">Agent Detail</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-charcoal/10">
                    <img src={propertyDetails.agent.image} alt={propertyDetails.agent.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-charcoal">{propertyDetails.agent.name}</p>
                    <p className="text-xs text-charcoal/60 uppercase tracking-wider">{propertyDetails.agent.role}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-charcoal text-white py-3 rounded-xl font-sans text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                    <Mail className="w-3 h-3" /> Mail Agent
                  </button>
                  <button className="border border-charcoal/20 text-charcoal py-3 rounded-xl font-sans text-[10px] uppercase tracking-widest font-bold hover:bg-charcoal/5 transition-colors flex items-center justify-center gap-2">
                    <Phone className="w-3 h-3" /> Call Agent
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Reviews Section */}
        <div className="mt-20 border-t border-charcoal/10 pt-16">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">Resident Reviews</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-6 h-6 text-gold fill-gold" />
                  <span className="text-2xl font-bold text-charcoal">{propertyDetails.rating}</span>
                </div>
                <span className="text-charcoal/60 text-sm">Based on 24 reviews</span>
              </div>
            </div>
            <button className="hidden md:block border border-charcoal/20 px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-charcoal hover:text-white transition-colors">
              Write a Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-8 rounded-3xl border border-charcoal/5 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal">{review.name}</h4>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">{review.date}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < review.rating ? 'text-gold fill-gold' : 'text-charcoal/20'}`} 
                    />
                  ))}
                </div>
                <p className="text-charcoal/70 leading-relaxed text-sm">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
             <button className="border border-charcoal/20 px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-charcoal hover:text-white transition-colors">
              Write a Review
            </button>
          </div>
        </div>

        {/* Explore More Properties */}
        <div className="mt-32 border-t border-charcoal/10 pt-16">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-4xl text-charcoal">Explore More Properties</h2>
            <div className="flex gap-2">
              {/* Navigation arrows could go here */}
            </div>
          </div>

          <div className="flex overflow-x-auto gap-8 pb-12 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {recommendations.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="min-w-[300px] md:min-w-[350px] snap-start group cursor-pointer"
              >
                <Link to={`/property/${property.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4">
                    <img 
                      src={property.image} 
                      alt={property.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Verified</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl text-charcoal group-hover:text-gold transition-colors">{property.title}</h3>
                    <p className="text-xs text-charcoal/60 font-sans">{property.location}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-charcoal/10 mt-3">
                      <p className="font-sans font-medium text-charcoal">{property.price}</p>
                      <p className="text-[10px] text-charcoal/60">★ {property.rating}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
