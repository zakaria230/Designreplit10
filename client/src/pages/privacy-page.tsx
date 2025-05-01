import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | DesignKorv</title>
        <meta name="description" content="Learn about DesignKorv's privacy practices and how we protect your personal information." />
      </Helmet>

      {/* Header Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Last updated: May 1, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 prose dark:prose-invert prose-lg max-w-none">
            <h2>1. Introduction</h2>
            <p>
              At DesignKorv ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our services, you acknowledge that you have read and understand this Privacy Policy.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul>
              <li>Register for an account</li>
              <li>Make a purchase</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact our support team</li>
              <li>Participate in surveys or promotions</li>
            </ul>
            <p>
              This information may include:
            </p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Billing address</li>
              <li>Payment information</li>
              <li>Phone number</li>
              <li>Professional information</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>
              When you visit our website or use our services, we may automatically collect certain information, including:
            </p>
            <ul>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device information</li>
              <li>Operating system</li>
              <li>Usage data (pages visited, time spent on site, etc.)</li>
              <li>Referral source</li>
            </ul>
            <p>
              We collect this information using cookies, web beacons, and similar tracking technologies. For more information about our use of cookies, please see our Cookie Policy.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>
              We may use the information we collect for various purposes, including to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative information, such as updates to our terms and policies</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Send marketing communications, if you have opted in to receive them</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect against, identify, and prevent fraud and other illegal activity</li>
              <li>Comply with our legal obligations</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul>
              <li>With service providers who perform services on our behalf</li>
              <li>With business partners with whom we jointly offer products or services</li>
              <li>With law enforcement or other authorities if required by law</li>
              <li>In connection with a business transaction such as a merger, acquisition, or sale of assets</li>
              <li>With your consent or at your direction</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.
            </p>

            <h2>6. Data Retention</h2>
            <p>
              We will retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>

            <h2>7. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, such as:
            </p>
            <ul>
              <li>The right to access personal information we hold about you</li>
              <li>The right to request correction of inaccurate information</li>
              <li>The right to request deletion of your information</li>
              <li>The right to object to processing of your information</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our services are not directed to children under the age of 16, and we do not knowingly collect personal information from children under 16. If we learn that we have collected personal information from a child under 16, we will take steps to delete such information as soon as possible.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country.
            </p>
            <p>
              We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.
            </p>

            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting the updated Privacy Policy on our website and updating the "Last updated" date at the top of this page.
            </p>
            <p>
              We encourage you to review this Privacy Policy periodically to stay informed about our data practices.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
              Email: privacy@designkorv.com<br />
              Address: Sveavägen 123, 113 50 Stockholm, Sweden
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Have questions about our Privacy Policy?
            </p>
            <Button asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}