// API Types
export interface APIKeys {
  googleMaps: string;
  weather: string;
  openai: string;
  rapidapi: string;
}

export interface APIEndpoints {
  googleMaps: string;
  googlePlaces: string;
  googleDirections: string;
  weather: string;
  flights: string;
  hotels: string;
  carRental: string;
  attractions: string;
}

// Trip Types
export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  preferences?: UserPreferences;
  itinerary?: DayItinerary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DayItinerary {
  day: number;
  activities: Activity[];
  meals?: Meal[];
  accommodation?: Accommodation;
}

export interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'event';
  startTime: string;
  endTime: string;
  location: Location;
  description?: string;
  images?: string[];
  rating?: number;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  time: string;
  restaurant: Restaurant;
}

export interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'apartment' | 'resort';
  checkIn: Date;
  checkOut: Date;
  location: Location;
  pricePerNight: number;
  rating: number;
  images: string[];
}

// Destination Types
export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  images: string[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  hotels: Hotel[];
  weather?: WeatherInfo;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Attraction {
  id: string;
  name: string;
  type: string;
  description: string;
  images: string[];
  location: Location;
  rating: number;
  reviews: Review[];
  openingHours?: string;
  ticketPrice?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: Location;
  rating: number;
  priceRange: string; // '$' | '$$' | '$$$' | '$$$$'
  images: string[];
  reviews: Review[];
}

export interface Hotel {
  id: string;
  name: string;
  location: Location;
  rating: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  reviews: Review[];
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: Date;
}

// User Preferences
export interface UserPreferences {
  budget: 'low' | 'medium' | 'high' | 'luxury';
  pace: 'relaxed' | 'moderate' | 'fast';
  interests: string[];
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  accommodationType?: string;
  cuisine?: string[];
  language?: string;
}

// Booking Types
export interface BookingData {
  serviceType: 'flights' | 'hotels' | 'cars' | 'package';
  destination: string;
  destinationCountry: string;
  startDate?: Date;
  endDate?: Date;
  adults: number;
  children: number;
  fullName: string;
  email: string;
  phone: string;
  paymentMethod: 'credit' | 'paypal' | 'transfer';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

// Weather Types
export interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  icon: string;
}

export interface WeatherForecast extends WeatherInfo {
  date: Date;
  high: number;
  low: number;
}

// AI Recommendation Types
export interface AIRecommendation {
  attractions: Attraction[];
  restaurants: Restaurant[];
  itinerary: string;
  estimatedCost: number;
}

export interface SmartAdvice {
  evaluation: string;
  improvements: string[];
  warnings: string[];
  tips: string[];
}

// Route Types
export interface RouteInfo {
  origin: Location;
  destination: Location;
  distance: number;
  duration: string;
  polyline: string;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: string;
}

// Price Comparison
export interface PriceOption {
  provider: string;
  price: number;
  currency: string;
  link: string;
  rating?: number;
}

export interface PriceComparison {
  item: string;
  options: PriceOption[];
  lowestPrice: PriceOption;
  highestPrice: PriceOption;
  avgPrice: number;
}

// Flight Types
export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  from: string;
  to: string;
  price: number;
  seats: number;
  aircraft: string;
}

// Car Rental Types
export interface CarRental {
  id: string;
  company: string;
  carModel: string;
  pricePerDay: number;
  carType: string;
  seats: number;
  transmission: 'automatic' | 'manual';
}

// Error Types
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}
