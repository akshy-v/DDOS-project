
import React from 'react';
import { Separator } from "@/components/ui/separator";
import { ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="w-full animate-fade-in">
      <div className="container px-4 py-6 mx-auto flex items-center justify-between">
        <Link to="/">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-medium tracking-tight">Entropy DDoS Sentinel</h1>
              <p className="text-sm text-muted-foreground">Detect anomalies with information theory</p>
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/" 
            className={`text-sm font-medium ${
              location.pathname === '/' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            } transition-colors`}
          >
            Detection
          </Link>
          <Link 
            to="/history" 
            className={`text-sm font-medium ${
              location.pathname === '/history' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            } transition-colors`}
          >
            History
          </Link>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
        </nav>
      </div>
      <Separator />
    </header>
  );
};

export default Header;
