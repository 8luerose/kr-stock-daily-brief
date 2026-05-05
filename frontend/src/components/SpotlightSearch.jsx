import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, BookOpen, MessageSquare, Zap } from 'lucide-react';
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

  const showResults = query.length > 0 && results?.length > 0;
  const showEmptyState = isFocused && !showResults;

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

      {isFocused && (
        <div className={styles.dropdown}>
          {showResults ? (
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
          ) : showEmptyState ? (
            <div className={styles.emptyState}>
              {!isSearching && query.length > 0 && (
                <div className={styles.emptyMessage}>'{query}'에 대한 검색 결과가 없습니다.</div>
              )}
              <div className={styles.recommendationSection}>
                <h4 className={styles.recTitle}><Zap size={14} /> 오늘 움직인 테마 & 종목</h4>
                <div className={styles.chips}>
                  <button className={styles.chip} onClick={() => { setQuery('반도체'); onSearch('반도체'); }}>반도체 장비</button>
                  <button className={styles.chip} onClick={() => { setQuery('이차전지'); onSearch('이차전지'); }}>이차전지</button>
                  <button className={styles.chip} onClick={() => { setQuery('005930'); onSelect('005930'); setIsFocused(false); }}>삼성전자</button>
                </div>
              </div>
              <div className={styles.askAiSection}>
                <button className={styles.askAiBtn}>
                  <MessageSquare size={16} /> AI에게 '{query || '주식 기초'}'에 대해 물어보기
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
