import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import styles from './SearchCenter.module.css';
import clsx from 'clsx';

export default function SearchCenter({ onSearch, results, isSearching, onSelect }) {
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
      <div className={clsx(styles.inputWrapper, isFocused && styles.focused)}>
        <Search className={styles.icon} size={20} />
        <input
          type="text"
          placeholder="어떤 주식이 궁금하신가요? (예: 삼성전자, 반도체)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={styles.input}
        />
        {isSearching && <Loader2 className={clsx(styles.icon, styles.spin)} size={20} />}
      </div>

      {isFocused && (query.length > 0 || results?.length > 0) && (
        <div className={clsx(styles.dropdown, 'animate-slide-up')}>
          {results && results.length > 0 ? (
            <ul className={styles.list}>
              {results.map((item) => (
                <li 
                  key={item.id} 
                  className={styles.listItem}
                  onClick={() => handleSelect(item)}
                >
                  <div className={styles.itemMain}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemName}>{item.title || item.name}</span>
                      <span className={styles.itemCode}>{item.code}</span>
                      <span className={clsx(
                        styles.badge, 
                        item.type === 'term' ? styles.badgeNeutral : 
                        parseFloat(item.changeRate) > 0 ? styles.badgePos : styles.badgeNeg
                      )}>
                        {item.type === 'term' ? '용어' : item.changeRate}
                      </span>
                    </div>
                    <p className={styles.itemDesc}>{item.beginnerLine}</p>
                  </div>
                  <ArrowRight size={16} className={styles.itemArrow} />
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
