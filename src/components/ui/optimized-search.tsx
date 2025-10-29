'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Search, X, Clock, MapPin, Plane, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';


interface SearchSuggestion {
  id: string;
  type: 'city' | 'airport' | 'airline' | 'route';
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

interface OptimizedSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showRecentSearches?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
  autoFocus?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OptimizedSearch: React.FC<OptimizedSearchProps> = memo(({
  placeholder = '搜索航班、城市或机场...',
  value = '',
  onChange,
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  loading = false,
  disabled = false,
  className = '',
  showRecentSearches = true,
  maxSuggestions = 8,
  debounceMs = 300,
  autoFocus = false,
  clearable = true,
  size = 'md'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(inputValue, debounceMs);



  // 从localStorage加载最近搜索
  useEffect(() => {
    if (showRecentSearches) {
      try {
        const saved = localStorage.getItem('recent-searches');
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      }
    }
  }, [showRecentSearches]);

  // 保存最近搜索到localStorage
  const saveRecentSearch = useCallback((query: string) => {
    if (!showRecentSearches || !query.trim()) return;

    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }, [recentSearches, showRecentSearches]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    onChange?.(newValue);
  }, [onChange]);

  // 防抖后的搜索
  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch?.(debouncedValue);
    }
  }, [debouncedValue, onSearch, value]);

  // 处理搜索提交
  const handleSearch = useCallback((query?: string) => {
    const searchQuery = query || inputValue;
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      onSearch?.(searchQuery);
      setShowSuggestions(false);
    }
  }, [inputValue, saveRecentSearch, onSearch]);

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setInputValue(suggestion.title);
    setShowSuggestions(false);
    saveRecentSearch(suggestion.title);
    onSuggestionSelect?.(suggestion);
    onChange?.(suggestion.title);
  }, [saveRecentSearch, onSuggestionSelect, onChange]);

  // 处理最近搜索选择
  const handleRecentSearchSelect = useCallback((query: string) => {
    setInputValue(query);
    setShowSuggestions(false);
    onChange?.(query);
    onSearch?.(query);
  }, [onChange, onSearch]);

  // 清空输入
  const handleClear = useCallback(() => {
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onChange?.('');
    inputRef.current?.focus();
  }, [onChange]);

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const totalItems = suggestions.length + (showRecentSearches ? recentSearches.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            const recentIndex = selectedIndex - suggestions.length;
            handleRecentSearchSelect(recentSearches[recentIndex]);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, recentSearches, selectedIndex, handleSuggestionSelect, handleRecentSearchSelect, handleSearch, showRecentSearches]);

  // 处理焦点
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // 延迟隐藏建议，允许点击建议
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  // 获取图标
  const getSuggestionIcon = useCallback((type: SearchSuggestion['type']) => {
    switch (type) {
      case 'city':
        return <MapPin className="h-4 w-4" />;
      case 'airport':
        return <Plane className="h-4 w-4" />;
      case 'airline':
        return <Plane className="h-4 w-4" />;
      case 'route':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  }, []);

  // 尺寸样式
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'h-8 text-sm';
      case 'lg':
        return 'h-12 text-lg';
      default:
        return 'h-10';
    }
  }, [size]);

  // 显示的建议列表
  const displaySuggestions = useMemo(() => {
    return suggestions.slice(0, maxSuggestions);
  }, [suggestions, maxSuggestions]);

  // 显示的最近搜索
  const displayRecentSearches = useMemo(() => {
    if (!showRecentSearches || inputValue.trim()) return [];
    return recentSearches.slice(0, 3);
  }, [showRecentSearches, inputValue, recentSearches]);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            'pl-10',
            clearable && inputValue && 'pr-20',
            !clearable && loading && 'pr-10',
            sizeClasses
          )}
        />
        
        {/* 加载指示器 */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* 清空按钮 */}
        {clearable && inputValue && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 建议下拉列表 */}
      {showSuggestions && (displaySuggestions.length > 0 || displayRecentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {/* 搜索建议 */}
            {displaySuggestions.length > 0 && (
              <div>
                {displaySuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
                      selectedIndex === index && 'bg-blue-50'
                    )}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="text-gray-400">
                      {suggestion.icon || getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-sm text-gray-500 truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* 最近搜索 */}
            {displayRecentSearches.length > 0 && (
              <div>
                {displaySuggestions.length > 0 && (
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                    最近搜索
                  </div>
                )}
                {displayRecentSearches.map((query, index) => (
                  <div
                    key={query}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
                      selectedIndex === displaySuggestions.length + index && 'bg-blue-50'
                    )}
                    onClick={() => handleRecentSearchSelect(query)}
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 text-gray-700 truncate">
                      {query}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

OptimizedSearch.displayName = 'OptimizedSearch';

export default OptimizedSearch;