import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
    key: string;
    label: ReactNode;
    className?: string;
    render: (row: T) => ReactNode;
}

export function DataTable<T>({
    columns,
    empty,
    rowKey,
    rows,
}: {
    columns: Array<DataTableColumn<T>>;
    empty?: ReactNode;
    rowKey: (row: T) => string;
    rows: T[];
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                    <tr className="bg-[#FBFAFF] text-left text-xs font-semibold uppercase text-[#6D6997] dark:bg-slate-950/30 dark:text-slate-400">
                        {columns.map(column => (
                            <th key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={rowKey(row)} className="border-t border-[#EEEAF9] dark:border-slate-800">
                            {columns.map(column => (
                                <td key={column.key} className={`px-4 py-3 align-middle ${column.className ?? ''}`}>
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {rows.length === 0 && (
                <div className="px-4 py-8 text-center text-sm font-medium text-[#8D89AE] dark:text-slate-400">
                    {empty}
                </div>
            )}
        </div>
    );
}
