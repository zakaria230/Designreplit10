import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProfileLayout } from "@/components/profile/profile-layout";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Download, FileText, Clock, Eye, File, Package, Receipt } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DownloadsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch orders
  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Format date to display in readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Extract all downloadable items from orders
  const getDownloadableItems = () => {
    if (!orders) return [];
    
    const downloadableItems: any[] = [];
    orders.forEach((order: any) => {
      // Only show downloads for completed orders that have been paid
      if (order.items && 
          order.items.length > 0 && 
          order.status === 'completed' && 
          order.paymentStatus === 'paid') {
        order.items.forEach((item: any) => {
          if (item.product && item.product.downloadUrl) {
            downloadableItems.push({
              id: `${order.id}-${item.id}`,
              orderId: order.id,
              orderDate: order.createdAt,
              productId: item.productId,
              productName: item.product.name,
              downloadUrl: item.product.downloadUrl,
              fileType: getFileType(item.product.downloadUrl),
              imageUrl: item.product.imageUrl
            });
          }
        });
      }
    });
    
    return downloadableItems;
  };
  
  // Get file type from URL
  const getFileType = (url: string) => {
    if (!url) return "Unknown";
    
    if (url.endsWith('.zip')) return 'ZIP Archive';
    if (url.endsWith('.pdf')) return 'PDF Document';
    if (url.endsWith('.ai') || url.endsWith('.eps')) return 'Vector File';
    if (url.endsWith('.psd')) return 'Photoshop File';
    if (url.endsWith('.blend')) return 'Blender File';
    if (url.endsWith('.fbx') || url.endsWith('.obj')) return '3D Model';
    
    // Default to generic file type
    return "Digital Asset";
  };

  // Get full order details by orderId
  const getOrderDetails = (orderId: number) => {
    if (!orders) return null;
    return orders.find((order: any) => order.id === orderId);
  };

  // Handle view order click
  const handleViewOrder = (orderId: number) => {
    const order = getOrderDetails(orderId);
    if (order) {
      setSelectedOrder(order);
      setIsDialogOpen(true);
    }
  };

  // Filter items based on search term
  const downloadableItems = getDownloadableItems();
  const filteredItems = downloadableItems.filter(item => 
    searchTerm === "" || 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fileType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProfileLayout 
      title="My Downloads" 
      description="Access and download your purchased digital assets"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search downloads by name or file type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Downloads Section */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading your downloadable items...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="h-36 bg-gray-100 dark:bg-gray-700 relative">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.productName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {item.fileType}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-lg line-clamp-1 mb-1">{item.productName}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Purchased on {formatDate(item.orderDate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Order #{item.orderId}
                    </span>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOrder(item.orderId)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Order</span>
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          const fileName = item.downloadUrl.split('/').pop();
                          const downloadUrl = `/uploads/downloads/${fileName}`;
                          window.open(downloadUrl, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <File className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium mb-1">No downloadable items found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm 
                ? "No items match your search criteria. Try a different search term."
                : "You don't have any downloadable items yet."}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about your order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Order #{selectedOrder.id}</h3>
                </div>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {selectedOrder.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Ordered Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Payment Status</p>
                  <p className="font-medium capitalize">{selectedOrder.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.paymentMethod === "paypal" ? "PayPal" : selectedOrder.paymentMethod || "PayPal"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="font-medium">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.map((item: any) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between py-2 px-3 border border-gray-100 dark:border-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {item.product?.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name} 
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProfileLayout>
  );
}