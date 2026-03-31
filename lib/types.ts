export type Borough =
  | 'Manhattan'
  | 'Brooklyn'
  | 'Queens'
  | 'Bronx'
  | 'Staten Island'
  | 'Jersey City'
  | 'Hoboken'
  | 'NJ Hudson County';

export const BOROUGHS: Borough[] = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
  'Jersey City',
  'Hoboken',
  'NJ Hudson County',
];

export type RentalType = 'entire' | 'room';
export type RoomType = 'master' | 'secondary' | 'living';
export type FurnishedType = 'full' | 'partial' | 'none';
export type ParkingType = 'none' | 'free' | 'paid';
export type PetsType = 'yes' | 'no' | 'negotiable';
export type RoommateGender = 'female' | 'male' | 'mixed';

export interface Listing {
  id: string;
  title: string;
  description: string;
  rentalType: RentalType;
  roomType?: RoomType;
  layout: string; // 'Studio' | '1B1B' | '2B1B' | '2B2B' | '3B1B' | '3B2B' | '3B3B' | 'Other'

  // Location
  address: string;
  zip: string;
  neighborhood: string;
  borough: Borough;

  // Dates
  availableFrom: string; // YYYY-MM-DD
  availableTo: string;   // YYYY-MM-DD
  flexibleDates: boolean;

  // Pricing
  monthlyPrice?: number;
  monthlyNegotiable: boolean;
  dailyPrice?: number;
  dailyNegotiable: boolean;

  // Utilities
  utilitiesIncluded: boolean;
  utilitiesCost?: number;
  utilitiesUnit?: 'monthly' | 'daily';

  // Deposit — monthly
  depositMonthlyMode?: 'convention' | 'custom';
  depositMonthlyConvention?: 'none' | 'one_plus_one';
  depositMonthlyAmount?: number;

  // Deposit — daily
  depositDailyMode?: 'fixed' | 'percent' | 'none';
  depositDailyAmount?: number;
  depositDailyPercent?: number;

  // Property details
  furnished: FurnishedType;
  furnitureDetails?: string;
  parking: ParkingType;
  parkingFee?: number;
  pets: PetsType;

  // Room-specific (only when rentalType === 'room')
  roommatesCount?: number;
  roommatesGender?: RoommateGender;
  sharedBathroom?: 'shared' | 'private';
  hasPartition?: boolean; // living room only
  hasWindow?: boolean;    // living room only

  // Media
  images: string[];

  // Contact (all optional)
  wechat?: string;
  phone?: string;
  email?: string;

  // Meta
  postedAt: string; // ISO datetime
}
