import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Product, Category, insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cropper from 'react-easy-crop';
import { AdminLayout } from "@/components/admin/admin-layout";

// Define Area type since it doesn't get imported correctly
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, PlusCircle, Pencil, Trash2, ArrowLeft, Plus, ImagePlus, Image, 
  Scissors, Search, Filter, Tag, CheckCircle, XCircle, Star, SlidersHorizontal, RefreshCcw, 
  File as FileIcon
} from "lucide-react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

// Types for product images and files
type ProductImage = {
  url: string;
  isPrimary?: boolean;
  type?: 'image' | 'video';
};

type ProductFile = {
  url: string;
  name: string;
  size: number; 
  type: string;
};

// Form schema for product
const productFormSchema = insertProductSchema.extend({
  price: z.coerce.number().positive("Price must be a positive number"),
  categoryId: z.coerce.number().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().default(false),
  images: z.array(z.object({
    url: z.string(),
    isPrimary: z.boolean().optional(),
    type: z.enum(['image', 'video']).optional()
  })).optional().default([]),
  downloadFiles: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
    type: z.string()
  })).optional().default([])
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Tag input states
  const [tagInput, setTagInput] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  
  // Image cropping states
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [formContext, setFormContext] = useState<'add' | 'edit'>('add');
  
  // Multiple images and files states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });

  // Fetch all products
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch all categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/admin/products", product);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product Added",
        description: "The product has been added successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, product }: { id: number, product: ProductFormValues }) => {
      const res = await apiRequest("PUT", `/api/admin/products/${id}`, product);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product Updated",
        description: "The product has been updated successfully.",
      });
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      // Use force-delete endpoint to bypass CSRF protection
      await apiRequest("DELETE", `/api/admin/products/${id}/force-delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // File upload mutations
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload/product-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Image Uploaded',
        description: 'Product image was uploaded successfully.'
      });
      return data.url;
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload/product-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'File Uploaded',
        description: 'Product file was uploaded successfully.'
      });
      return data.url;
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Refs for file inputs
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload for main product image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (formType === 'add') {
        addForm.setValue('imageUrl', result.url);
      } else {
        editForm.setValue('imageUrl', result.url);
      }
    } catch (error) {
      console.error('Image upload error:', error);
    }
  };

  // Handle file upload for main product download file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    try {
      const result = await uploadFileMutation.mutateAsync(file);
      if (formType === 'add') {
        addForm.setValue('downloadUrl', result.url);
      } else {
        editForm.setValue('downloadUrl', result.url);
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  };
  
  // Handle multiple image uploads
  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    
    try {
      const file = files[0];
      const isVideo = file.type.startsWith('video/');
      const result = await uploadImageMutation.mutateAsync(file);
      
      const newImage: ProductImage = {
        url: result.url,
        isPrimary: false,
        type: isVideo ? 'video' : 'image'
      };
      
      if (formType === 'add') {
        const currentImages = addForm.getValues('images') || [];
        addForm.setValue('images', [...currentImages, newImage]);
      } else {
        const currentImages = editForm.getValues('images') || [];
        editForm.setValue('images', [...currentImages, newImage]);
      }
      
      // Clear the input file
      e.target.value = '';
    } catch (error) {
      console.error('Additional image upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload additional image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle multiple file uploads
  const handleAdditionalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    
    try {
      const file = files[0];
      const result = await uploadFileMutation.mutateAsync(file);
      
      const newFile: ProductFile = {
        url: result.url,
        name: file.name,
        size: file.size,
        type: file.type
      };
      
      if (formType === 'add') {
        const currentFiles = addForm.getValues('downloadFiles') || [];
        addForm.setValue('downloadFiles', [...currentFiles, newFile]);
      } else {
        const currentFiles = editForm.getValues('downloadFiles') || [];
        editForm.setValue('downloadFiles', [...currentFiles, newFile]);
      }
      
      // Clear the input file
      e.target.value = '';
    } catch (error) {
      console.error('Additional file upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload additional file',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };
  
  // Remove an image from the list
  const handleRemoveImage = (index: number, formType: 'add' | 'edit') => {
    if (formType === 'add') {
      const currentImages = addForm.getValues('images') || [];
      const updatedImages = [...currentImages];
      updatedImages.splice(index, 1);
      addForm.setValue('images', updatedImages);
    } else {
      const currentImages = editForm.getValues('images') || [];
      const updatedImages = [...currentImages];
      updatedImages.splice(index, 1);
      editForm.setValue('images', updatedImages);
    }
  };
  
  // Remove a file from the list
  const handleRemoveFile = (index: number, formType: 'add' | 'edit') => {
    if (formType === 'add') {
      const currentFiles = addForm.getValues('downloadFiles') || [];
      const updatedFiles = [...currentFiles];
      updatedFiles.splice(index, 1);
      addForm.setValue('downloadFiles', updatedFiles);
    } else {
      const currentFiles = editForm.getValues('downloadFiles') || [];
      const updatedFiles = [...currentFiles];
      updatedFiles.splice(index, 1);
      editForm.setValue('downloadFiles', updatedFiles);
    }
  };
  
  // Set an image as primary
  const handleSetPrimaryImage = (index: number, formType: 'add' | 'edit') => {
    if (formType === 'add') {
      const currentImages = addForm.getValues('images') || [];
      const updatedImages = currentImages.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      addForm.setValue('images', updatedImages);
    } else {
      const currentImages = editForm.getValues('images') || [];
      const updatedImages = currentImages.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      editForm.setValue('images', updatedImages);
    }
  };

  // Add product form
  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      details: "",
      specifications: "",
      price: 0,
      imageUrl: "",
      images: [],
      downloadUrl: "",
      downloadFiles: [],
      categoryId: null,
      tags: [],
      isFeatured: false,
    },
  });

  // Edit product form
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      details: "",
      specifications: "",
      price: 0,
      imageUrl: "",
      images: [],
      downloadUrl: "",
      downloadFiles: [],
      categoryId: null,
      tags: [],
      isFeatured: false,
    },
  });

  // Handle add product submission
  const onAddSubmit = (values: ProductFormValues) => {
    // Use the values directly as the API expects null (not undefined)
    addProductMutation.mutate(values);
  };

  // Handle edit product submission
  const onEditSubmit = (values: ProductFormValues) => {
    if (!editingProduct) return;
    
    // Use the values directly as the API expects null (not undefined)
    updateProductMutation.mutate({ id: editingProduct.id, product: values });
  };

  // Handle editing a product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Reset form with product values
    editForm.reset({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      details: product.details || "",
      specifications: product.specifications || "",
      price: product.price,
      imageUrl: product.imageUrl || "",
      images: Array.isArray(product.images) ? product.images : [],
      downloadUrl: product.downloadUrl || "",
      downloadFiles: Array.isArray(product.downloadFiles) ? product.downloadFiles : [],
      categoryId: product.categoryId || null,
      tags: product.tags || [],
      isFeatured: product.isFeatured || false,
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  // Generate slug from name for add form
  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    addForm.setValue("slug", slug);
  };

  // Generate slug from name for edit form
  const generateEditSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    editForm.setValue("slug", slug);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  // Handle tags for add form
  const handleAddTag = () => {
    if (tagInput.trim() === "") return;
    
    const currentTags = addForm.getValues("tags") || [];
    if (!currentTags.includes(tagInput.trim())) {
      addForm.setValue("tags", [...currentTags, tagInput.trim()]);
    }
    setTagInput("");
  };
  
  const handleRemoveTag = (tag: string) => {
    if (editingProduct) {
      // We're in edit mode
      const currentTags = editForm.getValues("tags") || [];
      editForm.setValue("tags", currentTags.filter(t => t !== tag));
    } else {
      // We're in add mode
      const currentTags = addForm.getValues("tags") || [];
      addForm.setValue("tags", currentTags.filter(t => t !== tag));
    }
  };
  
  // Handle tags for edit form
  const handleAddEditTag = () => {
    if (editTagInput.trim() === "") return;
    
    const currentTags = editForm.getValues("tags") || [];
    if (!currentTags.includes(editTagInput.trim())) {
      editForm.setValue("tags", [...currentTags, editTagInput.trim()]);
    }
    setEditTagInput("");
  };

  // Cropping functionality
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Show crop dialog
  const startImageCrop = (imageUrl: string | null | undefined, context: 'add' | 'edit') => {
    if (!imageUrl) return;
    setImageToEdit(imageUrl);
    setFormContext(context);
    setCropDialogOpen(true);
  };

  // Function to create a data URL from a cropped area
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image() as HTMLImageElement;
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error: Event) => reject(error));
      image.src = url;
    });

  function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180;
  }

  // Function to get the cropped image
  async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context is not available');
      }

      // Set canvas size to match the final image size
      const targetWidth = pixelCrop.width;
      const targetHeight = pixelCrop.height;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Clear the canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Draw the image directly with the crop parameters
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );
      
      // Convert canvas to blob
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (file) => {
            if (file) resolve(file);
            else reject(new Error('Failed to create blob from canvas'));
          },
          'image/jpeg',
          1
        );
      });
    } catch (error) {
      console.error('Error in getCroppedImg:', error);
      throw new Error('Failed to crop image');
    }
  }

  // Apply cropped image
  const saveCroppedImage = async () => {
    if (!imageToEdit || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageToEdit, croppedAreaPixels);
      const file = new File([croppedImage], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      const result = await uploadImageMutation.mutateAsync(file);
      
      if (formContext === 'add') {
        addForm.setValue('imageUrl', result.url);
      } else {
        editForm.setValue('imageUrl', result.url);
      }
      
      setCropDialogOpen(false);
      toast({
        title: 'Image Cropped',
        description: 'Image has been cropped and saved successfully.',
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: 'Crop Failed',
        description: 'Failed to crop and save the image.',
        variant: 'destructive',
      });
    }
  };

  // Filter methods
  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setShowFeaturedOnly(false);
    setPriceRange({ min: null, max: null });
  };
  
  // Apply filters to products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      // Search term filter
      const matchesSearch = searchTerm 
        ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
        : true;
      
      // Category filter
      const matchesCategory = selectedCategories.length > 0 
        ? selectedCategories.includes(product.categoryId || 0)
        : true;
      
      // Featured only filter
      const matchesFeatured = showFeaturedOnly 
        ? product.isFeatured 
        : true;
      
      // Price range filter
      const matchesPrice = 
        (!priceRange.min || product.price >= priceRange.min) && 
        (!priceRange.max || product.price <= priceRange.max);
      
      return matchesSearch && matchesCategory && matchesFeatured && matchesPrice;
    });
  }, [products, searchTerm, selectedCategories, showFeaturedOnly, priceRange]);

  const isLoading = isLoadingProducts || isLoadingCategories;

  return (
    <AdminLayout>
      <Helmet>
        <title>Product Management | DesignKorv Admin</title>
        <meta name="description" content="Manage products for the DesignKorv e-commerce platform." />
      </Helmet>
      
      {/* Image Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the image crop to focus on the most important part.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-96">
            {imageToEdit && (
              <Cropper
                image={imageToEdit}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Zoom:</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCropDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveCroppedImage}>
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-64 border-r p-6 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Search
              </h3>
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>

            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </h3>
              <Card>
                <CardContent className="p-4 space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="categories">
                      <AccordionTrigger className="text-sm font-medium py-2">
                        Categories
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : categories && categories.length > 0 ? (
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`category-${category.id}`}
                                  checked={selectedCategories.includes(category.id)}
                                  onCheckedChange={() => handleCategoryToggle(category.id)}
                                />
                                <label
                                  htmlFor={`category-${category.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground py-2">
                            No categories found
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="price">
                      <AccordionTrigger className="text-sm font-medium py-2">
                        Price Range
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Minimum Price</label>
                          <Input
                            type="number"
                            placeholder="Min $"
                            min={0}
                            value={priceRange.min || ''}
                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value ? Number(e.target.value) : null })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Maximum Price</label>
                          <Input
                            type="number"
                            placeholder="Max $"
                            min={0}
                            value={priceRange.max || ''}
                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value ? Number(e.target.value) : null })}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="featured">
                      <AccordionTrigger className="text-sm font-medium py-2">
                        Featured Status
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="featured-only"
                            checked={showFeaturedOnly}
                            onCheckedChange={(checked) => setShowFeaturedOnly(!!checked)}
                          />
                          <label
                            htmlFor="featured-only"
                            className="text-sm cursor-pointer flex items-center"
                          >
                            <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
                            Featured only
                          </label>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={resetFilters}
                    size="sm"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
            </div>
          
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new product. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Product name" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                if (!addForm.getValues("slug")) {
                                  generateSlug(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="product-slug" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used in the URL. Auto-generated from the name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Product description" 
                              className="h-24"
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>
                            Short description that appears on the product card and summary.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed product information" 
                              className="h-32"
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>
                            Detailed information about the product that appears in the Details tab. Can include HTML formatting.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="specifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specifications</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Technical specifications, file formats, dimensions, etc." 
                              className="h-32"
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>
                            Technical specifications that appear in the Specifications tab.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                min="0"
                                placeholder="0.00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              value={field.value?.toString() || "0"}
                              onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">No category</SelectItem>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <div className="flex flex-col space-y-2">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {field.value?.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                                  {tag}
                                  <button 
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    ✕
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a tag"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag();
                                  }
                                }}
                              />
                              <Button 
                                type="button" 
                                size="sm"
                                onClick={handleAddTag}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                          <FormDescription>
                            Tags help customers find your products. Press Enter or click Add to add a tag.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Images/Videos</FormLabel>
                          <FormDescription>
                            Upload images or videos for the product.
                          </FormDescription>
                          
                          <div className="space-y-4">
                            {/* Image gallery grid */}
                            {(addForm.getValues('imageUrl') || (field.value && field.value.length > 0)) && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {/* Main image if exists */}
                                {addForm.getValues('imageUrl') && (
                                  <div className="relative group rounded-md overflow-hidden border aspect-square">
                                    <img 
                                      src={addForm.getValues('imageUrl')} 
                                      alt="Product preview" 
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 z-10">
                                      <span className="bg-white text-xs font-medium px-2 py-0.5 rounded">Primary</span>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 bg-white hover:bg-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startImageCrop(addForm.getValues('imageUrl'), 'add');
                                        }}
                                      >
                                        <Scissors className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 bg-white hover:bg-white text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addForm.setValue('imageUrl', '');
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Additional images if exist */}
                                {field.value && field.value.map((image, index) => (
                                  <div key={index} className="relative group rounded-md overflow-hidden border aspect-square">
                                    {image.type === 'video' ? (
                                      <video 
                                        src={image.url} 
                                        className="w-full h-full object-cover"
                                        muted 
                                        loop
                                        onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                                        onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                                      />
                                    ) : (
                                      <img 
                                        src={image.url} 
                                        alt={`Product image ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                    
                                    {image.isPrimary && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <span className="bg-white text-xs font-medium px-2 py-0.5 rounded shadow-sm">Primary</span>
                                      </div>
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 bg-white hover:bg-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetPrimaryImage(index, 'add');
                                        }}
                                        title="Set as primary"
                                      >
                                        <Star className={`h-4 w-4 ${image.isPrimary ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                      </Button>
                                      
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 bg-white hover:bg-white text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveImage(index, 'add');
                                        }}
                                        title="Remove image"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Upload image button */}
                            <div
                              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                if (!addForm.getValues('imageUrl')) {
                                  // If no main image exists, use main image uploader
                                  addImageInputRef.current?.click();
                                } else {
                                  // Otherwise, add as additional image
                                  const fileInput = document.createElement('input');
                                  fileInput.type = 'file';
                                  fileInput.accept = 'image/*,video/*';
                                  fileInput.onchange = (e) => handleAdditionalImageUpload(e as any, 'add');
                                  fileInput.click();
                                }
                              }}
                            >
                              <div className="p-4 bg-primary/10 rounded-full">
                                <ImagePlus className="h-8 w-8 text-primary" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium">Click to upload</p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG or WebP (max. 5MB)
                                </p>
                              </div>
                              {uploadingImage && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={addImageInputRef}
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'add')}
                          />
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="downloadFiles"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Downloadable Files</FormLabel>
                          <FormDescription>
                            Upload design files that customers will download after purchase.
                          </FormDescription>
                          
                          <div className="space-y-4">
                            {/* Main downloadable file if exists */}
                            {addForm.getValues('downloadUrl') && (
                              <div className="border rounded-lg p-4 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-primary/10 rounded">
                                    <FileIcon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {addForm.getValues('downloadUrl').split('/').pop() || 'Main file'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Primary download file</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => addForm.setValue('downloadUrl', '')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Additional files list */}
                            {field.value && field.value.length > 0 && (
                              <div className="space-y-2">
                                {field.value.map((file, index) => (
                                  <div key={index} className="border rounded-lg p-3 flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 bg-primary/10 rounded">
                                        <FileIcon className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {file.name || file.url.split('/').pop() || `File ${index + 1}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {file.type} - {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => handleRemoveFile(index, 'add')}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Upload file button */}
                            <div
                              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                if (!addForm.getValues('downloadUrl')) {
                                  // If no main file exists, use main file uploader
                                  addFileInputRef.current?.click();
                                } else {
                                  // Otherwise, add as additional file
                                  const fileInput = document.createElement('input');
                                  fileInput.type = 'file';
                                  fileInput.accept = '.zip,.pdf,.ai,.psd,.eps,.svg';
                                  fileInput.onchange = (e) => handleAdditionalFileUpload(e as any, 'add');
                                  fileInput.click();
                                }
                              }}
                            >
                              <div className="p-4 bg-primary/10 rounded-full">
                                <FileIcon className="h-8 w-8 text-primary" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium">Click to upload</p>
                                <p className="text-xs text-muted-foreground">
                                  ZIP, PDF, AI, PSD, EPS or SVG (max. 50MB)
                                </p>
                              </div>
                              {uploadingFile && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          <input 
                            type="file"
                            accept=".zip,.pdf,.ai,.psd,.eps,.svg"
                            ref={addFileInputRef}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'add')}
                          />
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Featured Product</FormLabel>
                            <FormDescription>
                              Featured products appear on the homepage.
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
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addProductMutation.isPending}>
                        {addProductMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Product"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Product list table */}
          <div className="border rounded-lg">
            {productsError ? (
              <div className="p-8 text-center">
                <p className="text-red-500 dark:text-red-400">
                  Error loading products. Please try again later.
                </p>
              </div>
            ) : isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 mr-3">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                                    No img
                                  </div>
                                )}
                              </div>
                              <span>{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>
                            {categories?.find(c => c.id === product.categoryId)?.name || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {product.tags && product.tags.length > 0 ? (
                                product.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs">No tags</span>
                              )}
                              {product.tags && product.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.isFeatured && (
                              <Badge>Featured</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No products found. Add your first product to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Edit Product Dialog */}
          <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update the product details. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Product name" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              if (editForm.getValues("slug") === editingProduct?.slug) {
                                generateEditSlug(e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="product-slug" {...field} />
                        </FormControl>
                        <FormDescription>
                          Used in the URL. Auto-generated from the name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Product description" 
                            className="h-24"
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            name={field.name}
                          />
                        </FormControl>
                        <FormDescription>
                          Short description that appears on the product card and summary.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed product information" 
                            className="h-32"
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            name={field.name}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed information about the product that appears in the Details tab. Can include HTML formatting.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="specifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specifications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Technical specifications, file formats, dimensions, etc." 
                            className="h-32"
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            name={field.name}
                          />
                        </FormControl>
                        <FormDescription>
                          Technical specifications that appear in the Specifications tab.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            value={field.value?.toString() || "0"}
                            onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">No category</SelectItem>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <div className="flex flex-col space-y-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {field.value?.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                                {tag}
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  ✕
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag"
                              value={editTagInput}
                              onChange={(e) => setEditTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddEditTag();
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              size="sm"
                              onClick={handleAddEditTag}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                        <FormDescription>
                          Tags help customers find your products. Press Enter or click Add to add a tag.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Images for Edit Form */}
                  <FormField
                    control={editForm.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base">Photos and video <span className="text-red-500">*</span></FormLabel>
                        <FormDescription>
                          Add up to 10 photos and 1 video.
                        </FormDescription>
                        
                        <div className="space-y-4">
                          {/* Grid layout for images */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {/* Main product image if exists */}
                            {editForm.getValues('imageUrl') && (
                              <div className="relative border rounded-lg overflow-hidden bg-gray-100 aspect-square group">
                                <img 
                                  src={editForm.getValues('imageUrl')} 
                                  alt="Main product image" 
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute top-2 left-2">
                                  <span className="bg-black text-white text-xs font-medium px-2 py-1 rounded-full">
                                    Primary
                                  </span>
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-white rounded-full hover:bg-gray-100"
                                      onClick={() => {
                                        startImageCrop(editForm.getValues('imageUrl'), 'edit');
                                      }}
                                    >
                                      <Scissors className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-white text-red-500 rounded-full hover:bg-red-50"
                                      onClick={() => editForm.setValue('imageUrl', '')}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Additional images */}
                            {field.value && field.value.map((image, index) => (
                              <div key={index} className="relative border rounded-lg overflow-hidden bg-gray-100 aspect-square group">
                                {image.type === 'video' ? (
                                  <video 
                                    src={image.url} 
                                    className="h-full w-full object-cover"
                                    controls={false}
                                  />
                                ) : (
                                  <img 
                                    src={image.url} 
                                    alt={`Product image ${index + 1}`} 
                                    className="h-full w-full object-cover"
                                  />
                                )}
                                
                                {image.isPrimary && (
                                  <div className="absolute top-2 left-2">
                                    <span className="bg-black text-white text-xs font-medium px-2 py-1 rounded-full">
                                      Primary
                                    </span>
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <div className="flex gap-1">
                                    {image.type !== 'video' && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 bg-white rounded-full hover:bg-gray-100"
                                        onClick={() => {
                                          startImageCrop(image.url, 'edit');
                                        }}
                                      >
                                        <Scissors className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-white rounded-full hover:bg-gray-100"
                                      onClick={() => handleSetPrimaryImage(index, 'edit')}
                                    >
                                      <Star className={`h-4 w-4 ${image.isPrimary ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-white text-red-500 rounded-full hover:bg-red-50"
                                      onClick={() => handleRemoveImage(index, 'edit')}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Upload image button */}
                            {((!editForm.getValues('imageUrl') && (!field.value || field.value.length === 0)) || 
                              (editForm.getValues('imageUrl') || (field.value && field.value.length > 0))) && (
                              <div
                                className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  if (!editForm.getValues('imageUrl')) {
                                    // If no main image, use main image uploader
                                    editImageInputRef.current?.click();
                                  } else {
                                    // Otherwise add as additional image
                                    const fileInput = document.createElement('input');
                                    fileInput.type = 'file';
                                    fileInput.accept = 'image/*,video/*';
                                    fileInput.onchange = (e) => handleAdditionalImageUpload(e as any, 'edit');
                                    fileInput.click();
                                  }
                                }}
                              >
                                <div className="p-2 bg-gray-100 rounded-full">
                                  <ImagePlus className="h-5 w-5 text-gray-600" />
                                </div>
                                {uploadingImage && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <input 
                          type="file"
                          accept="image/*"
                          ref={editImageInputRef}
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'edit')}
                        />
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  
                  {/* Downloadable Files for Edit Form */}
                  <FormField
                    control={editForm.control}
                    name="downloadFiles"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Downloadable Files</FormLabel>
                        <FormDescription>
                          Upload design files that customers will download after purchase.
                        </FormDescription>
                        
                        <div className="space-y-4">
                          {/* Main downloadable file if exists */}
                          {editForm.getValues('downloadUrl') && (
                            <div className="border rounded-lg p-4 flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded">
                                  <FileIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {editForm.getValues('downloadUrl').split('/').pop() || 'Main file'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Primary download file</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => editForm.setValue('downloadUrl', '')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Additional files list */}
                          {field.value && field.value.length > 0 && (
                            <div className="space-y-2">
                              {field.value.map((file, index) => (
                                <div key={index} className="border rounded-lg p-3 flex justify-between items-center">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-primary/10 rounded">
                                      <FileIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {file.name || file.url.split('/').pop() || `File ${index + 1}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {file.type} - {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemoveFile(index, 'edit')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Upload file button */}
                          <div
                            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              if (!editForm.getValues('downloadUrl')) {
                                // If no main file exists, use main file uploader
                                editFileInputRef.current?.click();
                              } else {
                                // Otherwise, add as additional file
                                const fileInput = document.createElement('input');
                                fileInput.type = 'file';
                                fileInput.accept = '.zip,.pdf,.ai,.psd,.eps,.svg';
                                fileInput.onchange = (e) => handleAdditionalFileUpload(e as any, 'edit');
                                fileInput.click();
                              }
                            }}
                          >
                            <div className="p-4 bg-primary/10 rounded-full">
                              <FileIcon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">Click to upload</p>
                              <p className="text-xs text-muted-foreground">
                                ZIP, PDF, AI, PSD, EPS or SVG (max. 50MB)
                              </p>
                            </div>
                            {uploadingFile && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        <input 
                          type="file"
                          accept=".zip,.pdf,.ai,.psd,.eps,.svg"
                          ref={editFileInputRef}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'edit')}
                        />
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured Product</FormLabel>
                          <FormDescription>
                            Featured products appear on the homepage.
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
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateProductMutation.isPending}>
                      {updateProductMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Product"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the product "{productToDelete?.name}"? 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteConfirm}
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Product"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}