import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import { Stock } from "@/mock/mockStocks";

interface Props {
  stocks: Stock[];
  onDelete: (id: number) => void;
}

export default function StockTable({ stocks, onDelete }: Props) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Vegetable</TableCell>
          <TableCell>Quantity</TableCell>
          <TableCell>Price</TableCell>
          <TableCell>Farmer</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {stocks.map((stock) => (
          <TableRow key={stock.id}>
            <TableCell>{stock.vegetable}</TableCell>
            <TableCell>{stock.quantity}</TableCell>
            <TableCell>₹{stock.price}</TableCell>
            <TableCell>{stock.farmer}</TableCell>

            <TableCell>
              <Button color="error" onClick={() => onDelete(stock.id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
