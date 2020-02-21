export type Hwid = string;

export interface Notifier {
  server: string;
  channel_id: string;
  url: string;
}

export interface SelectedProfile {
  status: string;
  notifier: Notifier;
  notifierServer: string;
}

export interface MarketFilter {
  sortType?: number;
  sortDirection?: number;
  currency?: number;
  priceFrom?: number;
  priceTo?: number;
  quantityFrom?: number;
  quantityTo?: number;
  conditionFrom?: number;
  conditionTo?: number;
  oneHourExpiration?: boolean;
  removeBartering?: boolean;
  offerOwnerType?: number;
  onlyFunctional?: boolean;
  handbookId?: string;
  linkedSearchId?: string;
  neededSearchId?: string;
}