import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cookie, Settings, Shield, Eye, Database, AlertTriangle } from "lucide-react"

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Cookie Policy</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          How pagerodeo uses cookies and similar technologies to enhance your experience
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* What Are Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              What Are Cookies?
            </CardTitle>
            <CardDescription>Understanding cookie technology</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help websites remember information about your visit, such as your preferred language and other settings, which can make your next visit easier and the site more useful to you.
            </p>
            <p className="text-muted-foreground">
              Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device when you go offline, while session cookies are deleted as soon as you close your web browser.
            </p>
          </CardContent>
        </Card>

        {/* How We Use Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              How pagerodeo Uses Cookies
            </CardTitle>
            <CardDescription>Our cookie usage purposes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We use cookies for several important purposes:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Essential Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Performance Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Functionality Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies allow the website to remember choices you make and provide enhanced, more personal features.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Analytics Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies help us understand how our website is performing and identify areas for improvement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Types of Cookies We Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Types of Cookies We Use
            </CardTitle>
            <CardDescription>Detailed breakdown of our cookie categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Essential Cookies (Always Active)</h3>
                <p className="text-sm text-green-700 mb-2">
                  These cookies are necessary for the website to function and cannot be switched off in our systems.
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Authentication and security cookies</li>
                  <li>• Session management cookies</li>
                  <li>• Load balancing cookies</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Performance & Analytics Cookies</h3>
                <p className="text-sm text-blue-700 mb-2">
                  These cookies help us understand how visitors interact with our website.
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Google Analytics cookies</li>
                  <li>• Performance monitoring cookies</li>
                  <li>• Error tracking cookies</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Functionality Cookies</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  These cookies enable enhanced functionality and personalization.
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Language preference cookies</li>
                  <li>• Theme preference cookies</li>
                  <li>• User experience customization cookies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Third-Party Cookies
            </CardTitle>
            <CardDescription>Cookies from external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Some cookies on our website are set by third-party services that we use to enhance your experience:
            </p>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Google Analytics</h3>
                <p className="text-muted-foreground text-sm">
                  We use Google Analytics to understand how visitors use our website. Google Analytics uses cookies to collect information about your use of our website, including your IP address.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Performance Monitoring</h3>
                <p className="text-muted-foreground text-sm">
                  We may use third-party performance monitoring services that set cookies to help us track website performance and identify issues.
                </p>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Note:</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Third-party cookies are subject to the privacy policies of those third parties. We recommend reviewing their policies for more information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Managing Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Managing Your Cookie Preferences
            </CardTitle>
            <CardDescription>How to control cookie settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You have several options for managing cookies:
            </p>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Browser Settings</h3>
                <p className="text-muted-foreground text-sm">
                  Most web browsers allow you to control cookies through their settings preferences. You can usually find these settings in the "Options" or "Preferences" menu of your browser.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cookie Consent</h3>
                <p className="text-muted-foreground text-sm">
                  When you first visit our website, you'll see a cookie consent banner that allows you to accept or decline non-essential cookies.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Opt-Out Tools</h3>
                <p className="text-muted-foreground text-sm">
                  You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on.
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Important:</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Disabling certain cookies may affect the functionality of our website. Essential cookies cannot be disabled as they are necessary for basic website operation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Duration */}
        <Card>
          <CardHeader>
            <CardTitle>Cookie Duration</CardTitle>
            <CardDescription>How long cookies remain on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Session Cookies</h3>
                <p className="text-muted-foreground text-sm">
                  These cookies are temporary and are deleted when you close your browser. They are used to maintain your session while using our website.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Persistent Cookies</h3>
                <p className="text-muted-foreground text-sm">
                  These cookies remain on your device for a set period or until you delete them. They help us remember your preferences and provide a better user experience.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Specific Durations</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Authentication cookies: 30 days</li>
                <li>• Preference cookies: 1 year</li>
                <li>• Analytics cookies: 2 years</li>
                <li>• Performance cookies: 1 year</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Updates to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Updates to This Policy</CardTitle>
            <CardDescription>How we handle changes to our cookie policy</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Cookie Policy on this page.
            </p>
            <p className="text-muted-foreground mt-4">
              Your continued use of our website after any changes constitutes acceptance of the updated Cookie Policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Questions about our cookie policy?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-muted-foreground">Email: privacy@pagerodeo.com</p>
              <p className="text-muted-foreground">Website: pagerodeo.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
