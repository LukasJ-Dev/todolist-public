import { useState } from 'react';
import { useMeQuery, useLogoutMutation } from '../../auth/services/authApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/UI/dropdown-menu';
import { Button } from '../../../components/UI/button';
import { Spinner } from '../../../components/UI/spinner';
import { User, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AccountDialog from './AccountDialog';

export default function AccountSection() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: user, isLoading } = useMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const navigate = useNavigate();

  const handleAccountSettings = () => {
    setDialogOpen(true);
    setDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Failed to logout. Please try again.';
      toast.error('Logout failed', {
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Spinner size="sm" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDropdownOpenChange = (newOpen: boolean) => {
    setDropdownOpen(newOpen);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger>
          {' '}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 p-2 h-auto text-left"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAccountSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600"
          >
            {isLoggingOut ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
