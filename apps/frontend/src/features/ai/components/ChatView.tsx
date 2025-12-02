import { useState } from 'react';
import ChatInterface from './ChatInterface';
import ConversationSidebar from './ConversationSidebar';

export default function ChatView() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(undefined);

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
  };

  return (
    <div className="flex flex-col h-dvh w-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-semibold">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask me to create tasks, search for tasks, break down complex tasks,
          and more.
        </p>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden">
          <ChatInterface
            className="h-full"
            conversationId={selectedConversationId}
            onConversationChange={setSelectedConversationId}
          />
        </div>
        <ConversationSidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={handleNewConversation}
        />
      </div>
    </div>
  );
}
