import type { SaleWithItems } from './src/db/types';
import type { ProductType } from './src/db/ProductsContext';

declare global {
  var SALES_CACHE: {
    data: (SaleWithItems & { saleNumber: number })[];
    getByNumber: (
      saleNumber: number
    ) => (SaleWithItems & { saleNumber: number }) | undefined;
    add: (sale: SaleWithItems) => void;
    clear: () => void;
  };

var PRODUCTS_CACHE: {
  data: ProductType[];
  getById: (id: number) => ProductType | undefined;
  add: (product: ProductType) => void;
  clear: () => void;
};

}

export {};
