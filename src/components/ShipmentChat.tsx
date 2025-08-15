import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatMessages, postChatMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';

interface ShipmentChatProps {
  shipmentId: string;
}

const ShipmentChat = ({ shipmentId }: ShipmentChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['chat', shipmentId],
    queryFn: () => getChatMessages(shipmentId),
  });

  const mutation = useMutation<ChatMessage, Error, string, { previousMessages: ChatMessage[] | undefined }>({
    mutationFn: (messageText: string) => postChatMessage({
      shipmentId,
      userId: user?.id || 'unknown-user',
      username: user?.username || 'Unknown User',
      message: messageText,
    }),
    onMutate: async (newMessageText) => {
      await queryClient.cancelQueries({ queryKey: ['chat', shipmentId] });
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat', shipmentId]);

      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        shipmentId,
        userId: user!.id,
        username: user!.username,
        message: newMessageText,
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(['chat', shipmentId], (old = []) => [...old, optimisticMessage]);

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', shipmentId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', shipmentId] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      mutation.mutate(newMessage.trim());
      setNewMessage('');
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'flex items-end gap-2',
                msg.userId === user?.id ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'p-3 rounded-lg max-w-xs lg:max-w-md',
                  msg.userId === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm font-bold">{msg.username}</p>
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs text-right opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <Button type="submit" disabled={mutation.isPending || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ShipmentChat;
