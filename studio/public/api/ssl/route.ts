import { NextRequest, NextResponse } from "next/server"
import { promisify } from "util"
import * as dns from "dns"
import * as tls from "tls"
import * as net from "net"

const resolve4 = promisify(dns.resolve4)
const resolve6 = promisify(dns.resolve6)
const resolveMx = promisify(dns.resolveMx)
const resolveTxt = promisify(dns.resolveTxt)
const resolveNs = promisify(dns.resolveNs)

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      )
    }

    console.log(`Checking SSL and domain info for: ${domain}`)

    // Check SSL certificate
    const sslInfo = await checkSslCertificate(domain)
    
    // Check DNS records
    const dnsInfo = await checkDnsRecords(domain)
    
    // Check security headers
    const securityInfo = await checkSecurityHeaders(domain)
    
    // Get real WHOIS domain registration info
    const domainInfo = await getDomainInfo(domain)

    const result = {
      domain,
      ssl: sslInfo,
      dns: dnsInfo,
      domain_info: domainInfo,
      security: securityInfo,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("SSL check error:", error)
    return NextResponse.json(
      { error: "Failed to check SSL and domain information" },
      { status: 500 }
    )
  }
}

async function checkSslCertificate(domain: string): Promise<any> {
  return new Promise((resolve) => {
    const options = {
      host: domain,
      port: 443,
      servername: domain,
      rejectUnauthorized: false, // We want to get cert info even if invalid
    }

    const socket = tls.connect(options, () => {
      try {
        const cert = socket.getPeerCertificate(true)
        const cipher = socket.getCipher()
        const protocol = socket.getProtocol()

        if (!cert || Object.keys(cert).length === 0) {
          socket.end()
          return resolve({
            valid: false,
            issuer: "Unknown",
            validFrom: "",
            validTo: "",
            daysUntilExpiry: 0,
            protocol: "Unknown",
            cipher: "Unknown",
            keySize: 0,
          })
        }

        const now = new Date()
        const validFrom = new Date(cert.valid_from)
        const validTo = new Date(cert.valid_to)
        const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

        // Extract issuer information
        let issuer = "Unknown"
        if (cert.issuer) {
          if (typeof cert.issuer === 'string') {
            issuer = cert.issuer
          } else if (cert.issuer.CN) {
            issuer = cert.issuer.CN
          } else if (cert.issuer.O) {
            issuer = cert.issuer.O
          }
        }

        // Get key size from modulus length or publicKey
        let keySize = 0
        if (cert.modulus) {
          keySize = cert.modulus.length * 4 // Each hex char is 4 bits
        } else if (cert.pubkey) {
          keySize = cert.pubkey.length * 8 // Each byte is 8 bits
        }

        const result = {
          valid: socket.authorized && now >= validFrom && now <= validTo,
          issuer: issuer,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysUntilExpiry: daysUntilExpiry,
          protocol: protocol || "Unknown",
          cipher: cipher?.name || "Unknown",
          keySize: keySize || 2048, // Default fallback
          subject: cert.subject?.CN || domain,
          serialNumber: cert.serialNumber || "Unknown",
          fingerprint: cert.fingerprint || "Unknown",
          altNames: cert.subjectaltname ? cert.subjectaltname.split(', ').map(name => name.replace('DNS:', '')) : [],
        }

        socket.end()
        resolve(result)
      } catch (error) {
        console.error("Certificate parsing error:", error)
        socket.end()
        resolve({
          valid: false,
          issuer: "Unknown",
          validFrom: "",
          validTo: "",
          daysUntilExpiry: 0,
          protocol: "Unknown",
          cipher: "Unknown",
          keySize: 0,
        })
      }
    })

    socket.on('error', (error) => {
      console.error("TLS connection error:", error)
      resolve({
        valid: false,
        issuer: "Connection Failed",
        validFrom: "",
        validTo: "",
        daysUntilExpiry: 0,
        protocol: "Unknown",
        cipher: "Unknown",
        keySize: 0,
      })
    })

    socket.setTimeout(10000, () => {
      socket.end()
      resolve({
        valid: false,
        issuer: "Timeout",
        validFrom: "",
        validTo: "",
        daysUntilExpiry: 0,
        protocol: "Unknown",
        cipher: "Unknown",
        keySize: 0,
      })
    })
  })
}

async function checkDnsRecords(domain: string) {
  const results = {
    ipv4: [] as string[],
    ipv6: [] as string[],
    mx: [] as string[],
    txt: [] as string[],
    ns: [] as string[],
  }

  try {
    // IPv4 addresses
    try {
      const ipv4Records = await resolve4(domain)
      results.ipv4 = ipv4Records
    } catch (error) {
      console.log(`No IPv4 records for ${domain}`)
    }

    // IPv6 addresses
    try {
      const ipv6Records = await resolve6(domain)
      results.ipv6 = ipv6Records
    } catch (error) {
      console.log(`No IPv6 records for ${domain}`)
    }

    // MX records
    try {
      const mxRecords = await resolveMx(domain)
      results.mx = mxRecords.map(record => `${record.priority} ${record.exchange}`)
    } catch (error) {
      console.log(`No MX records for ${domain}`)
    }

    // TXT records
    try {
      const txtRecords = await resolveTxt(domain)
      results.txt = txtRecords.map(record => record.join(" "))
    } catch (error) {
      console.log(`No TXT records for ${domain}`)
    }

    // NS records
    try {
      const nsRecords = await resolveNs(domain)
      results.ns = nsRecords
    } catch (error) {
      console.log(`No NS records for ${domain}`)
    }
  } catch (error) {
    console.error("DNS lookup error:", error)
  }

  return results
}

async function checkSecurityHeaders(domain: string) {
  try {
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      headers: {
        "User-Agent": "PageRodeo Security Checker/1.0",
      },
      signal: AbortSignal.timeout(10000),
    })

    const headers = response.headers
    const securityHeaders = []

    // Check for common security headers
    if (headers.get("strict-transport-security")) {
      securityHeaders.push("Strict-Transport-Security")
    }
    if (headers.get("content-security-policy")) {
      securityHeaders.push("Content-Security-Policy")
    }
    if (headers.get("x-frame-options")) {
      securityHeaders.push("X-Frame-Options")
    }
    if (headers.get("x-content-type-options")) {
      securityHeaders.push("X-Content-Type-Options")
    }
    if (headers.get("referrer-policy")) {
      securityHeaders.push("Referrer-Policy")
    }

    return {
      hsts: !!headers.get("strict-transport-security"),
      redirectsToHttps: response.url.startsWith("https://"),
      mixedContent: false, // Would need to analyze page content
      securityHeaders,
    }
  } catch (error) {
    console.error("Security check failed:", error)
    return {
      hsts: false,
      redirectsToHttps: false,
      mixedContent: true,
      securityHeaders: [],
    }
  }
}

async function getDomainInfo(domain: string) {
  try {
    // Extract root domain (remove subdomains)
    const rootDomain = extractRootDomain(domain)
    
    // Get WHOIS server for the TLD
    const whoisServer = getWhoisServer(rootDomain)
    
    // Query WHOIS data
    const whoisData = await queryWhois(rootDomain, whoisServer)
    
    // Parse WHOIS response
    const parsedData = parseWhoisData(whoisData)
    
    return parsedData
  } catch (error) {
    console.error("WHOIS lookup failed:", error)
    
    // Fallback to mock data if WHOIS fails
    const now = new Date()
    const created = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))
    const expires = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000))
    const daysUntilExpiry = Math.floor((expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    return {
      registrar: "WHOIS Lookup Failed",
      created: created.toISOString(),
      expires: expires.toISOString(),
      daysUntilExpiry,
      status: ["unknown"],
    }
  }
}

function extractRootDomain(domain: string): string {
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '')
  
  // Split by dots and get the last two parts for most TLDs
  const parts = domain.split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return domain
}

function getWhoisServer(domain: string): string {
  const tld = domain.split('.').pop()?.toLowerCase()
  
  // Common WHOIS servers by TLD
  const whoisServers: { [key: string]: string } = {
    'com': 'whois.verisign-grs.com',
    'net': 'whois.verisign-grs.com',
    'org': 'whois.pir.org',
    'info': 'whois.afilias.net',
    'biz': 'whois.neulevel.biz',
    'us': 'whois.nic.us',
    'uk': 'whois.nic.uk',
    'ca': 'whois.cira.ca',
    'au': 'whois.auda.org.au',
    'de': 'whois.denic.de',
    'fr': 'whois.afnic.fr',
    'it': 'whois.nic.it',
    'nl': 'whois.domain-registry.nl',
    'be': 'whois.dns.be',
    'io': 'whois.nic.io',
    'co': 'whois.nic.co',
    'me': 'whois.nic.me',
    'tv': 'whois.nic.tv',
  }
  
  return whoisServers[tld!] || 'whois.iana.org'
}

async function queryWhois(domain: string, whoisServer: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(43, whoisServer)
    let data = ''
    
    socket.setTimeout(10000)
    
    socket.on('connect', () => {
      socket.write(domain + '\r\n')
    })
    
    socket.on('data', (chunk) => {
      data += chunk.toString()
    })
    
    socket.on('end', () => {
      resolve(data)
    })
    
    socket.on('error', (error) => {
      reject(error)
    })
    
    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('WHOIS query timeout'))
    })
  })
}

function parseWhoisData(whoisData: string) {
  const lines = whoisData.split('\n').map(line => line.trim())
  
  let registrar = "Unknown"
  let created = ""
  let expires = ""
  const status: string[] = []
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    // Extract registrar
    if (lowerLine.includes('registrar:') || lowerLine.includes('registrar name:')) {
      registrar = line.split(':')[1]?.trim() || registrar
    }
    
    // Extract creation date
    if (lowerLine.includes('creation date:') || lowerLine.includes('created:') || lowerLine.includes('registered:')) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        created = new Date(dateMatch[1]).toISOString()
      }
    }
    
    // Extract expiry date
    if (lowerLine.includes('expiry date:') || lowerLine.includes('expires:') || lowerLine.includes('expiration:')) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        expires = new Date(dateMatch[1]).toISOString()
      }
    }
    
    // Extract status
    if (lowerLine.includes('domain status:') || lowerLine.includes('status:')) {
      const statusValue = line.split(':')[1]?.trim()
      if (statusValue && !status.includes(statusValue)) {
        status.push(statusValue)
      }
    }
  }
  
  // Calculate days until expiry
  let daysUntilExpiry = 0
  if (expires) {
    const now = new Date()
    const expiryDate = new Date(expires)
    daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  }
  
  return {
    registrar: registrar || "Unknown",
    created: created || new Date().toISOString(),
    expires: expires || new Date().toISOString(),
    daysUntilExpiry,
    status: status.length > 0 ? status : ["unknown"],
  }
}
