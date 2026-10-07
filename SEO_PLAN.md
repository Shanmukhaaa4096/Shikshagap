# SEO STRATEGY AND DOMAIN ONBOARDING PLAN: ShikshaGap

**Target Domain**: `shikshagap.in` (or `shikshagap.org.in`)  
**Deployment Target**: Vercel Production  
**Scope**: Organic Educational Discovery, Zero Black-Hat / Spam Tactics

---

## 1. Custom Domain DNS Configuration

To connect a custom domain on Vercel:

1. **Vercel Project Settings**:
   - Navigate to **Project Settings** > **Domains** in the Vercel Dashboard.
   - Enter your target domain: `shikshagap.in` and `www.shikshagap.in`.
2. **DNS Registrar Records**:
   Configure the following DNS records at your domain registrar (GoDaddy, Namecheap, Google Domains / Squarespace):
   - **Apex Domain (`@`)**:
     - Type: `A`
     - Name: `@`
     - Value: `76.76.21.21` (Vercel Anycast IP)
   - **Subdomain (`www`)**:
     - Type: `CNAME`
     - Name: `www`
     - Value: `cname.vercel-dns.com.`
3. **SSL Certificate**: Vercel automatically provisions and renews Let's Encrypt Wildcard SSL certificates.

---

## 2. On-Page SEO Architecture

* **Clean Crawlability**:
  - `sitemap.xml` automatically lists only public pages (`/`, `/login`, `/privacy`, `/terms`, `/cookies`, `/licenses`, `/data-request`).
  - `robots.txt` explicitly disallows crawling of `/app/`, `/app/*`, and `/api/*` to guarantee that no pupil data or authenticated dashboards are indexed by search engines.
* **Structured Data**:
  - JSON-LD schemas embedded on `/` include `Organization`, `SoftwareApplication`, and `FAQPage`.
* **Metadata & Canonicalization**:
  - Each public page contains unique titles, meta descriptions, and `canonical` links pointing to the production domain.
  - Multi-script support: Hindi and Telugu metadata entries prepared for regional language search queries.

---

## 3. White-Hat Educational Backlink Strategy

ShikshaGap prohibits all paid links, link farms, spam directories, or automated link-building schemes. Our visibility relies on legitimate educational domain authority:

### Tier 1: Educational Non-Profits & Philanthropic Foundations
* **Target Organizations**: Pratham Education Foundation, Central Square Foundation (CSF), Azim Premji University Research Portals, Room to Read India.
* **Outreach Method**: Share white papers on prerequisite mathematics diagnostic graph modeling and classroom TLM interventions for Class 5 foundational numeracy.

### Tier 2: State Education Department Research & SCERT Portals
* **Target Entities**: State Councils of Educational Research and Training (SCERT Andhra Pradesh, Telangana, Karnataka, Delhi SCERT).
* **Outreach Method**: Submit case studies demonstrating how diagnostic gap identification reduces remediation time during FLN (Foundational Literacy and Numeracy) assessments.

### Tier 3: Teacher Community Hubs & DIET Networks
* **Target Groups**: District Institutes of Education and Training (DIETs), regional primary school mathematics teacher WhatsApp/Telegram associations, EdTech for Good open-source repositories.
* **Outreach Method**: Distribute free printable 5-day remedial worksheets with clear pedagogical attribution.

### Tier 4: Education Journalism & Policy Portals
* **Target Publications**: The Hindu Education Plus, Indian Express Education, Scroll.in Policy, Citizen Matters.
* **Outreach Method**: Contributed op-eds on child data privacy under the DPDP Act 2023 in Indian primary EdTech tools.
