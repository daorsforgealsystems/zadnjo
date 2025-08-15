import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
}

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[];
  trigger?: React.ReactNode;
}

const KeyboardShortcutsDialog = ({ shortcuts, trigger }: KeyboardShortcutsDialogProps) => {
  const [open, setOpen] = useState(false);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    
    if (shortcut.ctrlKey || shortcut.metaKey) {
      keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    }
    if (shortcut.altKey) {
      keys.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    }
    if (shortcut.shiftKey) {
      keys.push('⇧');
    }
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {shortcuts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No keyboard shortcuts available
            </p>
          ) : (
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {formatShortcut(shortcut).map((key, keyIndex) => (
                      <Badge key={keyIndex} variant="outline" className="text-xs px-2 py-1">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Press <Badge variant="outline" className="text-xs">?</Badge> to show this dialog
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;