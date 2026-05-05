import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import styles from './SpotlightSearch.module.css';

export default function SpotlightSearch({ onSearch, results, isSearching, onSelect }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, onSearch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    if (item.type === 'stock') {
      onSelect(item.code);
      setQuery('');
      setIsFocused(false);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={clsx(styles.searchBar, isFocused && styles.focused, 'animate-slide-down')}>
        <Search className={styles.icon} size={20} />
        <input
          className={styles.input}
          placeholder="종목명, 테마, 용어 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {isSearching && <Loader2 className={clsx(styles.icon, styles.spin)} size={20} />}
      </div>

      {isFocused && (query.length > 0 || results?.length > 0) && (
        <div className={styles.dropdown}>
          {results && results.length > 0 ? (
            <ul className={styles.list}>
              {results.map(item => (
                <li key={item.id} className={styles.item} onClick={() => handleSelect(item)}>
                  <div className={styles.itemIcon}>
                    {item.type === 'term' ? (
                      <BookOpen size={18} className={styles.termIcon} />
                    ) : parseFloat(item.changeRate) > 0 ? (
                      <TrendingUp size={18} className={styles.posIcon} />
                    ) : (
                      <TrendingDown size={18} className={styles.negIcon} />
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitleGroup}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemCode}>{item.code}</span>
                    </div>
                    <p className={styles.itemDesc}>{item.beginnerLine}</p>
                  </div>
                  {item.type !== 'term' && (
                    <div className={clsx(styles.itemRate, parseFloat(item.changeRate) > 0 ? styles.posText : styles.negText)}>
                      {item.changeRate}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !isSearching && query.length > 0 && (
              <div className={styles.empty}>검색 결과가 없습니다.</div>
            )
          )}
        </div>
      )}
    </div>
  );
}
