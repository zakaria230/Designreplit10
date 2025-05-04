import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Home, 
  Loader2, 
  Mail,
  ArrowRight
} from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  
  // Extract token from URL
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");
  
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token found in the URL. The link may be invalid or expired.");
        return;
      }
      
      try {
        const response = await apiRequest("POST", `/api/verify-email?token=${token}`, {});
        const data = await response.json();
        
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been successfully verified!");
          toast({
            title: "Email Verified",
            description: "Your email has been successfully verified.",
          });
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify your email. The token may be invalid or expired.");
          toast({
            title: "Verification Failed",
            description: data.message || "Failed to verify your email.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification. Please try again later.");
        toast({
          title: "Verification Error",
          description: "An error occurred during verification. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    verifyEmail();
  }, [token, toast]);
  
  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Email Verification</h1>
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please wait while we verify your email address...
              </p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="flex flex-col space-y-3">
                <Button onClick={() => setLocation("/profile")}>
                  Go to Your Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Return to Homepage
                </Button>
              </div>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="flex flex-col space-y-3">
                <Button onClick={() => setLocation("/profile")} variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Return to Homepage
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}