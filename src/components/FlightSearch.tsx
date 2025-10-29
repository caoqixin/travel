'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, SlidersHorizontal } from 'lucide-react'

interface FlightSearchProps {
  onSearch: (destination: string) => void
  onSort: (sortBy: string) => void
  currentSort: string
  loading?: boolean
}

export default function FlightSearch({ onSearch, onSort, currentSort, loading = false }: FlightSearchProps) {
  const [destination, setDestination] = useState('')

  const handleSearch = () => {
    onSearch(destination)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* 搜索框 */}
        <div className="w-full relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索目的地城市..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {/* 排序选择 */}
          <div className="flex-1 sm:max-w-xs">
            <Select value={currentSort} onValueChange={onSort}>
              <SelectTrigger className="w-full">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">价格从低到高</SelectItem>
                <SelectItem value="departure">出发时间</SelectItem>
                <SelectItem value="-price">价格从高到低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "搜索中..." : "搜索"}
          </Button>
        </div>
      </div>
    </div>
  )
}