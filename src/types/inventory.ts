export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorder_level: number;
  unit_cost: number;
  selling_price: number;
  supplier: string;
  location: string;
  status: StockStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type InventoryFormData = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;

export interface SqlQueryLog {
  id: string;
  timestamp: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  query: string;
  bindings?: (string | number)[];
  executionTimeMs: number;
  eloquentEquivalent: string;
}

export type SortField = 'name' | 'quantity' | 'selling_price' | 'created_at' | 'unit_cost' | 'sku';
export type SortDirection = 'asc' | 'desc';
