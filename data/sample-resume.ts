export interface SampleTemplate {
  id: string;
  name: string;
  description: string;
  expectedScore: "high" | "medium" | "low";
  text: string;
}

export const SAMPLE_RESUME = `ALEX CHEN
San Francisco, CA | alex.chen@email.com | github.com/alexchen

EDUCATION
Master of Science in Computer Science, Stanford University, 2024
Bachelor of Science in Computer Science, UC Berkeley, 2022

EXPERIENCE

Software Engineer | CloudScale Inc. | June 2024 - Present
- Built a real-time data processing pipeline using Python and AWS Lambda that handles 50,000 events per second
- Reduced API response latency by 40% by implementing Redis caching layer for frequently accessed endpoints
- Developed RESTful APIs using Node.js and Express serving 2M+ requests daily
- Collaborated with the ML team to deploy a fraud detection model that reduced false positives by 25%

Software Engineering Intern | TechStartup Co. | Summer 2023
- Worked on backend systems and helped improve application performance
- Developed features for the customer dashboard using React and TypeScript
- Participated in code reviews and agile sprint planning
- Assisted with database migrations and wrote SQL queries for reporting

Research Assistant | Stanford AI Lab | 2022 - 2024
- Conducted research on natural language processing for cybersecurity applications
- Implemented text classification models using Python and PyTorch
- Published paper on automated phishing detection with 94% accuracy
- Built data collection pipeline processing 100K+ samples monthly

PROJECTS

PointsGo - Travel Rewards Optimizer | Personal Project
- Built a full-stack web application using React, Node.js, and PostgreSQL
- Implemented a recommendation engine that helped users maximize credit card rewards
- Deployed on AWS EC2 with Docker containers and automated CI/CD pipeline
- Achieved 500+ active users within first month of launch

CloudWatch Dashboard | Hackathon Project
- Created a monitoring dashboard for cloud infrastructure metrics
- Used JavaScript and D3.js for real-time data visualization
- Integrated with AWS CloudWatch API for metric collection

SKILLS
Languages: Python, JavaScript, TypeScript, SQL, Java
Frameworks: React, Node.js, Express, Next.js
Cloud: AWS (EC2, S3, Lambda, RDS), Docker
Tools: Git, Linux, CI/CD, Redis, PostgreSQL
Other: Agile, Code Review, REST APIs`;

const WEAK_RESUME = `Jordan Smith
New York, NY | jordan.smith@gmail.com

I am a recent graduate looking for a software engineering position. I am a hard worker and a fast learner. I am passionate about technology and I want to work at a great company.

Work Experience

Retail Associate at Best Buy, 2022-2023
- Helped customers find electronics
- Worked the register and handled returns
- Stocked shelves and organized displays

Freelance Web Developer, 2023
- Made a few websites for local businesses
- Used WordPress to set up blogs
- Helped clients update their content

School Projects
- Did a group project for my databases class
- Worked on a Java assignment about data structures
- Made a simple website for my web development class

I know some Python and JavaScript. I have also used HTML and CSS. I am currently learning React.`;

const NO_METRICS_RESUME = `PRIYA SHARMA
Austin, TX | priya.sharma@email.com | linkedin.com/in/priyasharma

EDUCATION
Bachelor of Science in Computer Science, UT Austin, 2023

EXPERIENCE

Software Developer | DataFlow Systems | 2023 - Present
- Developed backend services using Python and Flask for the core API platform
- Worked with the team to migrate legacy services to a microservices architecture
- Implemented authentication and authorization using OAuth 2.0 and JWT tokens
- Participated in on-call rotations and helped resolve production incidents
- Collaborated with frontend developers to design and implement REST API endpoints

Junior Developer | WebCraft Agency | Summer 2022
- Built responsive web applications using React and TypeScript
- Maintained and updated existing client websites using JavaScript and CSS
- Wrote unit tests using Jest to improve code coverage
- Assisted senior developers with code reviews and pull request feedback

PROJECTS

TaskManager Pro
- Created a task management application using React, Node.js, and MongoDB
- Implemented user authentication and real-time notifications with WebSockets
- Deployed the application using Docker containers on AWS EC2

Study Group Finder
- Built a mobile-friendly web app using Next.js and PostgreSQL
- Integrated Google Maps API for location-based search functionality

SKILLS
Languages: Python, JavaScript, TypeScript, SQL, Java, Go
Frameworks: React, Flask, Node.js, Next.js, Express
Cloud: AWS (EC2, S3, RDS), Docker, Kubernetes
Tools: Git, Linux, CI/CD, PostgreSQL, MongoDB, Redis
Soft Skills: Team collaboration, Agile methodology, Code review`;

const DEVOPS_RESUME = `MARCUS JOHNSON
Seattle, WA | marcus.j@email.com | github.com/marcusdevops

EDUCATION
Bachelor of Science in Computer Engineering, University of Washington, 2021

EXPERIENCE

Site Reliability Engineer | CloudNova Inc. | 2022 - Present
- Architected and deployed Kubernetes clusters across 3 regions serving 15M+ requests daily with 99.99% uptime
- Reduced infrastructure costs by 35% by implementing auto-scaling policies and right-sizing EC2 instances
- Built end-to-end CI/CD pipelines using GitHub Actions and ArgoCD, cutting deployment time from 45 min to 8 min
- Configured Prometheus and Grafana monitoring stack tracking 500+ metrics with automated alerting
- Authored Terraform modules managing 200+ AWS resources across 4 environments with zero drift
- Implemented service mesh using Istio, reducing inter-service latency by 22% and enabling canary deployments

DevOps Engineer | InfraCore Technologies | 2021 - 2022
- Managed Docker containerization for 30+ microservices, reducing build times by 60%
- Designed disaster recovery procedures achieving RPO of 5 minutes and RTO of 15 minutes
- Automated security scanning with Trivy and Snyk, catching 40+ vulnerabilities before production
- Set up ELK stack (Elasticsearch, Logstash, Kibana) processing 2TB+ of logs daily
- Migrated 12 legacy applications from on-premise to AWS using CloudFormation and Ansible

CERTIFICATIONS
- AWS Solutions Architect Professional
- Certified Kubernetes Administrator (CKA)
- HashiCorp Terraform Associate

PROJECTS

InfraBot - ChatOps for Infrastructure
- Built a Slack bot using Python that automates common infrastructure tasks
- Integrated with Terraform Cloud API to trigger and approve infrastructure changes
- Reduced manual ops tasks by 70%, saving team approximately 20 hours per week

SKILLS
Languages: Python, Go, Bash, JavaScript
Cloud: AWS (EC2, ECS, EKS, Lambda, S3, RDS, CloudFront, IAM), GCP (GKE, Cloud Run)
Infrastructure: Terraform, Ansible, CloudFormation, Pulumi
Containers: Docker, Kubernetes, Helm, Istio, ArgoCD
Monitoring: Prometheus, Grafana, Datadog, ELK Stack, PagerDuty
CI/CD: GitHub Actions, Jenkins, GitLab CI, ArgoCD
Tools: Git, Linux, Nginx, Redis, PostgreSQL, Vault`;

const CAREER_CHANGER_RESUME = `SARAH MARTINEZ
Chicago, IL | sarah.m@email.com | linkedin.com/in/sarahmartinez

EDUCATION
MBA, Northwestern University Kellogg School of Management, 2023
Bachelor of Arts in Economics, University of Michigan, 2018

EXPERIENCE

Business Analyst | Accenture | 2020 - 2023
- Led data analysis for a $2M digital transformation project, identifying 15% cost reduction opportunities
- Created automated Excel dashboards using VBA macros that saved the team 10 hours per week
- Managed stakeholder requirements across 3 concurrent client engagements
- Presented findings to C-suite executives resulting in $500K additional project funding

Financial Analyst | JPMorgan Chase | 2018 - 2020
- Built financial models in Excel to forecast quarterly revenue with 95% accuracy
- Analyzed datasets of 100K+ transactions to identify fraud patterns
- Automated monthly reporting process using Python scripts, reducing turnaround from 3 days to 4 hours

TECHNICAL TRAINING

Full Stack Web Development Bootcamp | 2023
- Completed 12-week intensive program covering JavaScript, React, and Node.js
- Built 5 full-stack projects including an e-commerce platform and a social media dashboard
- Learned Git version control, REST APIs, and basic cloud deployment

Personal Projects
- Portfolio Website: Built with React and deployed on Vercel
- Budget Tracker: Created a personal finance app using React, Express, and MongoDB
- Data Viz Dashboard: Built interactive charts using Python, Pandas, and Plotly

SKILLS
Languages: JavaScript, Python, SQL
Frameworks: React, Node.js, Express
Tools: Git, Excel, Tableau, Power BI
Other: Data Analysis, Financial Modeling, Stakeholder Management, Agile`;

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: "strong",
    name: "Strong SWE Resume",
    description: "Metrics in bullets, action verbs, popular tech stack, standard sections — scores high on impact, keywords, and formatting",
    expectedScore: "high",
    text: SAMPLE_RESUME,
  },
  {
    id: "weak",
    name: "Weak / Vague Resume",
    description: "No metrics, vague descriptions, missing Skills section, no action verbs — scores low across all categories",
    expectedScore: "low",
    text: WEAK_RESUME,
  },
  {
    id: "no-metrics",
    name: "Good Keywords, No Impact",
    description: "Has the right skills and structure but every bullet lacks quantified outcomes — shows how impact scoring works",
    expectedScore: "medium",
    text: NO_METRICS_RESUME,
  },
  {
    id: "devops",
    name: "DevOps / Cloud Specialist",
    description: "Heavy on depth signals (Kubernetes, Terraform, Prometheus) with strong metrics — scores highest on depth and impact",
    expectedScore: "high",
    text: DEVOPS_RESUME,
  },
  {
    id: "career-changer",
    name: "Career Changer (Business → Tech)",
    description: "Has metrics from business roles but fewer tech keywords — shows keyword gap analysis clearly",
    expectedScore: "medium",
    text: CAREER_CHANGER_RESUME,
  },
];
