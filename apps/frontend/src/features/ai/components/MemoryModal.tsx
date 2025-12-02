import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/UI/dialog';
import { Button } from '../../../components/UI/button';
import { Badge } from '../../../components/UI/badge';
import { useGetMemoriesQuery, type UserMemory } from '../services/aiApi';
import { Loader2, Brain } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryColors = {
  preference: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  fact: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pattern: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  context: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

const categoryLabels = {
  preference: 'Preference',
  fact: 'Fact',
  pattern: 'Pattern',
  context: 'Context',
};

export default function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    'preference' | 'fact' | 'pattern' | 'context' | 'all'
  >('all');

  const { data, isLoading, error } = useGetMemoriesQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const memories = data?.memories || [];

  const groupedMemories = memories.reduce(
    (acc, memory) => {
      if (!acc[memory.category]) {
        acc[memory.category] = [];
      }
      acc[memory.category].push(memory);
      return acc;
    },
    {} as Record<string, UserMemory[]>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Memory
          </DialogTitle>
          <DialogDescription>
            View what the AI remembers about you across conversations
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {(['preference', 'fact', 'pattern', 'context'] as const).map(
            (category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {categoryLabels[category]}
              </Button>
            )
          )}
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Failed to load memories
            </div>
          )}

          {!isLoading && !error && memories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No memories found. The AI will remember things as you chat!
            </div>
          )}

          {!isLoading &&
            !error &&
            memories.length > 0 &&
            (selectedCategory === 'all'
              ? Object.entries(groupedMemories).map(([category, mems]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </h3>
                    <div className="space-y-2">
                      {mems.map((memory) => (
                        <MemoryCard key={memory.id} memory={memory} />
                      ))}
                    </div>
                  </div>
                ))
              : groupedMemories[selectedCategory]?.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                )) || (
                  <div className="text-center py-4 text-muted-foreground">
                    No {categoryLabels[selectedCategory]} memories found
                  </div>
                ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemoryCard({ memory }: { memory: UserMemory }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn('text-xs', categoryColors[memory.category])}>
              {categoryLabels[memory.category]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(memory.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm">{memory.value}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {new Date(memory.lastUpdated).toLocaleDateString()}
            {memory.accessCount > 0 && (
              <> • Accessed {memory.accessCount} times</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
