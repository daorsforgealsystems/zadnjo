import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, Eye } from "lucide-react";
import { Item } from "@/lib/types";

interface DocumentManagerProps {
  item: Item;
  onDocumentsChange: (newDocuments: Item['documents']) => void;
}

const DocumentManager = ({ item, onDocumentsChange }: DocumentManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const newDocument = {
        name: selectedFile.name,
        // In a real app, this would be a URL to the uploaded file on a server
        url: URL.createObjectURL(selectedFile),
      };
      onDocumentsChange([...item.documents, newDocument]);
      setSelectedFile(null);
    }
  };

  const handleDelete = (docNameToRemove: string) => {
    const updatedDocuments = item.documents.filter(doc => doc.name !== docNameToRemove);
    onDocumentsChange(updatedDocuments);
  };

  return (
    <Card className="glass mt-6 hover-lift transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Document Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Section */}
          <div className="flex items-center gap-2">
            <Input type="file" onChange={handleFileSelect} className="flex-grow" />
            <Button onClick={handleUpload} disabled={!selectedFile}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* Document List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-foreground">Associated Documents</h4>
            {item.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No documents found.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {item.documents.map((doc, index) => (
                  <li key={index} className="flex items-center justify-between py-2">
                    <span className="flex-grow truncate pr-4">{doc.name}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(doc.name)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentManager;
