import { useState, useRef, useEffect } from "react";
import { Send, Bot, Mic, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! I'm a friendly chatbot. How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const newMessages = [...messages, { from: "user", text: inputValue }];
    setMessages(newMessages);
    setInputValue("");

    // Placeholder for Perplexity API call
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: "bot", text: "This is a placeholder response from the bot." },
      ]);
    }, 1000);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 w-16 h-16 rounded-full shadow-lg z-50"
        onClick={toggleChat}
      >
        <Bot className="h-8 w-8" />
      </Button>
      <div
        className={cn(
          "fixed bottom-24 right-4 w-96 bg-card rounded-lg shadow-xl z-50 transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Funny Chatbot</span>
              <Button variant="ghost" size="icon" onClick={toggleChat}>
                <CornerDownLeft className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-96" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-end gap-2",
                      message.from === "bot" ? "justify-start" : "justify-end"
                    )}
                  >
                    {message.from === "bot" && <Bot className="h-6 w-6" />}
                    <div
                      className={cn(
                        "p-2 rounded-lg max-w-xs",
                        message.from === "bot"
                          ? "bg-muted"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Chatbot;
