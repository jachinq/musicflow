import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface PaginationProps {
  currentPage: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  showTotal?: boolean;
}

export const Pagination = ({
  currentPage,
  total = 0,
  limit = 10,
  onPageChange,
  showTotal = true,
  className
}: PaginationProps & React.HTMLAttributes<HTMLDivElement>) => {
  if (!total || total <= 0) {
    return null;
  }

  const totalPages = Math.ceil(total / limit);
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const hasFirstEllipsis = startPage > 2;
  const hasLastEllipsis = endPage <= totalPages - 2;
  const hasFirst = startPage > 1;
  const hasLast = endPage < totalPages;
  const [pageList, setPageList] = useState<number[]>([]);

  useEffect(() => {
    const pageList = [];
    for (let i = startPage; i <= endPage; i++) {
      pageList.push(i);
    }
    setPageList(pageList);
  }, [currentPage, limit, total]);

  const handlePrevClick = () => {
    if (currentPage > 1) {
      onPageChange && onPageChange(currentPage - 1);
    }
  };
  const handleNextClick = () => {
    if (currentPage < totalPages) {
      onPageChange && onPageChange(currentPage + 1);
    }
  };
  const handlePageClick = (page: number) => {
    onPageChange && onPageChange(page);
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="flex items-center flex-wrap">
        {
          showTotal && (
            <div className="mr-2 text-sm text-gray-500">
              <span className="ml-2 ">共 {total} 条</span>
              <span className="ml-2 ">{totalPages} 页</span>
            </div>
          )
        }
        {hasPrevious && (
          <PaginationLink onClick={handlePrevClick}>
            <ChevronLeft />
          </PaginationLink>
        )}
        {hasFirst && (
          <PaginationLink
            isActive={1 === currentPage}
            onClick={() => handlePageClick(1)}
          >
            1
          </PaginationLink>
        )}
        {hasFirstEllipsis && <span className="px-2 py-1 ">...</span>}
        {pageList.map((page, index) => (
          <PaginationLink
            key={index}
            className={`px-2 py-1`}
            onClick={() => handlePageClick(page)}
            isActive={currentPage === page}
          >
            {page}
          </PaginationLink>
        ))}
        {hasLastEllipsis && <span className="px-2 py-1 ">...</span>}
        {hasLast && (
          <PaginationLink
            isActive={totalPages === currentPage}
            onClick={() => handlePageClick(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        )}
        {hasNext && (
          <PaginationLink onClick={handleNextClick}>
            <ChevronRight />
          </PaginationLink>
        )}
      </div>
    </div>
  );
};

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  ...props
}: PaginationLinkProps) => (
  <a
    className={`px-2 py-1 rounded-md cursor-pointer  select-none hover:bg-blue-600 ${isActive ? "bg-blue-400" : ""
      } ${className}`}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";
