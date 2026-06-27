import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const onPageChange = useCallback((newPage: number, newLimit?: number) => {
    setPage(newPage);
    if (newLimit) setLimit(newLimit);
  }, []);

  const reset = useCallback(() => setPage(1), []);

  return { page, limit, setPage, setLimit, onPageChange, reset };
};
