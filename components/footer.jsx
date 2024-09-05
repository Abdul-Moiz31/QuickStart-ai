import { Divider } from "@nextui-org/divider";
import { Button } from "@nextui-org/button";
import { Github, Twitter } from "lucide-react";
export default function Footer() {
  return (
    <footer className="pt-24">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-10">
          <p className="text-sm font-light">
            Made by{" "}
            <a
              href=""
              target="_blank"
              className="font-medium"
            >
              QuickStart
            </a>{" "}
            with ❤️
          </p>
          <a href="https://github.com/Abdul-Moiz31/QuickStart-ai" target="_blank">
            <Button isIconOnly variant="light">
              <Github size={24} />
            </Button>
          </a>
        </div>
      </div>
    </footer>
  );
}
