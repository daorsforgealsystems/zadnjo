import React, { useState } from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string }

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help you track packages, find routes, or answer portal questions.' }
  ]);
  const [input, setInput] = useState('');

  const onSend = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', content: input.trim() }, { role: 'assistant', content: `Echo: ${input.trim()}` }]);
    setInput('');
  };

  return (
    <ResponsiveLayout>
      <div className="p-6">
        <Card className="max-w-3xl mx-auto glass">
          <CardHeader>
            <CardTitle>Chatbot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pb-2">
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-primary/10 ml-auto max-w-[80%]' : 'bg-muted max-w-[85%]'} `}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about shipments, routes, invoices..." onKeyDown={(e) => e.key === 'Enter' && onSend()} />
              <Button onClick={onSend}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default Chatbot;