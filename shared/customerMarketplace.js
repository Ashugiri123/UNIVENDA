export const CUSTOMER_MODES = {
  SHOP: "shop",
  HIRE: "hire",
};

export const productCategories = [
  "Accessories",
  "Academics",
  "Art",
  "Clothing",
  "Digital",
  "Home",
  "Tech",
];

export const freelancerCategories = [
  "Design",
  "Development",
  "Marketing",
  "Research",
  "Video",
  "Writing",
];

export const products = [
  {
    id: "prod-campus-kit",
    name: "Campus Creator Kit",
    category: "Digital",
    price: 1499,
    rating: 4.9,
    inventory: 12,
    sellerName: "Aditi Studio",
    shortDescription: "Editable branding and presentation pack for student founders.",
    description:
      "A polished digital bundle with pitch deck templates, social post assets, and portfolio pages for side hustles and student-led launches.",
    images: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    ],
    tags: ["branding", "templates", "startup"],
  },
  {
    id: "prod-notes-bundle",
    name: "Engineering Notes Bundle",
    category: "Academics",
    price: 699,
    rating: 4.7,
    inventory: 30,
    sellerName: "Circuit Collective",
    shortDescription: "Semester-ready notes, solved sheets, and revision maps.",
    description:
      "Curated notes for core engineering subjects with clean summaries, solved examples, and printable revision sheets.",
    images: [
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    ],
    tags: ["notes", "engineering", "revision"],
  },
  {
    id: "prod-desk-lamp",
    name: "Minimal Desk Lamp",
    category: "Home",
    price: 2199,
    rating: 4.8,
    inventory: 6,
    sellerName: "Dorm Form",
    shortDescription: "Warm LED lamp built for compact desks and study corners.",
    description:
      "A lightweight desk lamp with adjustable angles, warm lighting modes, and a clean profile that suits hostel rooms and home setups.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    tags: ["study", "lighting", "desk"],
  },
  {
    id: "prod-campus-tee",
    name: "Campus Society Tee",
    category: "Clothing",
    price: 899,
    rating: 4.6,
    inventory: 18,
    sellerName: "North Block Apparel",
    shortDescription: "Heavy cotton tee with subtle embroidered campus graphics.",
    description:
      "Premium-weight tee designed by student illustrators, featuring clean embroidery and a relaxed fit for everyday campus wear.",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    ],
    tags: ["fashion", "campus", "apparel"],
  },
  {
    id: "prod-wireless-mouse",
    name: "Silent Wireless Mouse",
    category: "Tech",
    price: 1299,
    rating: 4.8,
    inventory: 10,
    sellerName: "Lab Cart",
    shortDescription: "Quiet-click mouse for focused work, coding, and editing.",
    description:
      "A portable wireless mouse with silent switches, USB-C charging, and long battery life tailored for students and freelancers.",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80",
    ],
    tags: ["workspace", "tech", "productivity"],
  },
  {
    id: "prod-art-print",
    name: "Cityline Art Print",
    category: "Art",
    price: 1199,
    rating: 4.9,
    inventory: 9,
    sellerName: "Ira Visuals",
    shortDescription: "Limited-run student illustration print on textured stock.",
    description:
      "A gallery-style art print drawn by a final-year design student, printed on archival paper and packaged for gifting.",
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
    ],
    tags: ["illustration", "decor", "gift"],
  },
];

export const freelancers = [
  {
    id: "freelancer-aanya",
    name: "Aanya Sharma",
    title: "Product Designer for startups and campus brands",
    category: "Design",
    pricingType: "hourly",
    price: 1200,
    rating: 4.9,
    responseTime: "Replies within 2 hours",
    availability: "Available this week",
    skills: ["Figma", "UI Design", "Brand Systems", "Landing Pages"],
    portfolioHighlights: [
      "Redesigned a student fintech MVP with 22 percent better onboarding completion.",
      "Built launch visuals for three college festivals and creator brands.",
      "Created mobile-first design systems for freelance SaaS clients.",
    ],
    bio:
      "Aanya helps early teams turn rough ideas into cleaner products, sharper interfaces, and launch-ready visual systems.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "freelancer-raghav",
    name: "Raghav Menon",
    title: "Full-stack developer for MVPs and internal tools",
    category: "Development",
    pricingType: "project",
    price: 18000,
    rating: 4.8,
    responseTime: "Replies within 5 hours",
    availability: "Open for 2 projects",
    skills: ["React", "Node.js", "Supabase", "API Design"],
    portfolioHighlights: [
      "Shipped a campus marketplace MVP in 4 weeks.",
      "Built internal dashboards for a logistics startup.",
      "Refactored a React admin app to reduce page load by 35 percent.",
    ],
    bio:
      "Raghav works with founders who need practical execution, clean backend wiring, and product-minded frontend delivery.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "freelancer-neha",
    name: "Neha Batra",
    title: "Content strategist and conversion copywriter",
    category: "Writing",
    pricingType: "fixed",
    price: 4500,
    rating: 4.7,
    responseTime: "Replies within 1 day",
    availability: "Available now",
    skills: ["Website Copy", "Case Studies", "Email Campaigns", "SEO"],
    portfolioHighlights: [
      "Wrote launch copy for D2C student brands.",
      "Produced founder profiles and portfolio stories for freelancers.",
      "Improved landing-page messaging for edtech campaigns.",
    ],
    bio:
      "Neha turns scattered ideas into structured, persuasive copy for brands, portfolios, and launch pages.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "freelancer-kabir",
    name: "Kabir Khan",
    title: "Performance marketer for student startups",
    category: "Marketing",
    pricingType: "hourly",
    price: 1400,
    rating: 4.8,
    responseTime: "Replies within 4 hours",
    availability: "Available from Monday",
    skills: ["Meta Ads", "Campaign Strategy", "Analytics", "Growth Loops"],
    portfolioHighlights: [
      "Scaled festival registrations through paid social campaigns.",
      "Built audience testing plans for early-stage D2C launches.",
      "Managed reporting and creative briefs for student teams.",
    ],
    bio:
      "Kabir helps small teams move from scattered promotion to structured acquisition with measurable reporting.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "freelancer-isha",
    name: "Isha Gupta",
    title: "Video editor for reels, launch films, and explainers",
    category: "Video",
    pricingType: "project",
    price: 9500,
    rating: 4.9,
    responseTime: "Replies within 3 hours",
    availability: "Available this week",
    skills: ["Premiere Pro", "Motion Graphics", "Short-form Video", "Storyboarding"],
    portfolioHighlights: [
      "Edited launch reels with over 500k organic views.",
      "Produced recruitment films for student societies.",
      "Created clean product explainers for app launches.",
    ],
    bio:
      "Isha blends clean editing, pacing, and motion detail to make startup launches and student brands look more polished.",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "freelancer-vivek",
    name: "Vivek Rao",
    title: "Research analyst for reports and market scans",
    category: "Research",
    pricingType: "fixed",
    price: 5200,
    rating: 4.6,
    responseTime: "Replies within 8 hours",
    availability: "Available this month",
    skills: ["Market Research", "Competitor Analysis", "Deck Support", "Data Summaries"],
    portfolioHighlights: [
      "Built competitor scans for campus commerce apps.",
      "Prepared industry briefs for student consulting cells.",
      "Supported investor-style decks with structured market sizing.",
    ],
    bio:
      "Vivek helps teams quickly understand markets, competitors, and product positioning without bloated research decks.",
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80",
  },
];

export function formatIndianPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductById(id) {
  return products.find((product) => product.id === id) || null;
}

export function getFreelancerById(id) {
  return freelancers.find((freelancer) => freelancer.id === id) || null;
}

