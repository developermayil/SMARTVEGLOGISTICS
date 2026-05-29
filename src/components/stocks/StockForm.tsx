import { useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
// import { Stock } from "@/mock/mockStocks";

export default function StockForm({ inputFunction }: any) {
  const [vegetable, setVegetable] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [farmer, setFarmer] = useState("");

  const handleSubmit = () => {
    if (!vegetable) return;

    inputFunction?.handleAdd({
      id: Date.now(),
      vegetable,
      quantity: Number(quantity),
      price: Number(price),
      farmer,
    });

    setVegetable("");
    setQuantity("");
    setPrice("");
    setFarmer("");
  };

  return (
    <Stack sx={{ mb: 3 }}>
      <TextField
        label="Vegetable"
        value={vegetable}
        onChange={(e) => setVegetable(e.target.value)}
      />

      <TextField
        label="Quantity"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <TextField
        label="Price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <TextField
        label="Farmer"
        value={farmer}
        onChange={(e) => setFarmer(e.target.value)}
      />

      <Button variant="contained" onClick={handleSubmit}>
        Add Stock
      </Button>
    </Stack>
  );
}
