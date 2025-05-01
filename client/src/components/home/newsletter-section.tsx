import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      // In a real implementation, this would be an API call to subscribe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Subscription successful",
        description: "Thank you for subscribing to our newsletter!",
      });
      
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-700 dark:from-primary-900 dark:to-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Stay Updated</h2>
            <p className="text-white/90 mb-2">
              Join our newsletter to get exclusive access to new design assets, special offers, and industry insights.
            </p>
            <p className="text-white/70 text-sm">
              We'll never share your email. Unsubscribe anytime.
            </p>
          </div>
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex">
              <Input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-r-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <Button 
                type="submit" 
                className="bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
