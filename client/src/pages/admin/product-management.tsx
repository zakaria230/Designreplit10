import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Product, Category, insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cropper from 'react-easy-crop';

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
import { Loader2, PlusCircle, Pencil, Trash2, ArrowLeft, Plus, ImagePlus, Image, Scissors } from "lucide-react";
import { Link } from "wouter";

// Form schema for product
const productFormSchema = insertProductSchema.extend({
  price: z.coerce.number().positive("Price must be a positive number"),
  categoryId: z.coerce.number().nullable(),
  isFeatured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Image cropping states
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [formContext, setFormContext] = useState<'add' | 'edit'>('add');

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
      await apiRequest("DELETE", `/api/admin/products/${id}`);
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

  // Handle file upload
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

  // Add product form
  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      imageUrl: "",
      downloadUrl: "",
      categoryId: null,
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
      price: 0,
      imageUrl: "",
      downloadUrl: "",
      categoryId: null,
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
      price: product.price,
      imageUrl: product.imageUrl || "",
      downloadUrl: product.downloadUrl || "",
      categoryId: product.categoryId || null,
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
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context is not available');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(getRadianAngle(rotation));
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(file => {
        if (file) resolve(file);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg');
    });
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

  const isLoading = isLoadingProducts || isLoadingCategories;

  return (
    <>
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

      <div className="flex-1 p-8 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
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
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photos and video <span className="text-red-500">*</span></FormLabel>
                        <FormDescription>
                          Add up to 10 photos and 1 video.
                        </FormDescription>
                        
                        {!field.value ? (
                          <div 
                            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => addImageInputRef.current?.click()}
                          >
                            <p className="text-center text-muted-foreground">Drag & Drop or</p>
                            
                            <Button
                              type="button"
                              variant="secondary"
                              className="flex gap-2 items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                addImageInputRef.current?.click();
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              Add up to 10 photos and 1 video
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-6 gap-2">
                              <div className="relative group aspect-square overflow-hidden rounded-md border border-input">
                                <img 
                                  src={field.value} 
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
                                      startImageCrop(field.value, 'add');
                                    }}
                                  >
                                    <Scissors className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-white hover:bg-white"
                                    onClick={() => addForm.setValue("imageUrl", "")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Empty placeholder slots */}
                              {Array.from({ length: 5 }).map((_, index) => (
                                <div 
                                  key={`empty-${index}`}
                                  className="aspect-square rounded-md border border-input flex items-center justify-center bg-muted/30 cursor-pointer"
                                  onClick={() => addImageInputRef.current?.click()}
                                >
                                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex gap-2 items-center"
                                onClick={() => addImageInputRef.current?.click()}
                              >
                                <Plus className="h-4 w-4" />
                                Add more photos or video
                              </Button>
                            </div>
                          </div>
                        )}
                        
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
                    name="downloadUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product files <span className="text-red-500">*</span></FormLabel>
                        <FormDescription>
                          Upload the design files that customers will download after purchase.
                        </FormDescription>
                        
                        {!field.value ? (
                          <div 
                            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => addFileInputRef.current?.click()}
                          >
                            <div className="p-4 bg-primary/10 rounded-full">
                              <Image className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center space-y-2">
                              <p className="font-medium">Drag and drop files here or click to browse</p>
                              <p className="text-sm text-muted-foreground">
                                Supported file types: ZIP, PDF, AI, PSD, EPS, SVG
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-card">
                              <div className="flex items-center gap-2 p-4">
                                <div className="bg-primary/10 p-2 rounded">
                                  <Image className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{field.value.split('/').pop()}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {/* You can add file size here if available */}
                                    Ready for download
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="flex-shrink-0"
                                  onClick={() => addForm.setValue("downloadUrl", "")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              className="flex gap-2 items-center"
                              onClick={() => addFileInputRef.current?.click()}
                            >
                              <Plus className="h-4 w-4" />
                              Replace file
                            </Button>
                          </div>
                        )}
                        
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

        {/* Product list */}
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products && products.length > 0 ? (
                    products.map((product) => (
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
                      <TableCell colSpan={5} className="text-center py-8">
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
          <DialogContent className="sm:max-w-[600px]">
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
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photos and video <span className="text-red-500">*</span></FormLabel>
                      <FormDescription>
                        Add up to 10 photos and 1 video.
                      </FormDescription>
                      
                      {!field.value ? (
                        <div 
                          className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => editImageInputRef.current?.click()}
                        >
                          <p className="text-center text-muted-foreground">Drag & Drop or</p>
                          
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex gap-2 items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              editImageInputRef.current?.click();
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Add up to 10 photos and 1 video
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-6 gap-2">
                            <div className="relative group aspect-square overflow-hidden rounded-md border border-input">
                              <img 
                                src={field.value} 
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
                                    startImageCrop(field.value, 'edit');
                                  }}
                                >
                                  <Scissors className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-white hover:bg-white"
                                  onClick={() => editForm.setValue("imageUrl", "")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Empty placeholder slots */}
                            {Array.from({ length: 5 }).map((_, index) => (
                              <div 
                                key={`empty-edit-${index}`}
                                className="aspect-square rounded-md border border-input flex items-center justify-center bg-muted/30 cursor-pointer"
                                onClick={() => editImageInputRef.current?.click()}
                              >
                                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex gap-2 items-center"
                              onClick={() => editImageInputRef.current?.click()}
                            >
                              <Plus className="h-4 w-4" />
                              Add more photos or video
                            </Button>
                          </div>
                        </div>
                      )}
                      
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
                
                <FormField
                  control={editForm.control}
                  name="downloadUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product files <span className="text-red-500">*</span></FormLabel>
                      <FormDescription>
                        Upload the design files that customers will download after purchase.
                      </FormDescription>
                      
                      {!field.value ? (
                        <div 
                          className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => editFileInputRef.current?.click()}
                        >
                          <div className="p-4 bg-primary/10 rounded-full">
                            <Image className="h-8 w-8 text-primary" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="font-medium">Drag and drop files here or click to browse</p>
                            <p className="text-sm text-muted-foreground">
                              Supported file types: ZIP, PDF, AI, PSD, EPS, SVG
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-lg border bg-card">
                            <div className="flex items-center gap-2 p-4">
                              <div className="bg-primary/10 p-2 rounded">
                                <Image className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{field.value.split('/').pop()}</p>
                                <p className="text-xs text-muted-foreground">
                                  {/* You can add file size here if available */}
                                  Ready for download
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0"
                                onClick={() => editForm.setValue("downloadUrl", "")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            className="flex gap-2 items-center"
                            onClick={() => editFileInputRef.current?.click()}
                          >
                            <Plus className="h-4 w-4" />
                            Replace file
                          </Button>
                        </div>
                      )}
                      
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
              <p className="font-medium">{productToDelete?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatPrice(productToDelete?.price || 0)}
              </p>
            </div>
            <DialogFooter>
              <Button 
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
    </>
  );
}
