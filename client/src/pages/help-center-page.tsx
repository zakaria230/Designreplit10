import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { 
  Search,
  ShoppingBag, 
  CreditCard, 
  Download, 
  FileText, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Help center categories with articles
const helpCategories = [
  {
    id: 1,
    title: "Ordering & Payment",
    icon: <ShoppingBag className="h-6 w-6" />,
    articles: [
      { id: 101, title: "How to place an order", slug: "how-to-place-order" },
      { id: 102, title: "Accepted payment methods", slug: "payment-methods" },
      { id: 103, title: "Order cancellation policy", slug: "cancellation-policy" },
      { id: 104, title: "Pricing information", slug: "pricing-info" },
    ]
  },
  {
    id: 2,
    title: "Downloads & Access",
    icon: <Download className="h-6 w-6" />,
    articles: [
      { id: 201, title: "Accessing your digital files", slug: "accessing-files" },
      { id: 202, title: "Download troubleshooting", slug: "download-troubleshooting" },
      { id: 203, title: "File formats explained", slug: "file-formats" },
      { id: 204, title: "Download limits", slug: "download-limits" },
    ]
  },
  {
    id: 3,
    title: "Billing",
    icon: <CreditCard className="h-6 w-6" />,
    articles: [
      { id: 301, title: "Viewing your invoice", slug: "viewing-invoice" },
      { id: 302, title: "Updating payment details", slug: "update-payment" },
      { id: 303, title: "Subscription management", slug: "subscription-management" },
      { id: 304, title: "Tax information", slug: "tax-info" },
    ]
  },
  {
    id: 4,
    title: "Licensing & Usage",
    icon: <FileText className="h-6 w-6" />,
    articles: [
      { id: 401, title: "License terms explained", slug: "license-terms" },
      { id: 402, title: "Commercial usage rights", slug: "commercial-usage" },
      { id: 403, title: "Attribution requirements", slug: "attribution" },
      { id: 404, title: "Distribution restrictions", slug: "distribution-restrictions" },
    ]
  },
  {
    id: 5,
    title: "Troubleshooting",
    icon: <AlertCircle className="h-6 w-6" />,
    articles: [
      { id: 501, title: "Common technical issues", slug: "technical-issues" },
      { id: 502, title: "Account access problems", slug: "account-access" },
      { id: 503, title: "File compatibility issues", slug: "file-compatibility" },
      { id: 504, title: "Website navigation help", slug: "navigation-help" },
    ]
  }
];

// Popular articles
const popularArticles = [
  { id: 201, title: "Accessing your digital files", slug: "accessing-files", category: "Downloads & Access" },
  { id: 102, title: "Accepted payment methods", slug: "payment-methods", category: "Ordering & Payment" },
  { id: 401, title: "License terms explained", slug: "license-terms", category: "Licensing & Usage" },
  { id: 301, title: "Viewing your invoice", slug: "viewing-invoice", category: "Billing" },
  { id: 501, title: "Common technical issues", slug: "technical-issues", category: "Troubleshooting" },
];

export default function HelpCenterPage() {
  return (
    <>
      <Helmet>
        <title>Help Center | DesignKorv</title>
        <meta name="description" content="Find answers to common questions and get help with your DesignKorv purchases." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How Can We Help?
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Find answers to common questions and learn how to get the most out of DesignKorv.
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                type="text" 
                placeholder="Search help articles..." 
                className="pl-10 py-6 text-lg rounded-lg" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Browse Help Topics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpCategories.map(category => (
              <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                    {category.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {category.title}
                    </h3>
                    <ul className="space-y-2">
                      {category.articles.map(article => (
                        <li key={article.id}>
                          <Link 
                            href={`/help/${article.slug}`}
                            className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 flex items-center"
                          >
                            <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{article.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Button variant="link" className="p-0 h-auto text-primary-600 dark:text-primary-400" asChild>
                        <Link href={`/help/category/${category.id}`}>
                          View all articles
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Popular Articles
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {popularArticles.map(article => (
                  <li key={article.id}>
                    <Link 
                      href={`/help/${article.slug}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {article.category}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Still Need Help?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  If you couldn't find the answer you're looking for, our support team is here to help. Get in touch with us.
                </p>
                
                <div className="flex space-x-4">
                  <Button asChild>
                    <Link href="/contact">
                      Contact Support
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/faq">
                      View FAQs
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Email Support</h3>
                    <p className="text-gray-600 dark:text-gray-300">support@designkorv.com</p>
                  </div>
                </div>
                
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Phone Support</h3>
                    <p className="text-gray-600 dark:text-gray-300">+46 123 456 789</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Live Chat</h3>
                    <p className="text-gray-600 dark:text-gray-300">Available 9AM-5PM CET, Mon-Fri</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Need to import these icons
import { Mail, Phone, MessageSquare } from "lucide-react";