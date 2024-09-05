"use client";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { Link } from "@nextui-org/link";
import { Button } from "@nextui-org/button";
import ThemeSwitcher from "./ThemeSwitcher";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import {
  ChevronDown,
} from "lucide-react";

// Import your logo image
import Image from "next/image";

export default function NavBar() {
  const menuItems = ["docs", "features", "pricing", "blog"];

  return (
    <Navbar isBlurred maxWidth="xl">
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>
      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <span className="font-light tracking-tighter text-inherit text-lg">
            Quickstart
          </span>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex gap-5" justify="center">
        <NavbarBrand className="flex items-center gap-2">
          <span className="font-light tracking-tighter text-2xl">
            
          </span>
          {/* Add the logo image here */}
          <Image
            src="/logo.png" 
            alt="Quickstart Logo"
             href="/"
            width={57} 
            height={57} 
            className="object-contain" 
          />
        </NavbarBrand>
        <NavbarItem>
          <Button as={Link} variant="light">
            docs
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              <Button endContent={<ChevronDown size={16} />} variant="light">
                Features
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="ACME features"
              className="w-[340px]"
              itemClasses={{
                base: "gap-4",
              }}
            >
              <DropdownItem>Autoscaling</DropdownItem>
              <DropdownItem>Usage Metrics</DropdownItem>
              <DropdownItem>Production Ready</DropdownItem>
              <DropdownItem>+99% Uptime</DropdownItem>
              <DropdownItem>+Supreme Support</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} variant="light">
            pricing
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} variant="light">
            blog
          </Button>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <Button
            as={Link}
            color="primary"
            href="#"
            variant="solid"
            className="hidden sm:flex"
          >
            Get Started
          </Button>
        </NavbarItem>
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link className="w-full" href="#" size="lg" color="foreground">
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
