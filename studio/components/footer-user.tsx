import Link from "next/link"
import { Facebook, Twitter } from "lucide-react"

export function FooterUser() {
  return (
    <footer className="bg-palette-accent-3 border-t border-palette-accent-2">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Connect Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 pb-6">
          <div className="flex items-center space-x-6">
            <h3 className="font-semibold text-palette-primary text-h4-dynamic">Connect</h3>
            <div className="flex space-x-4">
              <Link 
                href="https://www.facebook.com/pagerodeo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-palette-primary hover:text-palette-primary-hover transition-colors p-2 rounded-lg hover:bg-palette-accent-2"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link 
                href="https://www.x.com/pagerodeo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-palette-primary hover:text-palette-primary-hover transition-colors p-2 rounded-lg hover:bg-palette-accent-2"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="flex space-x-6">
            <Link href="/about" className="text-palette-primary hover:text-palette-primary-hover transition-colors font-medium">
              About
            </Link>
            <Link href="/affiliate" className="text-palette-primary hover:text-palette-primary-hover transition-colors font-medium">
              Affiliates
            </Link>
            <Link href="/feedback" className="text-palette-primary hover:text-palette-primary-hover transition-colors font-medium">
              Feedback
            </Link>
            <Link href="/contact" className="text-palette-primary hover:text-palette-primary-hover transition-colors font-medium">
              Contact
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-palette-accent-2 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-palette-primary text-sm">
            © 2024 PageRodeo. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-palette-primary">
            <Link href="/privacy" className="hover:text-palette-primary-hover transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-palette-primary-hover transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-palette-primary-hover transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}



