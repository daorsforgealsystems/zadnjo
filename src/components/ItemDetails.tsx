import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, List, MessageSquare, FileText } from "lucide-react";
import MapView from './MapView';
import DocumentManager from './DocumentManager';
import ShipmentChat from './ShipmentChat';
import { Item } from "@/lib/types";


interface ItemDetailsProps {
    item: Item | null;
    onClose: () => void;
    onItemChange: (updatedItem: Item) => void;
}


const ItemDetails = ({ item, onClose, onItemChange }: ItemDetailsProps) => {
  if (!item) return null;

  const handleDocumentsChange = (newDocuments: Item['documents']) => {
    onItemChange({ ...item, documents: newDocuments });
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Details for item ID: {item.id} - <Badge>{item.status}</Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details"><Map className="w-4 h-4 mr-2" />Details</TabsTrigger>
            <TabsTrigger value="history"><List className="w-4 h-4 mr-2" />History</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-2" />Documents</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-semibold mr-2">Location:</span>
                <span>{item.location}</span>
              </div>
              <div className="h-64 rounded-md">
                <MapView coordinates={item.coordinates} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {item.history.map((entry, index) => (
                <li key={index} className="text-sm p-2 rounded bg-muted/50">
                  {entry.status} - {entry.timestamp}
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentManager item={item} onDocumentsChange={handleDocumentsChange} />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <div className="h-[400px] border rounded-lg">
              <ShipmentChat shipmentId={item.id} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetails;
