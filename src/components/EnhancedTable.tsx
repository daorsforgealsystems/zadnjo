import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  className?: string;
  // Optional compatibility props
  pagination?: { pageSize: number };
  onRowClick?: (row: T) => void;
  isRowSelected?: (row: T) => boolean;
  isLoading?: boolean;
}

const EnhancedTable = <T extends object>({
  data,
  columns,
  itemsPerPage = 10,
  className,
  pagination,
  onRowClick,
  isRowSelected,
  isLoading,
}: EnhancedTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const effectivePageSize = pagination?.pageSize ?? itemsPerPage;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * effectivePageSize;
    return sortedData.slice(startIndex, startIndex + effectivePageSize);
  }, [sortedData, currentPage, effectivePageSize]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const rowVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Adjust this to your average row height
  });

  const handleSort = (key: keyof T) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(prev => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const renderSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) return null;

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  };

  const renderCell = (row: T, column: Column<T>) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value?.toString() || '';
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div ref={parentRef} className="rounded-md border overflow-auto h-[600px]">
        <Table style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key as string}
                  className={cn(
                    column.sortable && "cursor-pointer hover:bg-muted",
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = paginatedData[virtualRow.index];
              const possibleId = (row as unknown as { id?: string | number }).id;
              const rowKey = (typeof possibleId === 'string' || typeof possibleId === 'number') ? possibleId : virtualRow.index;
              const selected = isRowSelected ? isRowSelected(row) : false;
              return (
                <TableRow
                  key={rowKey}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn('cursor-pointer hover:bg-muted/50', selected && 'ring-2 ring-primary')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={`${rowKey}-${column.key as string}`}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              
              // Show first, last, current, and surrounding pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis for gaps
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={`ellipsis-${page}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              return null;
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default EnhancedTable;
