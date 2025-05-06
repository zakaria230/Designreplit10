import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Sample blog posts
const blogPosts = [
  {
    id: 1,
    title: "Trends in Digital Fashion Design for 2025",
    excerpt:
      "Explore the latest trends shaping the digital fashion design landscape in 2025, from AI-assisted pattern making to sustainable material simulation.",
    coverImage:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80",
    category: "Trends",
    author: "Emma Johnson",
    date: "May 1, 2025",
    slug: "trends-in-digital-fashion-design-2025",
  },
  {
    id: 2,
    title: "From Sketch to 3D Model: The Evolution of Fashion Tech",
    excerpt:
      "Discover how technology is transforming the fashion design process, making it more efficient, sustainable, and creative than ever before.",
    coverImage:
      "https://images.unsplash.com/photo-1537832816519-689ad163238b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2680&q=80",
    category: "Technology",
    author: "Alex Zhang",
    date: "April 15, 2025",
    slug: "sketch-to-3d-model-evolution",
  },
  {
    id: 3,
    title: "The Rise of Virtual Fashion Shows and Digital Runways",
    excerpt:
      "How virtual fashion shows are revolutionizing the industry, making fashion more accessible while reducing environmental impact.",
    coverImage:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2680&q=80",
    category: "Industry",
    author: "Sophia Lee",
    date: "April 3, 2025",
    slug: "rise-of-virtual-fashion-shows",
  },
  {
    id: 4,
    title: "Sustainable Design Practices in the Digital Age",
    excerpt:
      "Learn how digital design tools are enabling more sustainable fashion practices and reducing waste in the production process.",
    coverImage:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
    category: "Sustainability",
    author: "Marcus Green",
    date: "March 20, 2025",
    slug: "sustainable-design-practices",
  },
];

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>Blog | DesignKorv</title>
        <meta
          name="description"
          content="Insights, trends, and articles about digital fashion design from the DesignKorv team."
        />
      </Helmet>

      {/* Header Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              DesignKorv Blog
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Insights, trends, and inspiration for the digital fashion design
              community
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="rounded-xl overflow-hidden">
              <img
                src={blogPosts[0].coverImage}
                alt={blogPosts[0].title}
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
            <div className="lg:pl-8">
              <Badge variant="secondary" className="mb-3">
                {blogPosts[0].category}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {blogPosts[0].title}
              </h2>
              <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                <User className="h-4 w-4 mr-1" />
                <span className="mr-4">{blogPosts[0].author}</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>{blogPosts[0].date}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {blogPosts[0].excerpt}
              </p>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/10 dark:border-blue dark:text-white dark:hover:bg-white/10"
                asChild
              >
                <Link href={`/blog/${blogPosts[0].slug}`}>
                  Read Article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* More Posts */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Latest Articles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow"
              >
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <Badge variant="secondary" className="mb-3">
                    {post.category}
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {post.title}
                  </h3>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                    <User className="h-3 w-3 mr-1" />
                    <span className="mr-3">{post.author}</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{post.date}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Button
                    variant="ghost"
                    className="text-primary-600 dark:text-primary-400 p-0 h-auto"
                    asChild
                  >
                    <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-600 dark:bg-primary-700 rounded-2xl overflow-hidden shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Stay Updated
                </h2>
                <p className="max-w-2xl mx-auto text-gray-500 dark:text-gray-400 text-lg">
                  Subscribe to our newsletter for the latest articles, industry
                  insights, and design resources.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-4 py-2 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                />
                <Button className="bg-white text-primary-600 hover:bg-gray-50">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
