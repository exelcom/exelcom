// ISO 27001:2022 Policy Templates for Exelcom GRC Platform

export interface PolicyTemplate {
  id: string;
  title: string;
  description: string;
  category: number;
  owner: string;
  department: string;
  requiresAttestation: boolean;
  isoClause: string;
  content: string;
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "isms-policy",
    title: "Information Security Management System (ISMS) Policy",
    description: "Top-level policy establishing Exelcom's commitment to information security management in accordance with ISO/IEC 27001:2022.",
    category: 1,
    owner: "CISO",
    department: "IT Security",
    requiresAttestation: true,
    isoClause: "Clause 5.2",
    content: `INFORMATION SECURITY MANAGEMENT SYSTEM (ISMS) POLICY

1. PURPOSE
This policy establishes Exelcom's commitment to protecting the confidentiality, integrity, and availability of information assets in accordance with ISO/IEC 27001:2022.

2. SCOPE
This policy applies to all Exelcom employees, contractors, consultants, and third parties who access, process, or manage Exelcom information assets, systems, and services.

3. POLICY STATEMENT
Exelcom is committed to:
a) Establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS).
b) Protecting information assets from all threats, whether internal or external, deliberate or accidental.
c) Ensuring the confidentiality, integrity, and availability of information.
d) Complying with all applicable legal, regulatory, and contractual requirements relating to information security.
e) Setting and achieving information security objectives aligned with business goals.
f) Managing information security risks to an acceptable level.

4. RESPONSIBILITIES
4.1 Board of Directors
- Provide strategic direction and oversight of the ISMS.
- Approve the Information Security Policy and objectives.

4.2 Chief Information Security Officer (CISO)
- Own and maintain the ISMS.
- Report on information security performance to senior management.

4.3 All Staff
- Comply with all information security policies and procedures.
- Report information security incidents and vulnerabilities promptly.
- Complete mandatory information security awareness training.

5. INFORMATION SECURITY OBJECTIVES
Exelcom shall establish measurable information security objectives that are:
- Consistent with the information security policy.
- Monitored and reported on a regular basis.
- Updated as necessary to reflect changes in the business environment.

6. RISK MANAGEMENT
Exelcom shall implement a risk-based approach to information security, including:
- Regular risk assessments to identify and evaluate information security risks.
- Implementation of appropriate controls to treat identified risks.
- Monitoring and review of risk treatment effectiveness.

7. COMPLIANCE
Non-compliance with this policy may result in disciplinary action, up to and including termination of employment or contract.

8. REVIEW
This policy shall be reviewed annually or following significant changes to the business or threat environment.

Document Owner: CISO
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "access-control",
    title: "Access Control Policy",
    description: "Policy governing access to Exelcom information systems and data, ensuring only authorised users have appropriate access.",
    category: 1,
    owner: "CISO",
    department: "IT Security",
    requiresAttestation: true,
    isoClause: "Annex A 5.15–5.18",
    content: `ACCESS CONTROL POLICY

1. PURPOSE
To ensure that access to Exelcom information and systems is appropriately controlled, protecting against unauthorised access.

2. SCOPE
This policy applies to all information systems, applications, networks, and data owned or managed by Exelcom.

3. POLICY STATEMENT

3.1 Access Management Principles
- Access shall be granted on a need-to-know and least privilege basis.
- All access rights shall be formally requested, approved, and documented.
- Access rights shall be reviewed regularly and revoked when no longer required.

3.2 User Access Provisioning
- All user accounts must be formally requested by the user's manager.
- Access requests must be approved by the system or data owner.
- User accounts must be created using the identity management process.
- Generic or shared accounts are prohibited except where technically necessary.

3.3 Privileged Access
- Privileged access (administrator accounts) must be strictly controlled.
- Privileged accounts must not be used for routine activities.
- All privileged access must be logged and monitored.
- Multi-factor authentication (MFA) is mandatory for all privileged accounts.

3.4 Remote Access
- Remote access to Exelcom systems requires MFA.
- Remote access sessions must use encrypted connections (VPN or equivalent).
- Remote access activity shall be logged and monitored.

3.5 Password Requirements
- Passwords must meet minimum complexity requirements.
- Passwords must not be shared or written down.
- Default passwords must be changed immediately upon first use.
- Password managers are recommended for managing passwords.

3.6 Access Reviews
- User access rights shall be reviewed at least every six months.
- Access rights shall be immediately revoked upon termination or role change.
- Managers are responsible for reviewing and certifying their team's access rights.

3.7 Physical Access
- Physical access to information processing facilities shall be controlled.
- Visitors must be escorted at all times in secure areas.

4. RESPONSIBILITIES
- IT Team: Implement and maintain access control systems.
- Managers: Approve and review access requests for their team.
- All Staff: Protect their credentials and report any suspected compromise.

5. REVIEW
This policy shall be reviewed annually.

Document Owner: CISO
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "incident-response",
    title: "Information Security Incident Management Policy",
    description: "Policy defining how Exelcom detects, reports, manages, and learns from information security incidents.",
    category: 1,
    owner: "CISO",
    department: "IT Security",
    requiresAttestation: true,
    isoClause: "Annex A 5.24–5.28",
    content: `INFORMATION SECURITY INCIDENT MANAGEMENT POLICY

1. PURPOSE
To ensure information security incidents are detected, reported, assessed, and responded to in a timely and consistent manner, minimising impact to Exelcom operations.

2. SCOPE
This policy applies to all information security events and incidents affecting Exelcom information assets, systems, and services.

3. DEFINITIONS
- Event: Any observable occurrence in a system or network.
- Incident: An event that has or could have a negative impact on information security.
- Privacy Breach: Unauthorised access, disclosure, or loss of personal information.

4. INCIDENT CATEGORIES
- Category 1 (Critical): Major breach, ransomware, data exfiltration, extended outage.
- Category 2 (High): Malware infection, unauthorised access, significant data loss.
- Category 3 (Medium): Phishing attempt, policy violation, minor system compromise.
- Category 4 (Low): Suspicious activity, minor policy violation, unsuccessful attack.

5. REPORTING REQUIREMENTS
5.1 All Staff
- Must report suspected incidents immediately via the GRC platform or helpdesk.
- Must not attempt to investigate or remediate incidents independently.
- Must preserve evidence and not power off systems without IT guidance.

5.2 Reporting Timeframes
- Critical/High incidents: Report immediately (within 1 hour).
- Medium incidents: Report within 4 hours.
- Low incidents: Report within 24 hours.

6. INCIDENT RESPONSE PROCESS
6.1 Detection & Reporting
All staff report suspected incidents to the IT Security team.

6.2 Assessment & Classification
IT Security assesses and classifies the incident within the defined timeframes.

6.3 Containment
Immediate actions taken to limit the impact of the incident.

6.4 Investigation
Root cause analysis and evidence collection.

6.5 Eradication & Recovery
Remove the threat and restore normal operations.

6.6 Post-Incident Review
Document lessons learned and implement improvements.

7. REGULATORY NOTIFICATIONS
- Notifiable data breaches under the Privacy Act must be reported to the OAIC within 30 days.
- The CISO is responsible for regulatory notifications.

8. RESPONSIBILITIES
- All Staff: Report incidents promptly.
- IT Security: Manage the incident response process.
- CISO: Oversee major incidents and regulatory notifications.
- Management: Approve major response decisions.

9. REVIEW
This policy shall be reviewed annually and after significant incidents.

Document Owner: CISO
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "data-classification",
    title: "Information Classification Policy",
    description: "Policy defining how Exelcom classifies information assets to ensure appropriate protection measures are applied.",
    category: 2,
    owner: "CISO",
    department: "IT Security",
    requiresAttestation: true,
    isoClause: "Annex A 5.12–5.13",
    content: `INFORMATION CLASSIFICATION POLICY

1. PURPOSE
To ensure that Exelcom information receives an appropriate level of protection by establishing a consistent classification scheme.

2. SCOPE
This policy applies to all information created, stored, processed, or transmitted by Exelcom, regardless of format or media.

3. CLASSIFICATION LEVELS

3.1 PUBLIC
- Description: Information approved for public release.
- Examples: Marketing materials, published reports, website content.
- Handling: No restrictions on distribution.

3.2 INTERNAL
- Description: General business information for internal use.
- Examples: Policies, procedures, internal announcements.
- Handling: Must not be shared externally without approval.

3.3 CONFIDENTIAL
- Description: Sensitive business information with limited distribution.
- Examples: Customer data, contracts, financial reports, strategic plans.
- Handling: Encrypted in transit and at rest; access on need-to-know basis.

3.4 RESTRICTED
- Description: Highly sensitive information requiring strict controls.
- Examples: Authentication credentials, encryption keys, personal health information.
- Handling: Strict access controls, encrypted, logged access, secure disposal.

4. LABELLING REQUIREMENTS
- All documents must be labelled with their classification level.
- Emails containing Confidential or Restricted information must be marked accordingly.
- Electronic files must include classification in the document header or footer.

5. HANDLING REQUIREMENTS BY CLASSIFICATION

5.1 Storage
- Public: Any storage medium.
- Internal: Exelcom systems only.
- Confidential: Encrypted storage; approved cloud services only.
- Restricted: Encrypted; approved systems only; access logged.

5.2 Transmission
- Public: Any method.
- Internal: Standard email within Exelcom.
- Confidential: Encrypted email or secure file transfer.
- Restricted: End-to-end encrypted channels only.

5.3 Disposal
- Public/Internal: Standard disposal.
- Confidential/Restricted: Secure deletion or physical destruction.

6. RECLASSIFICATION
Information may be reclassified by the data owner when the sensitivity changes.

7. RESPONSIBILITIES
- Data Owners: Classify and maintain classification of their data.
- All Staff: Handle information according to its classification.
- IT Team: Implement technical controls for each classification level.

8. REVIEW
This policy shall be reviewed annually.

Document Owner: CISO
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use Policy",
    description: "Policy governing the acceptable use of Exelcom information systems, equipment, and resources by all staff.",
    category: 7,
    owner: "CISO",
    department: "Human Resources",
    requiresAttestation: true,
    isoClause: "Annex A 5.10",
    content: `ACCEPTABLE USE POLICY

1. PURPOSE
To define acceptable use of Exelcom information systems, technology resources, and data to protect Exelcom and its staff from security risks and legal liability.

2. SCOPE
This policy applies to all staff, contractors, and third parties using Exelcom-owned or managed technology resources.

3. ACCEPTABLE USE

3.1 General Principles
Exelcom technology resources are provided for business purposes. Limited personal use is permitted provided it:
- Does not interfere with work responsibilities.
- Does not consume excessive resources.
- Complies with all applicable laws and this policy.

3.2 Acceptable Activities
- Business communications via approved email and messaging platforms.
- Access to business applications and data required for job functions.
- Professional development and research relevant to job roles.
- Limited personal use during breaks.

4. UNACCEPTABLE USE
The following activities are strictly prohibited:

4.1 Security Violations
- Attempting to bypass security controls or gain unauthorised access.
- Installing unauthorised software or hardware.
- Sharing credentials or allowing others to use your account.
- Disabling or circumventing security software.

4.2 Illegal Activities
- Accessing, downloading, or distributing illegal content.
- Copyright infringement or software piracy.
- Fraud, harassment, or defamation.
- Activities that violate applicable laws or regulations.

4.3 Inappropriate Content
- Accessing or distributing pornographic, violent, or offensive material.
- Harassment, discrimination, or bullying via Exelcom systems.
- Sending unsolicited bulk communications (spam).

4.4 Data Misuse
- Unauthorised disclosure of confidential or customer information.
- Personal use or sale of Exelcom data.
- Removing confidential data from Exelcom systems without authorisation.

5. MONITORING
Exelcom reserves the right to monitor use of its technology resources. Users should have no expectation of privacy when using Exelcom systems.

6. PERSONAL DEVICES (BYOD)
- Personal devices used for work must comply with Exelcom's security requirements.
- Mobile Device Management (MDM) software may be required.
- Exelcom data on personal devices is subject to this policy.

7. INTERNET & EMAIL
- Internet usage is monitored and filtered.
- Email sent via Exelcom systems represents the company.
- Users must not send confidential information to personal email accounts.

8. SOCIAL MEDIA
- Staff must not disclose confidential information on social media.
- Staff must make clear when expressing personal opinions that views are their own.

9. CONSEQUENCES
Violations may result in disciplinary action, up to and including termination.

10. REVIEW
This policy shall be reviewed annually.

Document Owner: CISO
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "business-continuity",
    title: "Business Continuity Policy",
    description: "Policy establishing Exelcom's commitment to maintaining critical business functions during and after disruptive incidents.",
    category: 4,
    owner: "CEO",
    department: "Operations",
    requiresAttestation: false,
    isoClause: "Annex A 5.29–5.30",
    content: `BUSINESS CONTINUITY POLICY

1. PURPOSE
To ensure Exelcom can continue delivering critical services to customers and maintain essential operations during and following disruptive incidents.

2. SCOPE
This policy applies to all Exelcom business operations, systems, and staff.

3. POLICY STATEMENT
Exelcom is committed to:
- Identifying and protecting critical business functions and resources.
- Developing and maintaining business continuity and disaster recovery plans.
- Testing continuity arrangements regularly to ensure effectiveness.
- Meeting recovery objectives for critical systems and services.

4. RECOVERY OBJECTIVES

4.1 Recovery Time Objective (RTO)
- Critical systems: 4 hours.
- Important systems: 24 hours.
- Standard systems: 72 hours.

4.2 Recovery Point Objective (RPO)
- Critical data: 1 hour.
- Important data: 24 hours.
- Standard data: 48 hours.

5. BUSINESS CONTINUITY FRAMEWORK

5.1 Business Impact Analysis (BIA)
Exelcom shall conduct a BIA annually to identify:
- Critical business functions and dependencies.
- Maximum tolerable downtime for each function.
- Resource requirements for recovery.

5.2 Risk Assessment
Business continuity risks shall be assessed as part of the overall risk management process.

5.3 Business Continuity Plans
Plans shall be developed for:
- IT disaster recovery.
- Critical business function continuity.
- Crisis communications.
- Staff welfare and safety.

6. TESTING AND EXERCISING
Business continuity plans shall be tested:
- Annually through tabletop exercises.
- Biennially through live recovery tests.
- Following any significant change to systems or processes.

7. BACKUP AND RECOVERY
- Critical data must be backed up daily.
- Backups must be stored in a separate geographic location.
- Backup restoration must be tested quarterly.

8. RESPONSIBILITIES
- CEO: Executive ownership of business continuity.
- Operations Manager: Coordinate business continuity planning.
- IT Manager: Implement and test disaster recovery.
- All Staff: Familiarise themselves with continuity procedures.

9. REVIEW
This policy shall be reviewed annually and following any significant incident.

Document Owner: CEO
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "data-privacy",
    title: "Privacy Policy (Internal)",
    description: "Internal policy governing how Exelcom collects, uses, stores, and protects personal information in compliance with the Australian Privacy Act.",
    category: 2,
    owner: "Privacy Officer",
    department: "Legal",
    requiresAttestation: true,
    isoClause: "Annex A 5.34",
    content: `PRIVACY POLICY (INTERNAL)

1. PURPOSE
To ensure Exelcom handles personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).

2. SCOPE
This policy applies to all personal information collected, used, stored, or disclosed by Exelcom in the course of its business activities.

3. WHAT IS PERSONAL INFORMATION
Personal information means information or an opinion about an identified individual, or an individual who is reasonably identifiable, including:
- Name, address, phone number, email address.
- Employment information.
- Financial information.
- Health information (sensitive information).
- Customer information.

4. COLLECTION OF PERSONAL INFORMATION
- Exelcom collects personal information only when necessary for its business functions.
- Personal information is collected directly from individuals where practicable.
- Individuals must be notified of the purpose of collection at the time of collection.

5. USE AND DISCLOSURE
- Personal information is used only for the purpose for which it was collected.
- Personal information is not disclosed to third parties without consent, except as required by law.
- Cross-border disclosure of personal information requires appropriate safeguards.

6. DATA QUALITY AND SECURITY
- Exelcom takes reasonable steps to ensure personal information is accurate and up-to-date.
- Personal information is protected by appropriate technical and organisational security measures.
- Personal information is retained only for as long as necessary.

7. NOTIFIABLE DATA BREACHES
In the event of an eligible data breach:
- The Privacy Officer must be notified immediately.
- Assessment must be completed within 30 days.
- Notification to the OAIC and affected individuals as required.

8. INDIVIDUAL RIGHTS
Individuals have the right to:
- Access their personal information held by Exelcom.
- Request correction of inaccurate information.
- Make a privacy complaint.

9. PRIVACY COMPLAINTS
Privacy complaints should be directed to the Privacy Officer at privacy@exelcom.au. Complaints will be investigated and responded to within 30 days.

10. RESPONSIBILITIES
- Privacy Officer: Oversee privacy compliance and handle complaints.
- All Staff: Handle personal information in accordance with this policy.
- IT Team: Implement technical controls to protect personal information.

11. REVIEW
This policy shall be reviewed annually or following changes to privacy legislation.

Document Owner: Privacy Officer
Review Cycle: Annual
Classification: Internal`,
  },
  {
    id: "supplier-security",
    title: "Supplier and Third-Party Security Policy",
    description: "Policy governing information security requirements for Exelcom suppliers, vendors, and third-party service providers.",
    category: 1,
    owner: "CISO",
    department: "IT Security",
    requiresAttestation: false,
    isoClause: "Annex A 5.19–5.22",
    content: `SUPPLIER AND THIRD-PARTY SECURITY POLICY

1. PURPOSE
To ensure that information security risks associated with suppliers and third parties are identified, assessed, and managed appropriately.

2. SCOPE
This policy applies to all suppliers, vendors, contractors, and third-party service providers who access, process, or manage Exelcom information or systems.

3. POLICY STATEMENT
Exelcom requires all third parties handling its information to maintain appropriate security standards commensurate with the sensitivity of the information accessed.

4. SUPPLIER RISK ASSESSMENT
Before engaging a supplier:
- A security risk assessment must be completed.
- The supplier's security posture must be evaluated.
- Information security requirements must be agreed upon.

5. CONTRACTUAL REQUIREMENTS
All supplier agreements must include:
- Information security obligations aligned with this policy.
- Data handling and confidentiality requirements.
- Incident notification requirements (within 24 hours).
- Right to audit security practices.
- Requirements for sub-contractor management.
- Data return and deletion obligations upon contract termination.

6. SUPPLIER ONBOARDING
- Suppliers must complete Exelcom's security assessment questionnaire.
- Suppliers handling sensitive data must provide evidence of security certifications (e.g. ISO 27001, SOC 2).
- Access to Exelcom systems must be provided on a least privilege basis.

7. ONGOING MONITORING
- Supplier security performance shall be reviewed annually.
- Critical suppliers shall be reviewed more frequently.
- Significant security incidents at suppliers must be reported to Exelcom within 24 hours.

8. CLOUD SERVICES
- Cloud service providers must be approved by the IT Security team.
- Data residency requirements must be confirmed before adoption.
- Cloud services processing personal information must comply with Privacy Act requirements.

9. ACCESS MANAGEMENT
- Supplier access must be provisioned through the standard access request process.
- Supplier access must be time-limited and reviewed regularly.
- All supplier access must be revoked upon contract expiry or termination.

10. RESPONSIBILITIES
- Procurement: Ensure security requirements are included in contracts.
- CISO: Approve high-risk supplier relationships.
- IT Security: Assess supplier security and monitor compliance.
- Contract Managers: Monitor supplier performance against security obligations.

11. REVIEW
This policy shall be reviewed annually.

Document Owner: CISO
Review Cycle: Annual
Classification: Internal`,
  },
];

export const TEMPLATE_CATEGORIES: Record<number, string> = {
  1: 'Information Security',
  2: 'Data Privacy',
  3: 'Risk Management',
  4: 'Business Continuity',
  5: 'Human Resources',
  6: 'Legal',
  7: 'Operational',
};
