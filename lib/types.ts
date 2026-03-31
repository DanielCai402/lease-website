export type Borough = 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number; // per month
  availableFrom: string; // ISO date string
  availableTo?: string;
  borough: Borough;
  neighborhood: string;
  zipCode?: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  images: string[];
  videoUrl?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  postedAt: string; // ISO date string
  amenities: string[];
}
