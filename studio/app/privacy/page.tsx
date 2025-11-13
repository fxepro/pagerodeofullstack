import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Lock, Database, Users, Globe } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          How we collect, use, and protect your information when using pagerodeo
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Information We Collect
            </CardTitle>
            <CardDescription>What data we gather and how we use it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Website URLs</h3>
              <p className="text-muted-foreground">
                When you test a website's performance, we collect the URL you submit for analysis. This information is used solely to provide performance testing services and generate reports.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Performance Data</h3>
              <p className="text-muted-foreground">
                We collect performance metrics, Core Web Vitals, and analysis results for the websites you test. This data helps us provide accurate performance insights and recommendations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Usage Analytics</h3>
              <p className="text-muted-foreground">
                We may collect anonymous usage statistics to improve our service, including features used, testing frequency, and general usage patterns.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              How We Use Your Information
            </CardTitle>
            <CardDescription>Our legitimate purposes for data processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-muted-foreground">
              <li>• Provide website performance testing and analysis services</li>
              <li>• Generate detailed performance reports and recommendations</li>
              <li>• Improve our testing algorithms and service quality</li>
              <li>• Respond to customer support requests and inquiries</li>
              <li>• Ensure service security and prevent abuse</li>
              <li>• Comply with legal obligations and regulations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Data Protection & Security
            </CardTitle>
            <CardDescription>How we keep your information safe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Security Measures</h3>
              <p className="text-muted-foreground">
                We implement industry-standard security measures including encryption, secure data transmission, and access controls to protect your information.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Retention</h3>
              <p className="text-muted-foreground">
                Performance test results are retained for 30 days to allow you to review and compare results. After this period, data is automatically deleted.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Access Controls</h3>
              <p className="text-muted-foreground">
                Only authorized personnel have access to our systems, and all access is logged and monitored for security purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Data Sharing & Third Parties
            </CardTitle>
            <CardDescription>When and how we share information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We do not sell, rent, or trade your personal information to third parties. We may share data only in the following circumstances:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• With your explicit consent</li>
              <li>• To comply with legal requirements or court orders</li>
              <li>• To protect our rights, property, or safety</li>
              <li>• With service providers who assist in our operations (under strict confidentiality agreements)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Your Rights & Choices
            </CardTitle>
            <CardDescription>Control over your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You have the right to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Access your personal information</li>
              <li>• Request correction of inaccurate data</li>
              <li>• Request deletion of your data</li>
              <li>• Object to processing of your data</li>
              <li>• Request data portability</li>
              <li>• Withdraw consent at any time</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at privacy@pagerodeo.com
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Questions about this privacy policy?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
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
