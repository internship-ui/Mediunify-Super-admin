import { sleep } from '@/lib/utils';
import { mockDataProvider } from '../mock/MockDataProvider';

export function createRepository(collectionKey, initialGetter) {
  return {
    async getAll(filters = {}, pagination = { page: 1, pageSize: 50 }) {
      await sleep(100);
      let list = initialGetter();

      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        list = list.filter((item) => {
          return Object.values(item).some((val) => {
            if (typeof val === 'string') return val.toLowerCase().includes(query);
            if (typeof val === 'number') return val.toString().includes(query);
            return false;
          });
        });
      }

      // Status filter
      if (filters.status && filters.status !== 'All') {
        list = list.filter((item) => item.status === filters.status);
      }

      // City filter
      if (filters.city && filters.city !== 'All Cities' && filters.city !== 'All') {
        list = list.filter((item) => {
          if (item.city) return item.city === filters.city;
          if (item.address && item.address.city) return item.address.city === filters.city;
          return true;
        });
      }

      // Category filter
      if (filters.category && filters.category !== 'All') {
        list = list.filter((item) => item.category === filters.category || item.specialization === filters.category);
      }

      const total = list.length;
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const paginatedData = list.slice(startIndex, startIndex + pageSize);

      return {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },

    async getById(id) {
      await sleep(50);
      const list = initialGetter();
      return list.find((item) => item.id === id) || null;
    },

    async create(data) {
      await sleep(150);
      const list = initialGetter();
      const newItem = {
        id: `${collectionKey}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      const updatedList = [newItem, ...list];
      mockDataProvider.setCollection(collectionKey, updatedList);
      return newItem;
    },

    async update(id, updates) {
      await sleep(150);
      const list = initialGetter();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`Record with id ${id} not found`);
      }
      const updatedItem = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      list[index] = updatedItem;
      mockDataProvider.setCollection(collectionKey, list);
      return updatedItem;
    },

    async delete(id) {
      await sleep(100);
      const list = initialGetter();
      const updatedList = list.filter((item) => item.id !== id);
      mockDataProvider.setCollection(collectionKey, updatedList);
      return true;
    },
  };
}
