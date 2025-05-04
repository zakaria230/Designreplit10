import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailPage() {
  const [match, params] = useRoute("/verify-email");
  const [location, setLocation] = useLocation();
  const [verificationState, setVerificationState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("جاري التحقق من بريدك الإلكتروني...");

  useEffect(() => {
    // Get the token from URL query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    if (!token) {
      setVerificationState("error");
      setMessage("رابط غير صالح: لم يتم العثور على رمز التحقق");
      return;
    }

    // Verify the email using the token
    const verifyEmail = async () => {
      try {
        const response = await apiRequest("POST", "/api/verify-email", { token });
        const data = await response.json();

        if (response.ok && data.success) {
          setVerificationState("success");
          setMessage(data.message || "تم التحقق من بريدك الإلكتروني بنجاح!");
        } else {
          setVerificationState("error");
          setMessage(data.message || "فشل التحقق من البريد الإلكتروني");
        }
      } catch (error) {
        setVerificationState("error");
        setMessage("حدث خطأ أثناء التحقق من بريدك الإلكتروني");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="container max-w-md py-16">
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">تأكيد البريد الإلكتروني</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {verificationState === "loading" && (
            <div className="my-8 flex flex-col items-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p>{message}</p>
            </div>
          )}

          {verificationState === "success" && (
            <div className="my-8 flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <p className="font-medium text-lg mb-2">تم التحقق بنجاح!</p>
              <p className="text-gray-500">{message}</p>
            </div>
          )}

          {verificationState === "error" && (
            <div className="my-8 flex flex-col items-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <p className="font-medium text-lg mb-2">فشل التحقق</p>
              <p className="text-gray-500">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation("/")} 
            className="w-full"
          >
            العودة إلى الصفحة الرئيسية
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}