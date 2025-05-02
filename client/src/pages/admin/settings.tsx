import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Loader2, Save } from "lucide-react";

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

type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;
type AnalyticsSettingsValues = z.infer<typeof analyticsSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type SocialMediaSettingsValues = z.infer<typeof socialMediaSettingsSchema>;

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

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

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

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
      </div>
    </AdminLayout>
  );
}