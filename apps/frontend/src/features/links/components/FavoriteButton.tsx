import { Star } from 'lucide-react';
import { useToggleFavorite } from '../api/useToggleFavorite';
import type { LinkItem } from '../api/useGetLinks';

interface FavoriteButtonProps {
  link: LinkItem;
}

export function FavoriteButton({ link }: FavoriteButtonProps) {
  const toggleFavorite = useToggleFavorite(link.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // We cannot favorite a deleted link, though it shouldn't render here anyway.
    if (link.status === 'DELETED') return;
    
    toggleFavorite.mutate(!link.isFavorite);
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleFavorite.isPending || link.status === 'DELETED'}
      className="p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
      title={link.isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star 
        className={`w-5 h-5 transition-all ${
          link.isFavorite 
            ? 'fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500' 
            : 'text-gray-400 hover:text-yellow-400 hover:fill-yellow-100'
        }`} 
      />
    </button>
  );
}
