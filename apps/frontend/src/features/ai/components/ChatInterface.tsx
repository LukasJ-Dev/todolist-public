import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Button } from '../../../components/UI/button';
import { Textarea } from '../../../components/UI/textarea';
import { Card } from '../../../components/UI/card';
import {
  useChatMutation,
  useGetConversationHistoryQuery,
  type ChatMessage,
} from '../services/aiApi';
import { Send, Bot, User, Loader2, Brain } from 'lucide-react';
import { cn } from '../../../lib/utils';
import ToolCallDisplay from './ToolCallDisplay';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MemoryModal from './MemoryModal';

interface ChatInterfaceProps {
  className?: string;
  conversationId?: string;
  onConversationChange?: (conversationId: string | undefined) => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hello! I'm your AI task management assistant. I can help you create tasks, search for tasks, break down complex tasks, and more. What would you like to do?",
  timestamp: new Date().toISOString(),
};

const MAX_INPUT_LENGTH = 2000;

export default function ChatInterface({
  className,
  conversationId: propConversationId,
  onConversationChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [chat, { isLoading }] = useChatMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  // Load conversation history when conversationId changes
  const { data: historyData, isLoading: isLoadingHistory } =
    useGetConversationHistoryQuery(
      { conversationId: propConversationId! },
      { skip: !propConversationId }
    );

  // Reset to initial state when conversationId becomes undefined (new chat)
  useEffect(() => {
    if (!propConversationId) {
      setMessages([INITIAL_MESSAGE]);
    }
  }, [propConversationId]);

  // Update messages when history loads
  useEffect(() => {
    if (
      propConversationId &&
      historyData?.messages &&
      historyData.messages.length > 0
    ) {
      setMessages(historyData.messages);
    }
  }, [historyData, propConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset textarea height when input becomes empty (useLayoutEffect for immediate DOM update)
  useLayoutEffect(() => {
    if (!input && inputRef.current) {
      inputRef.current.style.height = '52px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Immediately reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '52px';
    }

    try {
      const response = await chat({
        message: messageContent,
        conversationId: propConversationId,
      }).unwrap();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        toolCalls: response.toolCalls,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // Update parent with new conversation ID (for new conversations)
      onConversationChange?.(response.conversationId);
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'data' in error &&
        error.data &&
        typeof error.data === 'object' &&
        'message' in error.data &&
        typeof error.data.message === 'string'
          ? error.data.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  return (
    <>
      <Card
        className={cn('flex flex-col h-full p-0 overflow-hidden', className)}
      >
        {/* Header with Memory Button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMemoryModalOpen(true)}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            Memory
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {isLoadingHistory && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading conversation...
              </span>
            </div>
          )}
          {!isLoadingHistory &&
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }: { children?: React.ReactNode }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          ul: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <ul className="mb-2 ml-4 list-disc">{children}</ul>
                          ),
                          ol: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <ol className="mb-2 ml-4 list-decimal">
                              {children}
                            </ol>
                          ),
                          li: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => <li className="mb-1">{children}</li>,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          code: (props: any) => {
                            const { className, children, ...rest } = props;
                            const isInline =
                              !className || !className.includes('language-');
                            return isInline ? (
                              <code
                                className="px-1.5 py-0.5 rounded bg-muted/50 text-sm font-mono"
                                {...rest}
                              >
                                {children}
                              </code>
                            ) : (
                              <code
                                className={cn(
                                  'block p-3 rounded-lg bg-muted/50 text-sm font-mono overflow-x-auto mb-2',
                                  className
                                )}
                                {...rest}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <pre className="mb-2 overflow-x-auto">
                              {children}
                            </pre>
                          ),
                          h1: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">
                              {children}
                            </h3>
                          ),
                          blockquote: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic my-2">
                              {children}
                            </blockquote>
                          ),
                          a: ({
                            children,
                            href,
                          }: {
                            children?: React.ReactNode;
                            href?: string;
                          }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline hover:text-primary/80"
                            >
                              {children}
                            </a>
                          ),
                          strong: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <strong className="font-semibold">
                              {children}
                            </strong>
                          ),
                          em: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => <em className="italic">{children}</em>,
                          hr: () => (
                            <hr className="my-3 border-muted-foreground/30" />
                          ),
                          table: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <div className="overflow-x-auto my-2">
                              <table className="min-w-full border-collapse border border-muted-foreground/30">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <th className="border border-muted-foreground/30 px-2 py-1 bg-muted/50 font-semibold text-left">
                              {children}
                            </th>
                          ),
                          td: ({
                            children,
                          }: {
                            children?: React.ReactNode;
                          }) => (
                            <td className="border border-muted-foreground/30 px-2 py-1">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <ToolCallDisplay toolCalls={message.toolCalls} />
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

          {!isLoadingHistory && isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 p-4">
              <div className="relative flex-1 min-h-[52px] max-h-[200px] overflow-hidden rounded-2xl border border-border bg-muted/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Enforce max length
                    if (newValue.length <= MAX_INPUT_LENGTH) {
                      setInput(newValue);

                      // Reset height if empty, otherwise auto-resize
                      const target = e.target as HTMLTextAreaElement;
                      if (!newValue.trim()) {
                        target.style.height = '52px';
                      } else {
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                      }
                    }
                  }}
                  placeholder="Ask me anything about your tasks..."
                  disabled={isLoading}
                  maxLength={MAX_INPUT_LENGTH}
                  className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs',
                      input.length >= MAX_INPUT_LENGTH
                        ? 'text-destructive'
                        : input.length > MAX_INPUT_LENGTH * 0.9
                          ? 'text-orange-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {input.length}/{MAX_INPUT_LENGTH}
                  </span>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="h-8 w-8 rounded-lg shadow-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Card>

      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </>
  );
}
