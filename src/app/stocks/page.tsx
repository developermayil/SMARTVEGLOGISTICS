"use client";

import { useState } from "react";
import { Box } from "@mui/material";

import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import StockForm from "@/components/stocks/StockForm";
import StockTable from "@/components/stocks/StockTable";

import { Stock, mockStocks } from "@/mock/mockStocks";

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>(mockStocks);

  const handleAdd = (stock: Stock) => {
    setStocks((prev) => [...prev, stock]);
  };

  const handleDelete = (id: number) => {
    setStocks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <Header />

      <Box sx={{ display: "flex" }}>
        <Sidebar />

        <Box sx={{ flex: 1, p: 3 }}>
          <StockForm
            inputFunction={{
              handleAdd: (stock: any) => {
                handleAdd(stock);
              },
            }}
          />

          <StockTable stocks={stocks} onDelete={handleDelete} />
        </Box>
      </Box>
    </>
  );
}
