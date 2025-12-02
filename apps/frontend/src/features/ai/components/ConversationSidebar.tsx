import { useState } from 'react';
import { Button } from '../../../components/UI/button';
import {
  useListConversationsQuery,
  useDeleteConversationMutation,
} from '../services/aiApi';
import { Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSidebarProps {
  selectedConversationId: string | undefined;
  onSelectConversation: (conversationId: string | undefined) => void;
  onNewConversation: () => void;
  className?: string;
}

export default function ConversationSidebar({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  className,
}: ConversationSidebarProps) {
  const { data, isLoading } = useListConversationsQuery();
  const [deleteConversation] = useDeleteConversationMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      setDeletingId(conversationId);
      try {
        await deleteConversation({ conversationId }).unwrap();
        // If we deleted the selected conversation, switch to new
        if (selectedConversationId === conversationId) {
          onSelectConversation(undefined);
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const conversations = data?.conversations || [];

  return (
    <div
      className={cn(
        'flex flex-col h-full border-l bg-muted/30 w-64 flex-shrink-0',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          onClick={onNewConversation}
          className="w-full"
          size="sm"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => {
              const isSelected =
                selectedConversationId === conversation.conversationId;
              const isDeleting = deletingId === conversation.conversationId;

              return (
                <div
                  key={conversation.conversationId}
                  className={cn(
                    'group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() =>
                    onSelectConversation(conversation.conversationId)
                  }
                >
                  <MessageSquare
                    className={cn(
                      'w-4 h-4 mt-0.5 flex-shrink-0',
                      isSelected
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        isSelected
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      )}
                    >
                      {conversation.preview ||
                        `Conversation (${conversation.messageCount} messages)`}
                    </p>
                    {conversation.lastMessageAt && (
                      <p
                        className={cn(
                          'text-xs mt-0.5',
                          isSelected
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatDistanceToNow(
                          new Date(conversation.lastMessageAt),
                          { addSuffix: true }
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) =>
                      handleDelete(e, conversation.conversationId)
                    }
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 flex-shrink-0',
                      isDeleting && 'opacity-100'
                    )}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin text-destructive" />
                    ) : (
                      <Trash2
                        className={cn(
                          'w-3 h-3',
                          isSelected
                            ? 'text-primary-foreground/70 hover:text-primary-foreground'
                            : 'text-muted-foreground hover:text-destructive'
                        )}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
