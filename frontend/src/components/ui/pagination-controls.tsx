import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  totalElements?: number
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalElements,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4 mt-4">
      <div className="flex-1 text-sm text-muted-foreground text-slate-400">
        {totalElements !== undefined ? (
          <>
            Showing <span className="font-medium text-white">{Math.min(pageSize * currentPage + 1, totalElements)}</span> to{' '}
            <span className="font-medium text-white">{Math.min(pageSize * (currentPage + 1), totalElements)}</span> of{' '}
            <span className="font-medium text-white">{totalElements}</span> entries
          </>
        ) : (
          <>
            Page <span className="font-medium text-white">{currentPage + 1}</span> of{' '}
            <span className="font-medium text-white">{Math.max(1, totalPages)}</span>
          </>
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-slate-400">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value: string) => {
              onPageSizeChange(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-slate-800 border-slate-700 text-white">
              {[5, 10, 20, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium text-slate-400">
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4 text-slate-200" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4 text-slate-200" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4 text-slate-200" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4 text-slate-200" />
          </Button>
        </div>
      </div>
    </div>
  )
}
