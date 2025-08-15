import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  FileText, 
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  List,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'phone' | 'address';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  initialFields?: FormField[];
  onFormChange?: (fields: FormField[]) => void;
}

const FormBuilder = ({ initialFields = [], onFormChange }: FormBuilderProps) => {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: `Enter ${type}`,
      required: false,
    };

    if (type === 'select') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    setFields(prev => {
      const updated = [...prev, newField];
      onFormChange?.(updated);
      return updated;
    });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => {
      const updated = prev.map(field => 
        field.id === id ? { ...field, ...updates } : field
      );
      onFormChange?.(updated);
      return updated;
    });
  };

  const removeField = (id: string) => {
    setFields(prev => {
      const updated = prev.filter(field => field.id !== id);
      onFormChange?.(updated);
      return updated;
    });
  };

  const onDragEnd = (result: DropResult) => {
    setDraggingId(null);
    
    if (!result.destination) return;
    
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFields(items);
    onFormChange?.(items);
  };

  const onDragStart = (start: any) => {
    setDraggingId(start.draggableId);
  };

  const getFieldIcon = (type: FormField['type']) => {
    const icons = {
      text: Type,
      email: Mail,
      number: Hash,
      textarea: FileText,
      select: List,
      checkbox: ToggleLeft,
      date: Calendar,
      phone: Phone,
      address: MapPin,
    };
    
    const Icon = icons[type] || Type;
    return <Icon className="h-4 w-4" />;
  };

  const renderFieldEditor = (field: FormField) => {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFieldIcon(field.type)}
            <span className="font-medium">{field.label}</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeField(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
          />
        </div>
        
        {field.type === 'select' && (
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = e.target.value;
                      updateField(field.id, { options: newOptions });
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(field.options || [])];
                      newOptions.splice(index, 1);
                      updateField(field.id, { options: newOptions });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(field.options || []), `Option ${field.options?.length + 1 || 1}`];
                  updateField(field.id, { options: newOptions });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={(e) => updateField(field.id, { required: e.target.checked })}
          />
          <Label htmlFor={`required-${field.id}`}>Required</Label>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Toolbox */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Form Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-medium">Add Fields</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => addField('text')}>
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button variant="outline" onClick={() => addField('email')}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" onClick={() => addField('number')}>
                <Hash className="h-4 w-4 mr-2" />
                Number
              </Button>
              <Button variant="outline" onClick={() => addField('date')}>
                <Calendar className="h-4 w-4 mr-2" />
                Date
              </Button>
              <Button variant="outline" onClick={() => addField('textarea')}>
                <FileText className="h-4 w-4 mr-2" />
                Textarea
              </Button>
              <Button variant="outline" onClick={() => addField('select')}>
                <List className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button variant="outline" onClick={() => addField('checkbox')}>
                <ToggleLeft className="h-4 w-4 mr-2" />
                Checkbox
              </Button>
              <Button variant="outline" onClick={() => addField('phone')}>
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Preview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Form Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No fields added yet</p>
              <p className="text-sm">Add fields from the toolbox to get started</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
              <Droppable droppableId="form-fields">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "border rounded-lg bg-background",
                              snapshot.isDragging && "ring-2 ring-primary"
                            )}
                          >
                            <div className="flex items-center gap-2 p-2 border-b">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium flex-1">
                                {field.label} ({field.type})
                              </span>
                            </div>
                            {renderFieldEditor(field)}
                            {provided.placeholder}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormBuilder;
