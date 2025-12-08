import { useState, useEffect } from 'react';
import {
  GlobalSettings as GlobalSettingsType,
  GlobalRestrictions,
  UserLimits,
} from '../services/adminApi';
import {
  useGetGlobalSettingsQuery,
  useUpdateGlobalRestrictionsMutation,
  useUpdateGlobalLimitsMutation,
} from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { Button } from '../../../components/UI/button';
import { Input } from '../../../components/UI/input';
import { Label } from '../../../components/UI/label';
import { Switch } from '../../../components/UI/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/UI/tabs';
import { Spinner } from '../../../components/UI/spinner';
import { toast } from 'sonner';

interface GlobalSettingsProps {
  password: string;
}

export function GlobalSettings({ password }: GlobalSettingsProps) {
  const [restrictions, setRestrictions] = useState<GlobalRestrictions>({});
  const [limits, setLimits] = useState<UserLimits>({});

  const { data: globalSettings, isLoading } = useGetGlobalSettingsQuery(
    password,
    { skip: !password }
  );

  const [updateRestrictions, { isLoading: isUpdatingRestrictions }] =
    useUpdateGlobalRestrictionsMutation();
  const [updateLimits, { isLoading: isUpdatingLimits }] =
    useUpdateGlobalLimitsMutation();

  useEffect(() => {
    if (globalSettings) {
      setRestrictions(globalSettings.restrictions || {});
      setLimits(globalSettings.limits || {});
    }
  }, [globalSettings]);

  const handleSaveRestrictions = async () => {
    try {
      await updateRestrictions({ restrictions, password }).unwrap();
      toast.success('Global restrictions updated', {
        description: 'Global restrictions have been updated for all users.',
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
          : 'Failed to update global restrictions. Please try again.';
      toast.error('Update failed', {
        description: errorMessage,
      });
    }
  };

  const handleSaveLimits = async () => {
    try {
      await updateLimits({ limits, password }).unwrap();
      toast.success('Global limits updated', {
        description: 'Global limits have been updated for all users.',
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
          : 'Failed to update global limits. Please try again.';
      toast.error('Update failed', {
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>
          Configure restrictions and limits that apply to all users. These
          settings are combined with per-user settings, and the most restrictive
          applies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="restrictions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="restrictions" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="global-ai-disabled">Disable AI</Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent all users from using AI features
                  </p>
                </div>
                <Switch
                  id="global-ai-disabled"
                  checked={restrictions.aiDisabled || false}
                  onCheckedChange={(checked) =>
                    setRestrictions({ ...restrictions, aiDisabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="global-create-todolists-disabled">
                    Disable Creating Todolists
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent all users from creating new todolists
                  </p>
                </div>
                <Switch
                  id="global-create-todolists-disabled"
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
                  <Label htmlFor="global-create-tasks-disabled">
                    Disable Creating Tasks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent all users from creating new tasks
                  </p>
                </div>
                <Switch
                  id="global-create-tasks-disabled"
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
                  <Label htmlFor="global-login-disabled">Disable Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent all users from logging in
                  </p>
                </div>
                <Switch
                  id="global-login-disabled"
                  checked={restrictions.loginDisabled || false}
                  onCheckedChange={(checked) =>
                    setRestrictions({
                      ...restrictions,
                      loginDisabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="global-register-disabled">
                    Disable Register
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent new user registrations
                  </p>
                </div>
                <Switch
                  id="global-register-disabled"
                  checked={restrictions.registerDisabled || false}
                  onCheckedChange={(checked) =>
                    setRestrictions({
                      ...restrictions,
                      registerDisabled: checked,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
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
            </div>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="global-max-todolists">Max Todolists</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="global-max-todolists"
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
                  Maximum number of todolists per user
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="global-max-tasks">Max Tasks</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="global-max-tasks"
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
                  Maximum number of tasks per user
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="global-max-ai-messages">Max AI Messages</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="global-max-ai-messages"
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
                <p className="text-sm text-muted-foreground">
                  Maximum number of AI messages per user
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveLimits} disabled={isUpdatingLimits}>
                {isUpdatingLimits ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Limits'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

