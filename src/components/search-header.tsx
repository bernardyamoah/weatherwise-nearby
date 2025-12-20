"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { Search, X } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect, useState } from "react"

export function SearchHeader() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false })
  )
  const [inputValue, setInputValue] = useState(search)
  const debouncedValue = useDebounce(inputValue, 500)

  useEffect(() => {
    setSearch(debouncedValue || null)
  }, [debouncedValue, setSearch])

  const handleClear = () => {
    setInputValue("")
    setSearch(null)
  }

  return (
    <div className="relative w-full max-w-sm flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search places..."
          className="pl-8 pr-10 w-full"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  )
}
