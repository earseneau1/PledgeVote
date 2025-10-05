import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Vote, Home, Archive, Users, Plus, ChevronDown } from "lucide-react";
import type { User } from "@shared/schema";

export function NavigationHeader() {
  const { user } = useAuth() as { user: User | undefined };
  const [location] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Chapter Name */}
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Vote className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">VoteGreek</h1>
              <p className="text-xs text-muted-foreground">Alpha Beta Chapter</p>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-foreground hover:text-primary font-medium transition-colors flex items-center gap-2 ${location === '/' ? 'text-primary' : ''}`}
              data-testid="link-dashboard"
            >
              <Home size={16} />
              Dashboard
            </Link>
            <Link 
              href="/archive" 
              className={`text-muted-foreground hover:text-primary font-medium transition-colors flex items-center gap-2 ${location === '/archive' ? 'text-primary' : ''}`}
              data-testid="link-archive"
            >
              <Archive size={16} />
              Archive
            </Link>
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center gap-3">
            <Link href="/create-vote">
              <Button 
                className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-new-vote"
              >
                <Plus size={16} className="mr-2" />
                New Vote
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer" data-testid="button-user-menu">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user?.profileImageUrl ? user.profileImageUrl : undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role || 'Member'}
                  </p>
                </div>
                <ChevronDown size={16} className="text-muted-foreground ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/create-vote" className="md:hidden" data-testid="link-create-vote-mobile">
                    <Plus size={16} className="mr-2" />
                    Create Vote
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={() => window.location.href = '/api/logout'} data-testid="button-logout">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
