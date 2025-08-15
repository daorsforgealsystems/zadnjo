import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import daorsforgeLogo from "@/assets/daorsforge-new-logo.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  linkTo?: string | null;
}

const Logo = ({ size = "md", showText = true, className, linkTo = "/" }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const logoContent = (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <img 
          src={daorsforgeLogo} 
          alt="DAORSFORGE AI Systems" 
          className={cn(
            "rounded-lg object-cover transition-all duration-300",
            sizeClasses[size]
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-lg"></div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent",
            textSizeClasses[size]
          )}>
            DAORSFORGE
          </span>
          <span className="text-xs text-muted-foreground -mt-1">
            AI Systems
          </span>
        </div>
      )}
    </div>
  );

  if (linkTo && linkTo !== "") {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default Logo;