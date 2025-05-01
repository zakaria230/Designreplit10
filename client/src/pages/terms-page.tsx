import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | DesignKorv</title>
        <meta name="description" content="Read DesignKorv's terms of service to understand your rights and responsibilities when using our platform." />
      </Helmet>

      {/* Header Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Last updated: May 1, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 prose dark:prose-invert prose-lg max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to DesignKorv ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website, services, and products (collectively, the "Services").
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
            </p>

            <h2>2. Account Registration</h2>
            <p>
              To access certain features of the Services, you may need to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself and to keep this information updated.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access to or use of your account.
            </p>

            <h2>3. Purchases and Payments</h2>
            <p>
              All purchases made through our Services are subject to these Terms and any additional terms presented at the time of purchase.
            </p>
            <p>
              Prices for our products are subject to change without notice. We reserve the right to modify or discontinue any product or service without notice at any time.
            </p>
            <p>
              Payment must be made at the time of purchase. We accept various payment methods as indicated on our checkout page. All payments are processed securely through our payment processors.
            </p>

            <h2>4. Digital Content and Licensing</h2>
            <p>
              When you purchase digital content from DesignKorv, you are granted a non-exclusive, non-transferable license to use the content in accordance with the specific license terms associated with your purchase.
            </p>
            <p>
              Unless otherwise specified, our standard license allows you to use the purchased digital assets in personal and commercial design projects. However, you may not redistribute, resell, or sublicense the assets themselves as standalone files.
            </p>
            <p>
              For full details on licensing terms, please refer to the specific license agreement provided with each product.
            </p>

            <h2>5. User Content</h2>
            <p>
              You retain ownership of any content you submit, post, or display on or through our Services ("User Content"). By providing User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, distribute, and display such content in connection with our Services.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to your User Content and that it does not violate the rights of any third party.
            </p>

            <h2>6. Prohibited Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Use our Services for any illegal or unauthorized purpose</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Engage in any activity that could harm or negatively affect our Services</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              Our Services and all content and materials included on or in the Services, such as text, graphics, logos, button icons, images, audio clips, digital downloads, and data compilations, are the property of DesignKorv or its content suppliers and are protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account and access to our Services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>

            <h2>9. Disclaimers and Limitations of Liability</h2>
            <p>
              OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>

            <h2>10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Sweden, without regard to its conflict of law provisions.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make changes, we will provide notice by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of our Services after such changes constitutes your acceptance of the new Terms.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              Email: legal@designkorv.com<br />
              Address: Sveavägen 123, 113 50 Stockholm, Sweden
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Have questions about our Terms of Service?
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