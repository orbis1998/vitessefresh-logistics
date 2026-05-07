import { useState } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
}

const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholder = "/api/placeholder/400/300",
  aspectRatio = "wide"
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video", 
    portrait: "aspect-[3/4]",
    wide: "aspect-[16/9]"
  };

  return (
    <div className={cn("relative overflow-hidden", aspectRatioClasses[aspectRatio], className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          <img 
            src={placeholder} 
            alt="" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      )}
      
      {/* Main Image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export default LazyImage;
