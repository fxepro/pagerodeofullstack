import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, BookOpen } from "lucide-react"
import Link from "next/link"

interface ConsultationCTAProps {
  title?: string
  description?: string
  primaryButtonText?: string
  secondaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonHref?: string
}

export function ConsultationCTA({
  title = "Need Help Optimizing Your Website Performance?",
  description = "Our expert consultants can help you analyze your performance data, implement optimizations, and achieve better results.",
  primaryButtonText = "Get Expert Consultation",
  secondaryButtonText = "Learn More",
  primaryButtonHref = "/consult",
  secondaryButtonHref = "/consult"
}: ConsultationCTAProps) {
  return (
    <div className="mt-16">
      <Card className="bg-gradient-to-r from-palette-primary to-palette-secondary text-white border-0 shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {title}
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-palette-primary hover:bg-palette-accent-3 px-8 py-3"
                asChild
              >
                <Link href={primaryButtonHref}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {primaryButtonText}
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-palette-primary px-8 py-3 bg-transparent hover:bg-white/10"
                asChild
              >
                <Link href={secondaryButtonHref}>
                  <BookOpen className="h-5 w-5 mr-2" />
                  {secondaryButtonText}
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Free Initial Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>24hr Response Time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Expert Analysis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
