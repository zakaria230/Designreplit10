import { Request, Response } from "express";
import { storage } from "../storage";

/**
 * Generate dynamic sitemap XML for better search engine indexing
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    // Set content type to XML
    res.header("Content-Type", "application/xml");
    
    // Get current date in XML format
    const today = new Date().toISOString().split('T')[0];
    
    // Start building the sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add static pages
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/shop", priority: "0.9", changefreq: "daily" },
      { url: "/categories", priority: "0.8", changefreq: "weekly" },
      { url: "/about", priority: "0.7", changefreq: "monthly" },
      { url: "/faq", priority: "0.7", changefreq: "monthly" },
      { url: "/contact", priority: "0.7", changefreq: "monthly" },
      { url: "/help-center", priority: "0.7", changefreq: "weekly" },
      { url: "/terms", priority: "0.5", changefreq: "yearly" },
      { url: "/privacy", priority: "0.5", changefreq: "yearly" },
    ];
    
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${req.protocol}://${req.get('host')}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    // Add dynamic product pages
    const products = await storage.getAllProducts();
    products.forEach(product => {
      xml += '  <url>\n';
      xml += `    <loc>${req.protocol}://${req.get('host')}/product/${product.slug}</loc>\n`;
      xml += `    <lastmod>${product.createdAt ? new Date(product.createdAt).toISOString().split('T')[0] : today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });
    
    // Add dynamic category pages
    const categories = await storage.getAllCategories();
    categories.forEach(category => {
      xml += '  <url>\n';
      xml += `    <loc>${req.protocol}://${req.get('host')}/categories/${category.slug}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });
    
    // Close sitemap
    xml += '</urlset>';
    
    // Send the XML
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
};