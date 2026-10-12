'use client';

import { useState, useMemo } from 'react';

export function useLocalFilters(initialData = [], options = {}) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState(options.defaultSortField || 'createdAt');
  const [sortDirection, setSortDirection] = useState(options.defaultSortDirection || 'desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options.pageSize || 10);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((item) =>
        Object.values(item).some((val) => {
          if (typeof val === 'string') return val.toLowerCase().includes(q);
          if (typeof val === 'number') return val.toString().includes(q);
          return false;
        })
      );
    }

    // Status
    if (statusFilter !== 'All') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // City
    if (cityFilter !== 'All Cities' && cityFilter !== 'All') {
      result = result.filter((item) => {
        if (item.city) return item.city === cityFilter;
        if (item.address && item.address.city) return item.address.city === cityFilter;
        return true;
      });
    }

    // Category
    if (categoryFilter !== 'All') {
      result = result.filter((item) => item.category === categoryFilter || item.specialization === categoryFilter);
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comp = valA > valB ? 1 : -1;
        return sortDirection === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, search, statusFilter, cityFilter, categoryFilter, sortField, sortDirection]);

  // Paginated data
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return {
    data,
    setData,
    filteredData,
    paginatedData,
    totalRecords: filteredData.length,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    categoryFilter,
    setCategoryFilter,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    resetFilters: () => {
      setSearch('');
      setStatusFilter('All');
      setCityFilter('All Cities');
      setCategoryFilter('All');
      setPage(1);
    },
  };
}
