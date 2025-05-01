import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Search, Mail, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQ categories with questions and answers
const faqCategories = [
  {
    id: 1,
    title: "Account & Registration",
    faqs: [
      {
        id: 101,
        question: "How do I create an account?",
        answer: "To create an account, click on the 'Sign In' button in the top-right corner of the page, then click 'Register'. Fill in your details and follow the prompts to complete registration."
      },
      {
        id: 102,
        question: "Can I use DesignKorv without creating an account?",
        answer: "You can browse our collection without an account, but you'll need to register to purchase and download digital assets."
      },
      {
        id: 103,
        question: "I forgot my password. How do I reset it?",
        answer: "Click on 'Sign In', then 'Forgot Password'. Enter your email address and follow the instructions sent to your inbox to reset your password."
      },
      {
        id: 104,
        question: "How do I change my account details?",
        answer: "Once logged in, navigate to your account settings by clicking on your profile icon in the top-right corner. From there, you can update your personal information, email, and password."
      }
    ]
  },
  {
    id: 2,
    title: "Purchases & Downloads",
    faqs: [
      {
        id: 201,
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for larger purchases."
      },
      {
        id: 202,
        question: "How do I download my purchased files?",
        answer: "After purchase, you can download your files from your account dashboard under 'My Purchases'. Each item will have a download button next to it."
      },
      {
        id: 203,
        question: "Is there a limit to how many times I can download my purchases?",
        answer: "You can download your purchased files up to 5 times. If you need additional downloads, please contact our support team."
      },
      {
        id: 204,
        question: "Can I get a refund if I'm not satisfied?",
        answer: "Due to the digital nature of our products, we generally don't offer refunds. However, if there are technical issues with your files, please contact our support team within 14 days of purchase."
      }
    ]
  },
  {
    id: 3,
    title: "Licensing & Usage",
    faqs: [
      {
        id: 301,
        question: "What can I do with the digital assets I purchase?",
        answer: "Our standard license allows you to use the assets in personal and commercial design projects. However, you cannot redistribute or resell the assets as-is."
      },
      {
        id: 302,
        question: "Do I need to credit DesignKorv when using the assets?",
        answer: "Attribution is not required under our standard license, but it's always appreciated."
      },
      {
        id: 303,
        question: "Can I use the assets in multiple projects?",
        answer: "Yes, once purchased, you can use the assets in multiple projects under the same license terms."
      },
      {
        id: 304,
        question: "Do you offer extended licenses for larger projects?",
        answer: "Yes, we offer extended licenses for specific use cases like mass production or distribution. Please contact our sales team for more information."
      }
    ]
  },
  {
    id: 4,
    title: "Technical Support",
    faqs: [
      {
        id: 401,
        question: "What file formats do you provide?",
        answer: "Most of our assets are available in multiple formats, including AI, EPS, PDF, and PSD. The specific formats available are listed on each product page."
      },
      {
        id: 402,
        question: "I'm having trouble opening the files. What should I do?",
        answer: "Make sure you have the appropriate software installed (e.g., Adobe Illustrator for AI files). If you're still having issues, contact our support team with details about the error you're experiencing."
      },
      {
        id: 403,
        question: "Are your files compatible with both Mac and PC?",
        answer: "Yes, all our digital assets are compatible with both Mac and PC operating systems, provided you have the appropriate software to open them."
      },
      {
        id: 404,
        question: "How large are the download files?",
        answer: "File sizes vary depending on the asset. The approximate download size is listed on each product page. Most files range from 5MB to 50MB."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | DesignKorv</title>
        <meta name="description" content="Find answers to commonly asked questions about DesignKorv's digital fashion assets, purchasing, licensing, and more." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Find quick answers to common questions about DesignKorv
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                type="text" 
                placeholder="Search for answers..." 
                className="pl-10 py-6 text-lg rounded-lg" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories & Questions */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Categories
                </h2>
                <nav className="space-y-1">
                  {faqCategories.map(category => (
                    <a 
                      key={category.id} 
                      href={`#category-${category.id}`}
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {category.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* FAQs */}
            <div className="lg:col-span-3">
              <div className="space-y-12">
                {faqCategories.map(category => (
                  <div key={category.id} id={`category-${category.id}`}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                      {category.title}
                    </h2>
                    
                    <Accordion type="single" collapsible className="space-y-4">
                      {category.faqs.map(faq => (
                        <AccordionItem 
                          key={faq.id} 
                          value={`faq-${faq.id}`}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-left font-medium text-gray-900 dark:text-white">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              If you couldn't find the answer you were looking for, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help">
                  Help Center
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}