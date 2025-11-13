import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, AlertTriangle, CheckCircle, XCircle, Shield, Users, Globe } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The terms and conditions governing your use of pagerodeo services
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Acceptance of Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Acceptance of Terms
            </CardTitle>
            <CardDescription>By using our service, you agree to these terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              By accessing and using pagerodeo ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p className="text-muted-foreground">
              These Terms of Service ("Terms") govern your use of our website performance testing and monitoring services. Please read these Terms carefully before using our Service.
            </p>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Service Description
            </CardTitle>
            <CardDescription>What pagerodeo provides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              pagerodeo provides website performance testing and monitoring services, including:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Website performance analysis and testing</li>
              <li>• Core Web Vitals measurement</li>
              <li>• Performance optimization recommendations</li>
              <li>• Waterfall charts and resource analysis</li>
              <li>• Performance monitoring and reporting</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.
            </p>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Responsibilities
            </CardTitle>
            <CardDescription>Your obligations when using our service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When using pagerodeo, you agree to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Provide accurate and truthful information</li>
              <li>• Use the Service only for lawful purposes</li>
              <li>• Not attempt to gain unauthorized access to our systems</li>
              <li>• Not interfere with or disrupt the Service</li>
              <li>• Respect intellectual property rights</li>
              <li>• Comply with all applicable laws and regulations</li>
            </ul>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Important:</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                You are responsible for ensuring you have the right to test any website URL you submit for analysis.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Acceptable Use Policy
            </CardTitle>
            <CardDescription>What is not allowed on our platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The following activities are strictly prohibited:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Testing websites without proper authorization</li>
              <li>• Attempting to overload or crash our systems</li>
              <li>• Using automated tools to abuse our service</li>
              <li>• Attempting to reverse engineer our technology</li>
              <li>• Sharing malicious content or links</li>
              <li>• Violating any applicable laws or regulations</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Violation of these terms may result in immediate suspension or termination of your access to the Service.
            </p>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Intellectual Property
            </CardTitle>
            <CardDescription>Ownership and usage rights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Our Rights</h3>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are owned by pagerodeo and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Your Rights</h3>
              <p className="text-muted-foreground">
                You retain ownership of any content you submit to our Service. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content solely for the purpose of providing our Service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Third-Party Content</h3>
              <p className="text-muted-foreground">
                Our Service may contain links to third-party websites or services. We are not responsible for the content or practices of these third-party sites.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Limitation of Liability
            </CardTitle>
            <CardDescription>Our liability limitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, pagerodeo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Your use or inability to use the Service</li>
              <li>• Any unauthorized access to or use of our servers</li>
              <li>• Any interruption or cessation of transmission to or from the Service</li>
              <li>• Any bugs, viruses, or other harmful code that may be transmitted</li>
              <li>• Any errors or omissions in any content or for any loss or damage incurred</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Our total liability to you for any claims arising from the use of our Service shall not exceed the amount you paid us, if any, in the twelve months preceding the claim.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle>Termination</CardTitle>
            <CardDescription>How service access can be terminated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="text-muted-foreground">
              Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account, you may simply discontinue using the Service.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
            <CardDescription>How we handle updates to these terms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
            <p className="text-muted-foreground mt-4">
              Your continued use of the Service after any changes constitutes acceptance of the new Terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Questions about these terms?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-muted-foreground">Email: legal@pagerodeo.com</p>
              <p className="text-muted-foreground">Website: pagerodeo.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
