import { useState, useEffect } from 'react';
import { UserWithStats, UserRestrictions, UserLimits } from '../services/adminApi';
import {
  useGetUserRestrictionsQuery,
  useUpdateUserRestrictionsMutation,
  useGetUserLimitsQuery,
  useUpdateUserLimitsMutation,
} from '../services/adminApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/UI/dialog';
import { Button } from '../../../components/UI/button';
import { Input } from '../../../components/UI/input';
import { Label } from '../../../components/UI/label';
import { Switch } from '../../../components/UI/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/UI/tabs';
import { Spinner } from '../../../components/UI/spinner';
import { toast } from 'sonner';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithStats;
  password: string;
}

export function UserSettingsDialog({
  open,
  onOpenChange,
  user,
  password,
}: UserSettingsDialogProps) {
  const [restrictions, setRestrictions] = useState<UserRestrictions>({});
  const [limits, setLimits] = useState<UserLimits>({});

  const { data: userRestrictions, isLoading: restrictionsLoading } =
    useGetUserRestrictionsQuery(
      { userId: user.id, password },
      { skip: !open || !password }
    );

  const { data: userLimits, isLoading: limitsLoading } = useGetUserLimitsQuery(
    { userId: user.id, password },
    { skip: !open || !password }
  );

  const [updateRestrictions, { isLoading: isUpdatingRestrictions }] =
    useUpdateUserRestrictionsMutation();
  const [updateLimits, { isLoading: isUpdatingLimits }] =
    useUpdateUserLimitsMutation();

  useEffect(() => {
    if (userRestrictions) {
      setRestrictions(userRestrictions);
    }
  }, [userRestrictions]);

  useEffect(() => {
    if (userLimits) {
      setLimits(userLimits);
    }
  }, [userLimits]);

  const handleSaveRestrictions = async () => {
    try {
      await updateRestrictions({
        userId: user.id,
        restrictions,
        password,
      }).unwrap();
      toast.success('Restrictions updated', {
        description: `Restrictions for ${user.name} have been updated.`,
      });
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
          : 'Failed to update restrictions. Please try again.';
      toast.error('Update failed', {
        description: errorMessage,
      });
    }
  };

  const handleSaveLimits = async () => {
    try {
      await updateLimits({
        userId: user.id,
        limits,
        password,
      }).unwrap();
      toast.success('Limits updated', {
        description: `Limits for ${user.name} have been updated.`,
      });
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
          : 'Failed to update limits. Please try again.';
      toast.error('Update failed', {
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Settings: {user.name}</DialogTitle>
          <DialogDescription>
            Manage restrictions and limits for {user.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="restrictions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="restrictions" className="space-y-4">
            {restrictionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-disabled">Disable AI</Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent user from using AI features
                      </p>
                    </div>
                    <Switch
                      id="ai-disabled"
                      checked={restrictions.aiDisabled || false}
                      onCheckedChange={(checked) =>
                        setRestrictions({ ...restrictions, aiDisabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="create-todolists-disabled">
                        Disable Creating Todolists
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent user from creating new todolists
                      </p>
                    </div>
                    <Switch
                      id="create-todolists-disabled"
                      checked={restrictions.createTodolistsDisabled || false}
                      onCheckedChange={(checked) =>
                        setRestrictions({
                          ...restrictions,
                          createTodolistsDisabled: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="create-tasks-disabled">
                        Disable Creating Tasks
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent user from creating new tasks
                      </p>
                    </div>
                    <Switch
                      id="create-tasks-disabled"
                      checked={restrictions.createTasksDisabled || false}
                      onCheckedChange={(checked) =>
                        setRestrictions({
                          ...restrictions,
                          createTasksDisabled: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="login-disabled">Disable Login</Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent user from logging in
                      </p>
                    </div>
                    <Switch
                      id="login-disabled"
                      checked={restrictions.loginDisabled || false}
                      onCheckedChange={(checked) =>
                        setRestrictions({
                          ...restrictions,
                          loginDisabled: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isUpdatingRestrictions}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRestrictions}
                    disabled={isUpdatingRestrictions}
                  >
                    {isUpdatingRestrictions ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Restrictions'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            {limitsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-todolists">Max Todolists</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="max-todolists"
                        type="number"
                        min="0"
                        placeholder="No limit"
                        value={limits.maxTodolists || ''}
                        onChange={(e) =>
                          setLimits({
                            ...limits,
                            maxTodolists: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          })
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { maxTodolists, ...rest } = limits;
                          setLimits(rest);
                        }}
                        disabled={!limits.maxTodolists}
                      >
                        Clear
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current: {user.todolistCount} todolists
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tasks">Max Tasks</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="max-tasks"
                        type="number"
                        min="0"
                        placeholder="No limit"
                        value={limits.maxTasks || ''}
                        onChange={(e) =>
                          setLimits({
                            ...limits,
                            maxTasks: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          })
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { maxTasks, ...rest } = limits;
                          setLimits(rest);
                        }}
                        disabled={!limits.maxTasks}
                      >
                        Clear
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current: {user.taskCount} tasks
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-ai-messages">Max AI Messages</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="max-ai-messages"
                        type="number"
                        min="0"
                        placeholder="No limit"
                        value={limits.maxAIMessages || ''}
                        onChange={(e) =>
                          setLimits({
                            ...limits,
                            maxAIMessages: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          })
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { maxAIMessages, ...rest } = limits;
                          setLimits(rest);
                        }}
                        disabled={!limits.maxAIMessages}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isUpdatingLimits}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveLimits}
                    disabled={isUpdatingLimits}
                  >
                    {isUpdatingLimits ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Limits'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

