export interface Stock {
  id: number;
  vegetable: string;
  quantity: number;
  price: number;
  farmer: string;
}

export const mockStocks: Stock[] = [
  {
    id: 1,
    vegetable: "Tomato",
    quantity: 500,
    price: 20,
    farmer: "Ravi",
  },
  {
    id: 2,
    vegetable: "Onion",
    quantity: 700,
    price: 25,
    farmer: "Kumar",
  },
];
