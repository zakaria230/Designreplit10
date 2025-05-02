import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

type SiteSettings = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
};

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: Error | null;
}

// Default values
const defaultSettings: SiteSettings = {
  siteName: 'DesignKorv',
  siteDescription: 'Premium digital fashion design files for designers and fashion enthusiasts',
  contactEmail: 'contact@designkorv.com',
  contactPhone: '+1 (555) 123-9999',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  footerText: '© 2025 DesignKorv. All rights reserved.',
};

export const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  isLoading: false,
  error: null,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const {
    data: settingsData,
    isLoading,
    error,
  } = useQuery<{ success: boolean; data: Record<string, Record<string, any>> }>({
    queryKey: ['/api/settings/public'],
    // This will fail silently and use default settings if the endpoint doesn't exist
    retry: false,
  });

  // Process settings from API response
  const settings = settingsData?.data?.site
    ? {
        siteName: settingsData.data.site.site_siteName || defaultSettings.siteName,
        siteDescription: settingsData.data.site.site_siteDescription || defaultSettings.siteDescription,
        contactEmail: settingsData.data.site.site_contactEmail || defaultSettings.contactEmail,
        contactPhone: settingsData.data.site.site_contactPhone || defaultSettings.contactPhone,
        logoUrl: settingsData.data.site.site_logoUrl || defaultSettings.logoUrl,
        faviconUrl: settingsData.data.site.site_faviconUrl || defaultSettings.faviconUrl,
        footerText: settingsData.data.site.site_footerText || defaultSettings.footerText,
      }
    : defaultSettings;

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, error: error as Error | null }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  
  return context;
}