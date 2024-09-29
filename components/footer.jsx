import { Divider } from "@nextui-org/divider";
import { Button } from "@nextui-org/button";
import { Github, Linkedin, Package } from "lucide-react"; 

export default function Footer() {
  return (
    <footer className="pt-15 text-white" style={{ backgroundColor: "#9F46F2" }}>
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <Divider className="mb-8" />
        <div className="flex justify-between items-center py-10">
          <p className="text-sm font-light">
            Made by{" "}
            <a
              href="https://github.com/Abdul-Moiz31/QuickStart-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white underline"
            >
              QuickStart
            </a>{" "}
            with ❤️
          </p>
          <div className="flex space-x-4">
            <a
              href="https://github.com/Abdul-Moiz31/QuickStart-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button isIconOnly variant="light">
                <Github size={24} color="white" />
              </Button>
            </a>
            <a
              href="https://linkedin.com/in/your-linkedin-profile"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button isIconOnly variant="light">
                <Linkedin size={24} color="white" />
              </Button>
            </a>
            <a
              href="https://www.npmjs.com/package/your-package-name"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button isIconOnly variant="light">
                <Package size={24} color="white" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
