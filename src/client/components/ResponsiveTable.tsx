export type ResponsiveTableProps<T> = {
  caption: React.ReactElement;
  data: T[];
  columns: Record<string, string>;
  appendage?: React.ReactElement;
  tableClass?: string;
  extraColumnClasses?: Array<(string | null)[]>;
};

export default function ResponsiveTable<
  T extends Record<string, string | number | React.ReactElement>,
>({
  caption,
  columns,
  data,
  appendage,
  extraColumnClasses,
  tableClass,
}: ResponsiveTableProps<T>) {
  const columnElements = [];
  let index = 0;
  for (const [className, column] of Object.entries(columns)) {
    columnElements.push(
      <th className={className} key={`column-${index}`}>
        {column}
      </th>
    );
    index += 1;
  }
  columnElements.unshift(<th className="empty" key={`column-empty-1`} />);
  columnElements.push(<th className="empty" key={`column-empty-2`} />);

  const columnClasses = Object.keys(columns);
  const columnNames = Object.values(columns);

  const createRow = (
    data: T | null,
    index: number,
    extraClasses: (string | null)[]
  ) => {
    const rowColumns = [];
    const values = data !== null ? Object.values(data) : null;
    for (let i = 0; i < columnClasses.length; i++) {
      const mobileLabel = columnNames[i] ? `${columnNames[i]}: ` : "";
      const extraClass = extraClasses?.[i] ?? "";
      rowColumns.push(
        <td
          key={`column-${i}`}
          className={`${columnClasses[i]} ${extraClass}`}
          data-mobile-label={mobileLabel}
        >
          {values?.[i] ?? null}
        </td>
      );
    }
    rowColumns.unshift(<td className="empty" key={`column-empty-1`} />);
    rowColumns.push(<td className="empty" key={`column-empty-2`} />);
    return (
      <tr
        key={`row-${index}`}
        className={`${data === null ? "empty-row" : ""}`}
      >
        {rowColumns}
      </tr>
    );
  };

  const tableRows = [];
  if (data.length > 0) {
    tableRows.push(createRow(null, -1, []));
    let index = 0;
    let realIndex = 0;
    for (const row of data) {
      tableRows.push(
        createRow(row, index, extraColumnClasses?.[realIndex] ?? [])
      );
      index += 1;
      realIndex += 1;
      tableRows.push(createRow(null, index, []));
      index += 1;
    }
  }

  return (
    <>
      <div className={`waiting-room-body lobbies-body ${tableClass ?? ""}`}>
        <div className="table-fixed-head">
          <table className="lobbies-table">
            <caption>{caption}</caption>
            <thead>
              <tr>{columnElements}</tr>
            </thead>
            <tbody>{tableRows}</tbody>
          </table>
          {appendage}
        </div>
      </div>
    </>
  );
}
