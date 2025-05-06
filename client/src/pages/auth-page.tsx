import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { Loader2, Eye, EyeOff, RefreshCcw } from "lucide-react";

// Extended schema for registration with password confirmation
const extendedRegisterSchema = registerSchema
  .extend({
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
    captchaCode: z.string().min(1, "Please enter the verification code"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ExtendedRegisterData = z.infer<typeof extendedRegisterSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    length: false,
  });
  const [captchaText, setCaptchaText] = useState("");

  // Generate random captcha
  const generateCaptcha = useCallback(() => {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    setCaptchaText(result);
    return result;
  }, []);

  // Initialize captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Redirect to homepage if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    const criteria = {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      length: password.length >= 8,
    };

    setPasswordCriteria(criteria);

    // Count how many criteria are met
    const criteriaCount = Object.values(criteria).filter(Boolean).length;

    // Return percentage (0-100) based on criteria met
    return (criteriaCount / 5) * 100;
  };

  // Get strength label
  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return "";
    if (strength <= 20) return "Very Weak";
    if (strength <= 40) return "Weak";
    if (strength <= 60) return "Medium";
    if (strength <= 80) return "Strong";
    return "Very Strong";
  };

  // Get strength color
  const getStrengthColor = (strength: number): string => {
    if (strength === 0) return "bg-gray-200 dark:bg-gray-700";
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-lime-500";
    return "bg-green-500";
  };

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Register form
  const registerForm = useForm<ExtendedRegisterData>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
      captchaCode: "",
    },
  });

  // Watch password field to update strength meter
  const password = registerForm.watch("password");

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  const onRegisterSubmit = (values: ExtendedRegisterData) => {
    // Verify captcha
    if (values.captchaCode !== captchaText) {
      registerForm.setError("captchaCode", {
        type: "manual",
        message: "Verification code doesn't match",
      });
      return;
    }

    // Remove extra fields not in the API schema
    const { confirmPassword, agreeToTerms, captchaCode, ...apiData } = values;
    registerMutation.mutate(apiData);
  };

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In or Register | DesignKorv</title>
        <meta
          name="description"
          content="Sign in to your DesignKorv account or create a new one to access premium digital fashion assets."
        />
      </Helmet>

      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Auth Forms Section */}
        <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to DesignKorv
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Sign in to your account or create a new one
              </p>
            </div>

            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "login" | "register")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between text-sm mt-2">
                      <div className="flex items-center">
                        <Checkbox id="remember" className="mr-2" />
                        <label
                          htmlFor="remember"
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("register")}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            We only allow registration from trusted email
                            domains.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>

                          {/* Password strength meter */}
                          <div className="mt-2">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs">
                                Password strength:
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  passwordStrength <= 40
                                    ? "text-red-500"
                                    : passwordStrength <= 60
                                      ? "text-yellow-500"
                                      : "text-green-500"
                                }`}
                              >
                                {getStrengthLabel(passwordStrength)}
                              </span>
                            </div>
                            <Progress
                              value={passwordStrength}
                              className={`h-1.5 ${getStrengthColor(passwordStrength)}`}
                            />
                          </div>

                          {/* Password criteria */}
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            <div
                              className={`text-xs ${passwordCriteria.uppercase ? "text-green-500" : "text-gray-500"}`}
                            >
                              <span className="inline-block w-3 h-3 mr-1 rounded-full bg-current"></span>
                              Uppercase letter
                            </div>
                            <div
                              className={`text-xs ${passwordCriteria.lowercase ? "text-green-500" : "text-gray-500"}`}
                            >
                              <span className="inline-block w-3 h-3 mr-1 rounded-full bg-current"></span>
                              Lowercase letter
                            </div>
                            <div
                              className={`text-xs ${passwordCriteria.number ? "text-green-500" : "text-gray-500"}`}
                            >
                              <span className="inline-block w-3 h-3 mr-1 rounded-full bg-current"></span>
                              Number
                            </div>
                            <div
                              className={`text-xs ${passwordCriteria.special ? "text-green-500" : "text-gray-500"}`}
                            >
                              <span className="inline-block w-3 h-3 mr-1 rounded-full bg-current"></span>
                              Special character
                            </div>
                            <div
                              className={`text-xs ${passwordCriteria.length ? "text-green-500" : "text-gray-500"}`}
                            >
                              <span className="inline-block w-3 h-3 mr-1 rounded-full bg-current"></span>
                              At least 8 characters
                            </div>
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              I agree to the{" "}
                              <a
                                href="#"
                                className="text-primary underline hover:text-primary/80"
                              >
                                Terms & Conditions
                              </a>{" "}
                              and{" "}
                              <a
                                href="#"
                                className="text-primary underline hover:text-primary/80"
                              >
                                Privacy Policy
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* CAPTCHA Security */}
                    <FormField
                      control={registerForm.control}
                      name="captchaCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Verification</FormLabel>
                          <div className="space-y-2">
                            <div className="flex">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-l-md p-2 font-mono text-center font-medium flex items-center justify-center">
                                {captchaText}
                              </div>
                              <button
                                type="button"
                                onClick={() => generateCaptcha()}
                                className="bg-gray-300 dark:bg-gray-700 rounded-r-md p-2 flex items-center"
                              >
                                <RefreshCcw size={18} />
                              </button>
                            </div>
                            <FormControl>
                              <Input placeholder="Enter code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={
                        registerMutation.isPending || passwordStrength < 60
                      }
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hero Section */}
        <div className="hidden md:block relative bg-blue-900">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-700 opacity-90 dark:opacity-80"></div>
          <div
            className="absolute inset-0 w-full h-full object-cover  mix-blend-overlay bg-[url('/images/bg-auth.png')]"
            style={{
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-10 dark:bg-opacity-70"></div>
          <div className="relative flex flex-col justify-center h-full p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Premium Digital Fashion Assets
            </h2>
            <p className="text-lg mb-6">
              Unlock exclusive access to high-quality fashion design files that
              will elevate your projects.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Access to premium design patterns
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Technical drawings for manufacturers
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                High-quality 3D models
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Exclusive textures and fabric patterns
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
