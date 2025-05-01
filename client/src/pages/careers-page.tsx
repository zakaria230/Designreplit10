import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { 
  Briefcase, MapPin, Clock, ChevronRight, 
  Building, Users, Heart, TrendingUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample job listings
const jobListings = [
  {
    id: 1,
    title: "Senior Fashion Designer",
    department: "Design",
    location: "Stockholm, Sweden",
    type: "Full-time",
    description: "We're looking for an experienced Fashion Designer to join our team and help create cutting-edge digital fashion assets.",
    slug: "senior-fashion-designer"
  },
  {
    id: 2,
    title: "Digital Pattern Maker",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Create precise digital patterns for our premium collection of fashion design assets.",
    slug: "digital-pattern-maker"
  },
  {
    id: 3,
    title: "3D Fashion Modeling Specialist",
    department: "Technology",
    location: "Berlin, Germany",
    type: "Full-time",
    description: "Use your 3D modeling expertise to create realistic digital fashion assets for designers worldwide.",
    slug: "3d-fashion-specialist"
  },
  {
    id: 4,
    title: "Frontend Developer",
    department: "Technology",
    location: "Remote",
    type: "Full-time",
    description: "Help build and enhance our e-commerce platform with cutting-edge web technologies.",
    slug: "frontend-developer"
  },
  {
    id: 5,
    title: "Digital Marketing Specialist",
    department: "Marketing",
    location: "Stockholm, Sweden",
    type: "Full-time",
    description: "Develop and execute digital marketing strategies to grow our user base and increase sales.",
    slug: "digital-marketing-specialist"
  },
  {
    id: 6,
    title: "Fashion Content Writer",
    department: "Marketing",
    location: "Remote",
    type: "Part-time",
    description: "Create engaging content about fashion design, trends, and digital tools for our blog and social media channels.",
    slug: "fashion-content-writer"
  }
];

// Grouped by department
const departments = [...new Set(jobListings.map(job => job.department))];

export default function CareersPage() {
  return (
    <>
      <Helmet>
        <title>Careers | DesignKorv</title>
        <meta name="description" content="Explore career opportunities at DesignKorv and join our team of fashion design innovators." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Join Our Team
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Be part of the revolution in digital fashion design at DesignKorv
            </p>
            <Button size="lg" asChild>
              <Link href="#open-positions">
                View Open Positions
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Work With Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              At DesignKorv, we're building the future of fashion design together
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Innovative Environment</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work at the cutting edge of fashion technology, exploring new possibilities in digital design.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <Users className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Collaborative Culture</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join a diverse team of designers, developers, and industry experts who inspire each other daily.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <Building className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Growth Opportunities</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Develop your skills and advance your career in a supportive environment that values continuous learning.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <Heart className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Work-Life Balance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enjoy flexible work arrangements, competitive benefits, and a culture that respects your life outside of work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Find your perfect role at DesignKorv
            </p>
          </div>
          
          <Tabs defaultValue={departments[0]}>
            <TabsList className="w-full flex justify-start mb-8 overflow-x-auto">
              {departments.map(department => (
                <TabsTrigger key={department} value={department} className="px-6">
                  {department}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {departments.map(department => (
              <TabsContent key={department} value={department}>
                <div className="grid grid-cols-1 gap-4">
                  {jobListings
                    .filter(job => job.department === department)
                    .map(job => (
                      <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-3 mb-3">
                              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                                <Briefcase className="h-4 w-4 mr-1" />
                                <span>{job.department}</span>
                              </div>
                              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{job.type}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                              {job.description}
                            </p>
                          </div>
                          <Button className="mt-4 md:mt-0 md:ml-4 whitespace-nowrap" asChild>
                            <Link href={`/careers/${job.slug}`}>
                              Apply Now <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-600 dark:bg-primary-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-12 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Don't see the right position?
              </h2>
              <p className="text-white/90 max-w-3xl mx-auto mb-8">
                We're always looking for talented individuals to join our team. Send us your resume and let us know how you can contribute to DesignKorv.
              </p>
              <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-gray-50" asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}