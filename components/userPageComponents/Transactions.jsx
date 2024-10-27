import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "components/ui/table";
import { useSelector } from "react-redux";

const Transactions = () => {
  const { user } = useSelector((state) => state.user); // Assuming user is part of the state
  return (
    <Table>
      {/* Caption for the table */}
      <TableCaption>A list of your recent transactions.</TableCaption>

      {/* Table header */}
      <TableHeader className="bg-purple-500 ">
        <TableRow className="px-2">
          <TableHead className="text-white roboty-headings text-[17px]">
            Date
          </TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">
            User
          </TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">
            Status
          </TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">
            Type
          </TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">
            Credits Before
          </TableHead>
          <TableHead className="text-white roboty-headings text-[17px]">
            Credits After
          </TableHead>
          <TableHead className="text-right text-white roboty-headings text-[17px]">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* Table body where data is rendered dynamically */}
      <TableBody>
        <TableRow>
          <TableCell className="open-sans-text">
            {user?.createdAt?.toLocaleString()}
          </TableCell>{" "}
          {/* Date of transaction */}
          <TableCell className="open-sans-text">{user?.name}</TableCell>{" "}
          {/* User's name */}
          <TableCell className="open-sans-text">Success</TableCell>{" "}
          {/* Status (e.g., completed) */}
          <TableCell className="open-sans-text">One Time</TableCell>{" "}
          {/* Transaction type (e.g., credit) */}
          <TableCell className="open-sans-text">0</TableCell>{" "}
          {/* Credits before the transaction */}
          <TableCell className="open-sans-text">250</TableCell>{" "}
          {/* Credits after the transaction */}
          <TableCell className="open-sans-text text-right">$0</TableCell>{" "}
          {/* Transaction amount */}
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default Transactions;
