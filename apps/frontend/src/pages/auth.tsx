import { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/UI/tabs';
import { useLocation } from 'react-router-dom';
import AuthLayout from '../features/auth/components/AuthLayout';
import SigninForm from '../features/auth/components/SigninForm';
import SignupForm from '../features/auth/components/SignupForm';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signin');
  const location = useLocation();

  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('signin');
    }
  }, [location.pathname]);

  return (
    <AuthLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <SigninForm />
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
