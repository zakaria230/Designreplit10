import { Link } from "wouter";
import { Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Footer() {
  const { settings } = useSiteSettings();
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 pt-12 pb-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {settings?.siteName || "DesignKorv"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {settings?.siteDescription ||
                "Premium digital fashion assets for professional designers."}
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Shop
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/shop"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p
            className="text-gray-500 dark:text-gray-400 text-sm"
            dangerouslySetInnerHTML={{
              __html:
                settings?.footerText ||
                `&copy; ${new Date().getFullYear()} DesignKorv. All rights reserved.`,
            }}
          ></p>
          <div className="flex items-center mt-4 md:mt-0 space-x-4">
            <svg className="h-8 w-auto" viewBox="0 0 36 24" aria-label="Visa">
              <rect width="36" height="24" fill="#F3F4F6" rx="4" />
              <path
                fill="#006cb4"
                d="M790.67,4.15l-1.81-.62c-27.16,3.76-70.33-11.47-85.13,19.11l-102.87,245.81h71.9l15.02-39.49,86.36-.13,8.29,39.62h63.37L790.67,4.15ZM706.88,174.67l36.55-98.04,19.5,98.04h-56.05Z"
              />
              <path
                fill="#006cb4"
                d="M616.09,10.26l-9.76,57.24c-10.57-5.37-22.24-8.96-33.99-10.78-15.39-2.39-51.46-4.14-60.33,11.82-8.52,15.33,7.64,25.16,18.97,31.96,30.73,18.45,71.6,33.43,74.74,75.72,7.09,95.6-130.06,114.17-195.32,81.92l9.49-59.09c.74-.78,4.58,2.53,5.68,3.15,23.33,13.03,83.48,24.54,103.36,2.62,14.6-16.1-3.12-31.11-16.25-39.14-38.57-23.6-80.87-34.87-73.22-91.67,10.26-76.24,118.87-85.52,176.61-63.72Z"
              />
              <path
                fill="#006cb4"
                d="M166.42,143.01c4.31,12.21,4.87,28.02,8.35,40.69.17.63-.11,1.51.78,1.32L240.75,3.56h73.73l-109.97,264.89-70.91-.09L73.8,38.88c.59,0,1.18,0,1.75.11,4.89.86,21.69,14.29,26.68,18.31,18.8,15.16,36.08,33.07,49.27,53.36,6.52,10.03,12.41,20.55,14.91,32.35Z"
              />
            </svg>
            <svg
              className="h-8 w-auto"
              viewBox="0 0 36 24"
              aria-label="Mastercard"
            >
              <rect width="36" height="24" fill="#F3F4F6" rx="4" />
              <path fill="#FF5F00" d="M21.17 7.913h-6.34v8.174h6.34V7.913z" />
              <path
                d="M15.237 12c-.008-3.178 1.419-5.99 3.663-7.913a8.546 8.546 0 00-5.3-1.827C8.694 2.26 5 5.945 5 10.494c0 4.55 3.693 8.235 8.599 8.235 1.914 0 3.705-.68 5.3-1.827-2.236-1.915-3.663-4.73-3.663-7.912v3.01z"
                fill="#EB001B"
              />
              <path
                d="M31 12c0 4.55-3.693 8.235-8.6 8.235a8.473 8.473 0 01-5.3-1.827c2.244-1.923 3.671-4.735 3.671-7.913s-1.427-5.99-3.67-7.913a8.473 8.473 0 015.299-1.827C27.307 2.26 31 5.944 31 10.494V12z"
                fill="#F79E1B"
              />
            </svg>
            <svg className="h-8 w-auto" viewBox="0 0 36 24" aria-label="PayPal">
              <rect width="36" height="24" fill="#F3F4F6" rx="4" />
              <path
                d="M25.491 9.934c0 1.777-1.385 3.29-3.789 3.29h-2.168c-.2 0-.38.163-.423.391l-.41 2.935a.34.34 0 01-.334.301h-1.797a.289.289 0 01-.256-.36l1.334-9.534a.456.456 0 01.45-.392h3.604c2.403 0 3.789 1.511 3.789 3.369zm-3.687-1.418h-1.65c-.157 0-.268.13-.291.314l-.536 3.778c.011.097.089.173.183.173h1.452c1.212 0 2.004-.522 2.004-1.706.003-1.022-.672-1.559-1.163-1.559z"
                fill="#253B80"
              />
              <path
                d="M11.475 9.934c0 1.777 1.385 3.29 3.788 3.29h2.169c.2 0 .38.163.423.391l.41 2.935a.34.34 0 0 0 .333.301h1.797a.289.289 0 0 0 .257-.36l-1.334-9.534a.456.456 0 0 0-.45-.392h-3.605c-2.403 0-3.788 1.511-3.788 3.369zm3.686-1.418h1.651c.156 0 .267.13.29.314l.536 3.778a.199.199 0 0 1-.182.173h-1.452c-1.213 0-2.005-.522-2.005-1.706-.001-1.022.673-1.559 1.163-1.559z"
                fill="#179BD7"
              />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
