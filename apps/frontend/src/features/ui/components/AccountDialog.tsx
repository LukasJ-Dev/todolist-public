import {
  useMeQuery,
  useLogoutMutation,
  useGetSessionsQuery,
} from '../../auth/services/authApi';
import { Button } from '../../../components/UI/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/UI/dialog';
import { Separator } from '../../../components/UI/separator';
import { Spinner } from '../../../components/UI/spinner';
import {
  User,
  LogOut,
  Mail,
  Calendar,
  Monitor,
  Smartphone,
  Globe,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountDialog = ({ open, onOpenChange }: AccountDialogProps) => {
  const { data: user, isLoading: userLoading } = useMeQuery();
  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();
  const { data: sessions, isLoading: sessionsLoading } = useGetSessionsQuery({
    limit: 10,
  });

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success('Logged out successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;

    const ua = userAgent.toLowerCase();
    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceName = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device';

    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    return 'Browser';
  };

  if (userLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">Account Holder</p>
              </div>
            </div>

            <Separator />

            {/* User Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {user?.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Active Sessions Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Active Sessions
            </h4>

            {sessionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="h-4 w-4" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading sessions...
                </span>
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.familyId}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-shrink-0">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {getDeviceName(session.userAgent)}
                        </p>
                        {session.active && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.lastUsedAt)}
                        </div>
                        {session.ipAddress && (
                          <span className="truncate">{session.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active sessions found
              </p>
            )}
          </div>

          <Separator />

          {/* Actions Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Account Actions
            </h4>

            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="w-full"
            >
              {logoutLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDialog;
