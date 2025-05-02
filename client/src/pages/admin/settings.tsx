import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/admin-layout";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Save, 
  CreditCard, 
  DollarSign,
  AlertCircle 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define schema for site settings
const siteSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().min(1, "Site description is required"),
  contactEmail: z.string().email("Please enter a valid email"),
  contactPhone: z.string().optional(),
  logoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  faviconUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  footerText: z.string().optional(),
  enableRegistration: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
});

// Schema for analytics
const analyticsSettingsSchema = z.object({
  googleAnalyticsId: z.string().optional().or(z.literal("")),
  enableAnalytics: z.boolean().default(true),
  collectUserData: z.boolean().default(true),
});

// Schema for email settings
const emailSettingsSchema = z.object({
  smtpHost: z.string().optional().or(z.literal("")),
  smtpPort: z.string().optional().or(z.literal("")),
  smtpUsername: z.string().optional().or(z.literal("")),
  smtpPassword: z.string().optional().or(z.literal("")),
  emailFromName: z.string().optional().or(z.literal("")),
  emailFromAddress: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  enableOrderConfirmationEmails: z.boolean().default(true),
  enableMarketingEmails: z.boolean().default(true),
});

// Schema for social media
const socialMediaSettingsSchema = z.object({
  facebookUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  pinterestUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

// Schema for payment gateway settings
const paymentSettingsSchema = z.object({
  // Stripe Settings
  stripeEnabled: z.boolean().default(true),
  stripePublicKey: z.string().optional().or(z.literal("")),
  stripeSecretKey: z.string().optional().or(z.literal("")),
  stripeWebhookSecret: z.string().optional().or(z.literal("")),
  
  // PayPal Settings
  paypalEnabled: z.boolean().default(true),
  paypalClientId: z.string().optional().or(z.literal("")),
  paypalClientSecret: z.string().optional().or(z.literal("")),
  paypalSandboxMode: z.boolean().default(true),
  
  // Payoneer Settings
  payoneerEnabled: z.boolean().default(false),
  payoneerApiKey: z.string().optional().or(z.literal("")),
  payoneerUsername: z.string().optional().or(z.literal("")),
  payoneerPassword: z.string().optional().or(z.literal("")),
  payoneerSandboxMode: z.boolean().default(true),
  
  // General Payment Settings
  currencyCode: z.string().default("USD"),
  taxRate: z.string().default("0"),
  enableTaxCalculation: z.boolean().default(true),
  requireBillingAddress: z.boolean().default(true),
  requireShippingAddress: z.boolean().default(false),
});

type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;
type AnalyticsSettingsValues = z.infer<typeof analyticsSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type SocialMediaSettingsValues = z.infer<typeof socialMediaSettingsSchema>;
type PaymentSettingsValues = z.infer<typeof paymentSettingsSchema>;

// Mock of settings for now - will be replaced with actual API data
const defaultSiteSettings: SiteSettingsValues = {
  siteName: "DesignKorv",
  siteDescription: "Premium digital fashion design files for designers and fashion enthusiasts",
  contactEmail: "contact@designkorv.com",
  contactPhone: "+1 (555) 123-4567",
  logoUrl: "https://example.com/logo.png",
  faviconUrl: "https://example.com/favicon.ico",
  footerText: "© 2025 DesignKorv. All rights reserved.",
  enableRegistration: true,
  maintenanceMode: false,
};

const defaultAnalyticsSettings: AnalyticsSettingsValues = {
  googleAnalyticsId: "UA-XXXXXXXXX-X",
  enableAnalytics: true,
  collectUserData: true,
};

const defaultEmailSettings: EmailSettingsValues = {
  smtpHost: "smtp.example.com",
  smtpPort: "587",
  smtpUsername: "mail@example.com",
  smtpPassword: "",
  emailFromName: "DesignKorv Store",
  emailFromAddress: "noreply@designkorv.com",
  enableOrderConfirmationEmails: true,
  enableMarketingEmails: true,
};

const defaultSocialMediaSettings: SocialMediaSettingsValues = {
  facebookUrl: "https://facebook.com/designkorv",
  instagramUrl: "https://instagram.com/designkorv",
  twitterUrl: "https://twitter.com/designkorv",
  youtubeUrl: "https://youtube.com/designkorv",
  pinterestUrl: "https://pinterest.com/designkorv",
};

const defaultPaymentSettings: PaymentSettingsValues = {
  // Stripe Settings
  stripeEnabled: true,
  stripePublicKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  
  // PayPal Settings
  paypalEnabled: true,
  paypalClientId: "",
  paypalClientSecret: "",
  paypalSandboxMode: true,
  
  // Payoneer Settings
  payoneerEnabled: false,
  payoneerApiKey: "",
  payoneerUsername: "",
  payoneerPassword: "",
  payoneerSandboxMode: true,
  
  // General Payment Settings
  currencyCode: "USD",
  taxRate: "0",
  enableTaxCalculation: true,
  requireBillingAddress: true,
  requireShippingAddress: false,
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all settings
  const { data: allSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    // No longer need to manually handle this as TanStack Query v5 shows errors in the UI
  });

  // Site settings form
  const siteSettingsForm = useForm<SiteSettingsValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: defaultSiteSettings,
  });

  // Analytics settings form
  const analyticsSettingsForm = useForm<AnalyticsSettingsValues>({
    resolver: zodResolver(analyticsSettingsSchema),
    defaultValues: defaultAnalyticsSettings,
  });

  // Email settings form
  const emailSettingsForm = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: defaultEmailSettings,
  });

  // Social media settings form
  const socialMediaSettingsForm = useForm<SocialMediaSettingsValues>({
    resolver: zodResolver(socialMediaSettingsSchema),
    defaultValues: defaultSocialMediaSettings,
  });
  
  // Payment settings form
  const paymentSettingsForm = useForm<PaymentSettingsValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: defaultPaymentSettings,
  });
  
  // Load settings into forms when data is fetched
  useEffect(() => {
    if (allSettings && !isLoadingSettings) {
      // Type assertion to help TypeScript understand the structure
      const settingsData = allSettings && typeof allSettings === 'object' && 'data' in allSettings
        ? allSettings.data as Record<string, any>
        : {};
      
      // Process site settings
      if (settingsData.site) {
        const siteFormValues: SiteSettingsValues = { ...defaultSiteSettings };
        Object.entries(settingsData.site).forEach(([key, value]) => {
          const cleanKey = key.replace('site_', '');
          // @ts-ignore - dynamic key assignment
          siteFormValues[cleanKey] = value;
        });
        siteSettingsForm.reset(siteFormValues);
      }
      
      // Process analytics settings
      if (settingsData.analytics) {
        const analyticsFormValues: AnalyticsSettingsValues = { ...defaultAnalyticsSettings };
        Object.entries(settingsData.analytics).forEach(([key, value]) => {
          const cleanKey = key.replace('analytics_', '');
          // Convert string 'true'/'false' to boolean for boolean fields
          if (typeof value === 'string' && (value === 'true' || value === 'false')) {
            // @ts-ignore - dynamic key assignment
            analyticsFormValues[cleanKey] = value === 'true';
          } else {
            // @ts-ignore - dynamic key assignment
            analyticsFormValues[cleanKey] = value;
          }
        });
        analyticsSettingsForm.reset(analyticsFormValues);
      }
      
      // Process email settings
      if (settingsData.email) {
        const emailFormValues: EmailSettingsValues = { ...defaultEmailSettings };
        Object.entries(settingsData.email).forEach(([key, value]) => {
          const cleanKey = key.replace('email_', '');
          // Convert string 'true'/'false' to boolean for boolean fields
          if (typeof value === 'string' && (value === 'true' || value === 'false')) {
            // @ts-ignore - dynamic key assignment
            emailFormValues[cleanKey] = value === 'true';
          } else {
            // @ts-ignore - dynamic key assignment
            emailFormValues[cleanKey] = value;
          }
        });
        emailSettingsForm.reset(emailFormValues);
      }
      
      // Process social media settings
      if (settingsData.social) {
        const socialFormValues: SocialMediaSettingsValues = { ...defaultSocialMediaSettings };
        Object.entries(settingsData.social).forEach(([key, value]) => {
          const cleanKey = key.replace('social_', '');
          // @ts-ignore - dynamic key assignment
          socialFormValues[cleanKey] = value;
        });
        socialMediaSettingsForm.reset(socialFormValues);
      }
      
      // Process payment settings
      if (settingsData.payment) {
        const paymentFormValues: PaymentSettingsValues = { ...defaultPaymentSettings };
        Object.entries(settingsData.payment).forEach(([key, value]) => {
          const cleanKey = key.replace('payment_', '');
          // Convert string 'true'/'false' to boolean for boolean fields
          if (typeof value === 'string' && (value === 'true' || value === 'false')) {
            // @ts-ignore - dynamic key assignment
            paymentFormValues[cleanKey] = value === 'true';
          } else {
            // @ts-ignore - dynamic key assignment
            paymentFormValues[cleanKey] = value;
          }
        });
        paymentSettingsForm.reset(paymentFormValues);
      }
      
      setIsLoading(false);
    }
  }, [allSettings, isLoadingSettings]);

  // Site settings mutation
  const siteSettingsMutation = useMutation({
    mutationFn: async (data: SiteSettingsValues) => {
      const response = await apiRequest("POST", "/api/admin/settings/site", data);
      if (!response.ok) {
        throw new Error("Failed to save site settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate settings cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "Site settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update site settings",
        variant: "destructive",
      });
    },
  });

  // Analytics settings mutation
  const analyticsSettingsMutation = useMutation({
    mutationFn: async (data: AnalyticsSettingsValues) => {
      const response = await apiRequest("POST", "/api/admin/settings/analytics", data);
      if (!response.ok) {
        throw new Error("Failed to save analytics settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate settings cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "Analytics settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update analytics settings",
        variant: "destructive",
      });
    },
  });

  // Email settings mutation
  const emailSettingsMutation = useMutation({
    mutationFn: async (data: EmailSettingsValues) => {
      const response = await apiRequest("POST", "/api/admin/settings/email", data);
      if (!response.ok) {
        throw new Error("Failed to save email settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate settings cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "Email settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings",
        variant: "destructive",
      });
    },
  });

  // Social media settings mutation
  const socialMediaSettingsMutation = useMutation({
    mutationFn: async (data: SocialMediaSettingsValues) => {
      const response = await apiRequest("POST", "/api/admin/settings/social", data);
      if (!response.ok) {
        throw new Error("Failed to save social media settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate settings cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "Social media settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update social media settings",
        variant: "destructive",
      });
    },
  });
  
  // Payment settings mutation
  const paymentSettingsMutation = useMutation({
    mutationFn: async (data: PaymentSettingsValues) => {
      const response = await apiRequest("POST", "/api/admin/settings/payment", data);
      if (!response.ok) {
        throw new Error("Failed to save payment gateway settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate settings cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "Payment gateway settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment gateway settings",
        variant: "destructive",
      });
    },
  });

  const onSubmitSiteSettings = (data: SiteSettingsValues) => {
    siteSettingsMutation.mutate(data);
  };

  const onSubmitAnalyticsSettings = (data: AnalyticsSettingsValues) => {
    analyticsSettingsMutation.mutate(data);
  };

  const onSubmitEmailSettings = (data: EmailSettingsValues) => {
    emailSettingsMutation.mutate(data);
  };

  const onSubmitSocialMediaSettings = (data: SocialMediaSettingsValues) => {
    socialMediaSettingsMutation.mutate(data);
  };
  
  const onSubmitPaymentSettings = (data: PaymentSettingsValues) => {
    paymentSettingsMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Website Settings | DesignKorv Admin</title>
        <meta name="description" content="Manage website settings for DesignKorv e-commerce platform." />
      </Helmet>

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Website Settings</h1>
        </div>

        {isLoadingSettings ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        ) : (
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
            </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage basic website settings and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...siteSettingsForm}>
                  <form onSubmit={siteSettingsForm.handleSubmit(onSubmitSiteSettings)} className="space-y-6">
                    <FormField
                      control={siteSettingsForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your website shown to users
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={siteSettingsForm.control}
                      name="siteDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter a brief description of your website" 
                              className="resize-none h-20"
                            />
                          </FormControl>
                          <FormDescription>
                            Used for SEO and meta descriptions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={siteSettingsForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteSettingsForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={siteSettingsForm.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              URL to your logo image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteSettingsForm.control}
                        name="faviconUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon URL</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              URL to your favicon image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={siteSettingsForm.control}
                      name="footerText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Footer Text</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Text displayed in the footer of your website
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={siteSettingsForm.control}
                        name="enableRegistration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">User Registration</FormLabel>
                              <FormDescription>
                                Allow new users to register on your website
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={siteSettingsForm.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Maintenance Mode</FormLabel>
                              <FormDescription>
                                Make the website unavailable to visitors
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={siteSettingsMutation.isPending}
                    >
                      {siteSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Settings */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Settings</CardTitle>
                <CardDescription>
                  Configure website analytics and tracking tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...analyticsSettingsForm}>
                  <form onSubmit={analyticsSettingsForm.handleSubmit(onSubmitAnalyticsSettings)} className="space-y-6">
                    <FormField
                      control={analyticsSettingsForm.control}
                      name="googleAnalyticsId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Analytics ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="UA-XXXXXXXXX-X" />
                          </FormControl>
                          <FormDescription>
                            Your Google Analytics tracking ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={analyticsSettingsForm.control}
                        name="enableAnalytics"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Analytics</FormLabel>
                              <FormDescription>
                                Track website visitors and their behavior
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={analyticsSettingsForm.control}
                        name="collectUserData"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Collect User Data</FormLabel>
                              <FormDescription>
                                Collect and store user behavior data
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={analyticsSettingsMutation.isPending}
                    >
                      {analyticsSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>
                  Configure email server settings and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailSettingsForm}>
                  <form onSubmit={emailSettingsForm.handleSubmit(onSubmitEmailSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="smtp.example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="587" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Username</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="username@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="••••••••" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailSettingsForm.control}
                        name="emailFromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="DesignKorv Store" />
                            </FormControl>
                            <FormDescription>
                              Name displayed in the from field
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailSettingsForm.control}
                        name="emailFromAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="noreply@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailSettingsForm.control}
                        name="enableOrderConfirmationEmails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Order Confirmation Emails</FormLabel>
                              <FormDescription>
                                Send email notifications for new orders
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailSettingsForm.control}
                        name="enableMarketingEmails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Marketing Emails</FormLabel>
                              <FormDescription>
                                Send promotional emails to customers
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={emailSettingsMutation.isPending}
                    >
                      {emailSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Settings</CardTitle>
                <CardDescription>
                  Configure payment providers and methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentSettingsForm}>
                  <form onSubmit={paymentSettingsForm.handleSubmit(onSubmitPaymentSettings)} className="space-y-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">General Payment Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={paymentSettingsForm.control}
                          name="currencyCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="USD" />
                              </FormControl>
                              <FormDescription>
                                Three-letter currency code (e.g., USD, EUR, GBP)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentSettingsForm.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Rate (%)</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" />
                              </FormControl>
                              <FormDescription>
                                Default tax rate percentage
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={paymentSettingsForm.control}
                          name="enableTaxCalculation"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Tax Calculation</FormLabel>
                                <FormDescription>
                                  Enable automatic tax calculation
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentSettingsForm.control}
                          name="requireBillingAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Billing Address</FormLabel>
                                <FormDescription>
                                  Require billing address at checkout
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentSettingsForm.control}
                          name="requireShippingAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Shipping Address</FormLabel>
                                <FormDescription>
                                  Require shipping address at checkout
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Stripe Settings */}
                    <div className="space-y-6">
                      <div className="flex flex-row items-center justify-between">
                        <h3 className="text-lg font-medium">Stripe Settings</h3>
                        <FormField
                          control={paymentSettingsForm.control}
                          name="stripeEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormLabel className="text-sm">Enable Stripe</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {paymentSettingsForm.watch("stripeEnabled") && (
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={paymentSettingsForm.control}
                            name="stripePublicKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stripe Public Key</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="pk_..." />
                                </FormControl>
                                <FormDescription>
                                  Your Stripe publishable key (starts with pk_)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentSettingsForm.control}
                            name="stripeSecretKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stripe Secret Key</FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input {...field} type="password" placeholder="sk_..." />
                                  </FormControl>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="icon" className="absolute right-0 top-0">
                                        <AlertCircle className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Security Warning</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Your Stripe Secret Key should be kept secure and never shared publicly. This key provides full access to your Stripe account.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogAction>I understand</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                <FormDescription>
                                  Your Stripe secret key (starts with sk_)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentSettingsForm.control}
                            name="stripeWebhookSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stripe Webhook Secret</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder="whsec_..." />
                                </FormControl>
                                <FormDescription>
                                  Your Stripe webhook secret for verifying webhook events
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* PayPal Settings */}
                    <div className="space-y-6">
                      <div className="flex flex-row items-center justify-between">
                        <h3 className="text-lg font-medium">PayPal Settings</h3>
                        <FormField
                          control={paymentSettingsForm.control}
                          name="paypalEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormLabel className="text-sm">Enable PayPal</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {paymentSettingsForm.watch("paypalEnabled") && (
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={paymentSettingsForm.control}
                            name="paypalClientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PayPal Client ID</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Your PayPal client ID from the developer dashboard
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentSettingsForm.control}
                            name="paypalClientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PayPal Client Secret</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormDescription>
                                  Your PayPal client secret from the developer dashboard
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentSettingsForm.control}
                            name="paypalSandboxMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Sandbox Mode</FormLabel>
                                  <FormDescription>
                                    Use PayPal sandbox for testing
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Payoneer Settings */}
                    <div className="space-y-6">
                      <div className="flex flex-row items-center justify-between">
                        <h3 className="text-lg font-medium">Payoneer Settings</h3>
                        <FormField
                          control={paymentSettingsForm.control}
                          name="payoneerEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormLabel className="text-sm">Enable Payoneer</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {paymentSettingsForm.watch("payoneerEnabled") && (
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={paymentSettingsForm.control}
                            name="payoneerApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payoneer API Key</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormDescription>
                                  Your Payoneer API key for integration
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={paymentSettingsForm.control}
                              name="payoneerUsername"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payoneer Username</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={paymentSettingsForm.control}
                              name="payoneerPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payoneer Password</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="password" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={paymentSettingsForm.control}
                            name="payoneerSandboxMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Sandbox Mode</FormLabel>
                                  <FormDescription>
                                    Use Payoneer sandbox for testing
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={paymentSettingsMutation.isPending}
                    >
                      {paymentSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Payment Settings
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Settings */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Settings</CardTitle>
                <CardDescription>
                  Configure your social media profiles and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...socialMediaSettingsForm}>
                  <form onSubmit={socialMediaSettingsForm.handleSubmit(onSubmitSocialMediaSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={socialMediaSettingsForm.control}
                        name="facebookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://facebook.com/yourpage" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={socialMediaSettingsForm.control}
                        name="instagramUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://instagram.com/yourpage" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={socialMediaSettingsForm.control}
                        name="twitterUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://twitter.com/yourhandle" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={socialMediaSettingsForm.control}
                        name="youtubeUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://youtube.com/yourchannel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={socialMediaSettingsForm.control}
                      name="pinterestUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pinterest URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://pinterest.com/yourprofile" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={socialMediaSettingsMutation.isPending}
                    >
                      {socialMediaSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}