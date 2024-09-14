import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";

const Transactions = () => {
  const [transactions] = useState([
    {
      price: 100,
      date: "2021-08-01",
      status: "completed",
      type: "credit",
      creditsCountAfter: 100,
      creditsCountBefore: 0,
      user: "Al",
    },
    {
      price: 100,
      date: "2021-08-01",
      status: "completed",
      type: "credit",
      creditsCountAfter: 100,
      creditsCountBefore: 0,
      user: "John Doe",
    },
  ]);

  return (
    <Table>
      {/* Caption for the table */}
      <TableCaption>A list of your recent transactions.</TableCaption>

      {/* Table header */}
      <TableHeader className="bg-blue-500 ">
        <TableRow className="px-2">
          <TableHead className="text-white roboty-headings text-[17px]">Date</TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">User</TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">Status</TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">Type</TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">Credits Before</TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">Credits After</TableHead>
          <TableHead className="text-right text-white roboty-headings text-[17px]">Amount</TableHead>
        </TableRow>
      </TableHeader>

      {/* Table body where data is rendered dynamically */}
      <TableBody>
        {transactions.map((transaction, index) => (
          <TableRow key={index}>
            <TableCell className="open-sans-text">{transaction.date}</TableCell> {/* Date of transaction */}
            <TableCell className="open-sans-text">{transaction.user}</TableCell> {/* User's name */}
            <TableCell className="open-sans-text">{transaction.status}</TableCell> {/* Status (e.g., completed) */}
            <TableCell className="open-sans-text">{transaction.type}</TableCell> {/* Transaction type (e.g., credit) */}
            <TableCell className="open-sans-text">{transaction.creditsCountBefore}</TableCell> {/* Credits before the transaction */}
            <TableCell className="open-sans-text">{transaction.creditsCountAfter}</TableCell> {/* Credits after the transaction */}
            <TableCell className="open-sans-text text-right">${transaction.price}</TableCell> {/* Transaction amount */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default Transactions;
