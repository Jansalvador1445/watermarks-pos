import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

export function useSearchFromUrl(paramName = 'search') {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get(paramName) || '';
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  return { search, setSearch, debouncedSearch };
}
