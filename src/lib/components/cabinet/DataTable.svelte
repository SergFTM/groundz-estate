<script lang="ts">
  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: unknown, row: Record<string, unknown>) => string;
  }

  interface Props {
    columns: Column[];
    rows: Record<string, unknown>[];
    searchable?: boolean;
    onRowClick?: (row: Record<string, unknown>) => void;
  }

  let { columns, rows, searchable = false, onRowClick }: Props = $props();

  let search = $state('');
  let debouncedSearch = $state('');
  let debounceTimer: ReturnType<typeof setTimeout>;
  let sortKey = $state('');
  let sortDir = $state<'asc' | 'desc'>('asc');
  let currentPage = $state(1);
  const perPage = 20;

  function handleSearch(value: string) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debouncedSearch = value;
      currentPage = 1;
    }, 300);
  }

  let filtered = $derived.by(() => {
    let result = rows;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  });

  let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / perPage)));
  let paginated = $derived(filtered.slice((currentPage - 1) * perPage, currentPage * perPage));

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
    currentPage = 1;
  }

  function getCellValue(col: Column, row: Record<string, unknown>): string {
    const val = row[col.key];
    if (col.render) return col.render(val, row);
    if (val == null) return '—';
    return String(val);
  }
</script>

<div class="dt">
  {#if searchable}
    <div class="dt__toolbar">
      <input
        type="text"
        class="dt__search"
        placeholder="Search..."
        bind:value={search}
        oninput={(e) => handleSearch(e.currentTarget.value)}
      />
      <span class="dt__count">{filtered.length} records</span>
    </div>
  {/if}

  <div class="dt__wrap">
    <table class="dt__table">
      <thead>
        <tr>
          {#each columns as col}
            <th
              class="dt__th"
              class:dt__th--sortable={col.sortable}
              onclick={() => col.sortable && toggleSort(col.key)}
            >
              {col.label}
              {#if col.sortable && sortKey === col.key}
                <span class="dt__arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each paginated as row}
          <tr
            class="dt__row"
            class:dt__row--clickable={!!onRowClick}
            onclick={() => onRowClick?.(row)}
          >
            {#each columns as col}
              <td class="dt__td">{@html getCellValue(col, row)}</td>
            {/each}
          </tr>
        {:else}
          <tr>
            <td colspan={columns.length} class="dt__empty">No records found</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="dt__pagination">
      <button class="dt__page-btn" disabled={currentPage === 1} onclick={() => currentPage--}>Prev</button>
      <span class="dt__page-info">Page {currentPage} of {totalPages}</span>
      <button class="dt__page-btn" disabled={currentPage === totalPages} onclick={() => currentPage++}>Next</button>
    </div>
  {/if}
</div>

<style>
  .dt {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .dt__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .dt__search {
    padding: var(--space-2) var(--space-4);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    outline: none;
    width: 280px;
    transition: border-color var(--transition-fast);
  }

  .dt__search:focus {
    border-color: var(--color-accent);
  }

  .dt__count {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .dt__wrap {
    overflow-x: auto;
  }

  .dt__table {
    width: 100%;
    border-collapse: collapse;
  }

  .dt__th {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    white-space: nowrap;
  }

  .dt__th--sortable {
    cursor: pointer;
    user-select: none;
  }

  .dt__th--sortable:hover {
    color: var(--color-text);
  }

  .dt__arrow {
    margin-left: 4px;
    font-size: 11px;
  }

  .dt__td {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-body);
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    white-space: nowrap;
  }

  .dt__row--clickable {
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .dt__row--clickable:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .dt__empty {
    padding: var(--space-10) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .dt__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .dt__page-btn {
    padding: var(--space-2) var(--space-4);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 600;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .dt__page-btn:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .dt__page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dt__page-info {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
