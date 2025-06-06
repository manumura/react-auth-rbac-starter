export const Pagination = ({
  currentPage,
  totalElements,
  onPageSelect,
  rowsPerPage,
}: {
  readonly currentPage: number;
  readonly totalElements: number;
  readonly onPageSelect: (page: number) => void;
  readonly rowsPerPage: number;
}) => {
  const lastPage = Math.ceil(totalElements / rowsPerPage);
  const canGoToPreviousPage = currentPage > 1;
  const canGoToNextPage = currentPage < lastPage;
  const previousPage = currentPage > 1 ? currentPage - 1 : 1;
  const nextPage = previousPage < lastPage ? +currentPage + 1 : lastPage;

  return (
    <div className='my-2'>
      <div className='flex items-center gap-2'>
        <div className='btn-sm btn-group'>
          {/* button to go to first page */}
          <button
            className='btn btn-sm'
            onClick={(): void => onPageSelect(1)}
            disabled={!canGoToPreviousPage}
          >
            {'<<'}
          </button>
          {/* button to go previous page */}
          <button
            className='btn btn-sm'
            onClick={(): void => onPageSelect(previousPage)}
            disabled={!canGoToPreviousPage}
          >
            {'<'}
          </button>
          {/* button to go next page */}
          <button
            className='btn btn-sm'
            onClick={(): void => onPageSelect(nextPage)}
            disabled={!canGoToNextPage}
          >
            {'>'}
          </button>
          {/* button to go last page */}
          <button
            className='btn btn-sm'
            onClick={(): void => onPageSelect(lastPage)}
            disabled={!canGoToNextPage}
          >
            {'>>'}
          </button>
        </div>
        {/* page info */}
        <span className='flex items-center gap-1'>
          <div>Page</div>
          <strong>
            {currentPage} of {lastPage}
          </strong>
        </span>
      </div>
    </div>
  );
};
