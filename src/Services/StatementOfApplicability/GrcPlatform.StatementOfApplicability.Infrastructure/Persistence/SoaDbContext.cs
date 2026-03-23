using GrcPlatform.StatementOfApplicability.Domain.Entities;
using GrcPlatform.StatementOfApplicability.Domain.Enums;
using GrcPlatform.StatementOfApplicability.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.StatementOfApplicability.Infrastructure.Persistence;

public class SoaDbContext(DbContextOptions<SoaDbContext> options) : DbContext(options)
{
    public DbSet<AnnexAControl> Controls => Set<AnnexAControl>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<AnnexAControl>(e => {
            e.HasKey(c => c.Id);
            e.Property(c => c.ControlId).HasMaxLength(10).IsRequired();
            e.Property(c => c.ControlName).HasMaxLength(200).IsRequired();
            e.Property(c => c.Description).HasMaxLength(2000).IsRequired();
            e.Property(c => c.JustificationForExclusion).HasMaxLength(1000);
            e.Property(c => c.ImplementationNotes).HasMaxLength(2000);
            e.Property(c => c.ResponsibleOwner).HasMaxLength(200);
            e.Property(c => c.EvidenceReference).HasMaxLength(500);
            e.Property(c => c.UpdatedBy).HasMaxLength(200);
            e.HasIndex(c => c.ControlId).IsUnique();
            e.HasIndex(c => c.Domain);
            e.HasIndex(c => c.Applicability);
            e.HasIndex(c => c.ImplementationStatus);
        });
        m.Entity<AnnexAControl>().HasData(SeedData.GetControls());
    }
}

public static class SeedData
{
    private static AnnexAControl Make(string id, string name, string desc, AnnexADomain domain, int sort)
    {
        var c = AnnexAControl.Create(id, name, desc, domain, sort);
        typeof(AnnexAControl).GetProperty("Id")!.SetValue(c, new Guid($"00000000-0000-0000-{sort:0000}-000000000000"));
        typeof(AnnexAControl).GetProperty("CreatedAt")!.SetValue(c, new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        return c;
    }

    public static List<AnnexAControl> GetControls() => new()
    {
        // 5 - Organisational (37 controls)
        Make("5.1","Policies for information security","Information security policy and topic-specific policies shall be defined, approved, published, communicated and reviewed.",AnnexADomain.OrganisationalControls,1),
        Make("5.2","Information security roles and responsibilities","Information security roles and responsibilities shall be defined and allocated according to the organisation needs.",AnnexADomain.OrganisationalControls,2),
        Make("5.3","Segregation of duties","Conflicting duties and conflicting areas of responsibility shall be segregated.",AnnexADomain.OrganisationalControls,3),
        Make("5.4","Management responsibilities","Management shall require all personnel to apply information security in accordance with the established policy.",AnnexADomain.OrganisationalControls,4),
        Make("5.5","Contact with authorities","The organisation shall establish and maintain contact with relevant authorities.",AnnexADomain.OrganisationalControls,5),
        Make("5.6","Contact with special interest groups","The organisation shall establish and maintain contact with special interest groups.",AnnexADomain.OrganisationalControls,6),
        Make("5.7","Threat intelligence","Information relating to information security threats shall be collected and analysed to produce threat intelligence.",AnnexADomain.OrganisationalControls,7),
        Make("5.8","Information security in project management","Information security shall be integrated into project management.",AnnexADomain.OrganisationalControls,8),
        Make("5.9","Inventory of information and other associated assets","An inventory of information and other associated assets shall be developed and maintained.",AnnexADomain.OrganisationalControls,9),
        Make("5.10","Acceptable use of information and other associated assets","Rules for the acceptable use and procedures for handling information shall be identified, documented and implemented.",AnnexADomain.OrganisationalControls,10),
        Make("5.11","Return of assets","Personnel and other interested parties shall return all the organisation assets upon change or termination of their employment.",AnnexADomain.OrganisationalControls,11),
        Make("5.12","Classification of information","Information shall be classified according to the information security needs of the organisation.",AnnexADomain.OrganisationalControls,12),
        Make("5.13","Labelling of information","An appropriate set of procedures for information labelling shall be developed and implemented.",AnnexADomain.OrganisationalControls,13),
        Make("5.14","Information transfer","Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities.",AnnexADomain.OrganisationalControls,14),
        Make("5.15","Access control","Rules to control physical and logical access to information and other associated assets shall be established and implemented.",AnnexADomain.OrganisationalControls,15),
        Make("5.16","Identity management","The full life cycle of identities shall be managed.",AnnexADomain.OrganisationalControls,16),
        Make("5.17","Authentication information","Allocation and management of authentication information shall be controlled by a management process.",AnnexADomain.OrganisationalControls,17),
        Make("5.18","Access rights","Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed.",AnnexADomain.OrganisationalControls,18),
        Make("5.19","Information security in supplier relationships","Processes and procedures shall be defined and implemented to manage information security risks associated with the use of supplier products or services.",AnnexADomain.OrganisationalControls,19),
        Make("5.20","Addressing information security within supplier agreements","Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.",AnnexADomain.OrganisationalControls,20),
        Make("5.21","Managing information security in the ICT supply chain","Processes and procedures shall be defined and implemented to manage information security risks associated with the ICT products and services supply chain.",AnnexADomain.OrganisationalControls,21),
        Make("5.22","Monitoring, review and change management of supplier services","The organisation shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.",AnnexADomain.OrganisationalControls,22),
        Make("5.23","Information security for use of cloud services","Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organisation information security requirements.",AnnexADomain.OrganisationalControls,23),
        Make("5.24","Information security incident management planning and preparation","The organisation shall plan and prepare for managing information security incidents by defining, establishing and communicating incident management processes.",AnnexADomain.OrganisationalControls,24),
        Make("5.25","Assessment and decision on information security events","The organisation shall assess information security events and decide if they are to be categorised as information security incidents.",AnnexADomain.OrganisationalControls,25),
        Make("5.26","Response to information security incidents","Information security incidents shall be responded to in accordance with the documented procedures.",AnnexADomain.OrganisationalControls,26),
        Make("5.27","Learning from information security incidents","Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.",AnnexADomain.OrganisationalControls,27),
        Make("5.28","Collection of evidence","The organisation shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.",AnnexADomain.OrganisationalControls,28),
        Make("5.29","Information security during disruption","The organisation shall plan how to maintain information security at an appropriate level during disruption.",AnnexADomain.OrganisationalControls,29),
        Make("5.30","ICT readiness for business continuity","ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.",AnnexADomain.OrganisationalControls,30),
        Make("5.31","Legal, statutory, regulatory and contractual requirements","Legal, statutory, regulatory and contractual requirements relevant to information security and the organisation approach to meet these requirements shall be identified.",AnnexADomain.OrganisationalControls,31),
        Make("5.32","Intellectual property rights","The organisation shall implement appropriate procedures to protect intellectual property rights.",AnnexADomain.OrganisationalControls,32),
        Make("5.33","Protection of records","Records shall be protected from loss, destruction, falsification, unauthorised access and unauthorised release.",AnnexADomain.OrganisationalControls,33),
        Make("5.34","Privacy and protection of PII","The organisation shall identify and meet the requirements regarding the preservation of privacy and protection of personally identifiable information.",AnnexADomain.OrganisationalControls,34),
        Make("5.35","Independent review of information security","The organisation approach to managing information security and its implementation shall be reviewed independently at planned intervals.",AnnexADomain.OrganisationalControls,35),
        Make("5.36","Compliance with policies, rules and standards","Compliance with the organisation information security policy, topic-specific policies, rules and standards shall be regularly reviewed.",AnnexADomain.OrganisationalControls,36),
        Make("5.37","Documented operating procedures","Operating procedures for information processing facilities shall be documented and made available to personnel who need them.",AnnexADomain.OrganisationalControls,37),
        // 6 - People (8 controls)
        Make("6.1","Screening","Background verification checks on all candidates shall be carried out prior to joining the organisation.",AnnexADomain.PeopleControls,38),
        Make("6.2","Terms and conditions of employment","Employment contractual agreements shall state the personnel and the organisation responsibilities for information security.",AnnexADomain.PeopleControls,39),
        Make("6.3","Information security awareness, education and training","Personnel of the organisation and relevant interested parties shall receive appropriate information security awareness, education and training.",AnnexADomain.PeopleControls,40),
        Make("6.4","Disciplinary process","A disciplinary process shall be formalised and communicated to take actions against personnel who have committed an information security policy violation.",AnnexADomain.PeopleControls,41),
        Make("6.5","Responsibilities after termination or change of employment","Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated.",AnnexADomain.PeopleControls,42),
        Make("6.6","Confidentiality or non-disclosure agreements","Confidentiality or non-disclosure agreements reflecting the organisation needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel.",AnnexADomain.PeopleControls,43),
        Make("6.7","Remote working","Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organisation premises.",AnnexADomain.PeopleControls,44),
        Make("6.8","Information security event reporting","The organisation shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.",AnnexADomain.PeopleControls,45),
        // 7 - Physical (14 controls)
        Make("7.1","Physical security perimeters","Security perimeters shall be defined and used to protect areas that contain information and other associated assets.",AnnexADomain.PhysicalControls,46),
        Make("7.2","Physical entry","Secure areas shall be protected by appropriate entry controls and access points.",AnnexADomain.PhysicalControls,47),
        Make("7.3","Securing offices, rooms and facilities","Physical security for offices, rooms and facilities shall be designed and implemented.",AnnexADomain.PhysicalControls,48),
        Make("7.4","Physical security monitoring","Premises shall be continuously monitored for unauthorised physical access.",AnnexADomain.PhysicalControls,49),
        Make("7.5","Protecting against physical and environmental threats","Protection against physical and environmental threats shall be designed and implemented.",AnnexADomain.PhysicalControls,50),
        Make("7.6","Working in secure areas","Security measures for working in secure areas shall be designed and implemented.",AnnexADomain.PhysicalControls,51),
        Make("7.7","Clear desk and clear screen","Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and enforced.",AnnexADomain.PhysicalControls,52),
        Make("7.8","Equipment siting and protection","Equipment shall be sited securely and protected.",AnnexADomain.PhysicalControls,53),
        Make("7.9","Security of assets off-premises","Off-site assets shall be protected.",AnnexADomain.PhysicalControls,54),
        Make("7.10","Storage media","Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organisation classification scheme.",AnnexADomain.PhysicalControls,55),
        Make("7.11","Supporting utilities","Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.",AnnexADomain.PhysicalControls,56),
        Make("7.12","Cabling security","Cables carrying power, data or supporting information services shall be protected from interception, interference or damage.",AnnexADomain.PhysicalControls,57),
        Make("7.13","Equipment maintenance","Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.",AnnexADomain.PhysicalControls,58),
        Make("7.14","Secure disposal or re-use of equipment","Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten.",AnnexADomain.PhysicalControls,59),
        // 8 - Technological (34 controls)
        Make("8.1","User endpoint devices","Information stored on, processed by or accessible via user endpoint devices shall be protected.",AnnexADomain.TechnologicalControls,60),
        Make("8.2","Privileged access rights","The allocation and use of privileged access rights shall be restricted and managed.",AnnexADomain.TechnologicalControls,61),
        Make("8.3","Information access restriction","Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.",AnnexADomain.TechnologicalControls,62),
        Make("8.4","Access to source code","Read and write access to source code, development tools and software libraries shall be appropriately managed.",AnnexADomain.TechnologicalControls,63),
        Make("8.5","Secure authentication","Secure authentication technologies and procedures shall be implemented based on information access restrictions and topic-specific policy on access control.",AnnexADomain.TechnologicalControls,64),
        Make("8.6","Capacity management","The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.",AnnexADomain.TechnologicalControls,65),
        Make("8.7","Protection against malware","Protection against malware shall be implemented and supported by appropriate user awareness.",AnnexADomain.TechnologicalControls,66),
        Make("8.8","Management of technical vulnerabilities","Information about technical vulnerabilities of information systems in use shall be obtained in a timely fashion to assess the organisation exposure to such vulnerabilities.",AnnexADomain.TechnologicalControls,67),
        Make("8.9","Configuration management","Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.",AnnexADomain.TechnologicalControls,68),
        Make("8.10","Information deletion","Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.",AnnexADomain.TechnologicalControls,69),
        Make("8.11","Data masking","Data masking shall be used in accordance with the organisation topic-specific policy on access control and other related topic-specific policies.",AnnexADomain.TechnologicalControls,70),
        Make("8.12","Data leakage prevention","Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.",AnnexADomain.TechnologicalControls,71),
        Make("8.13","Information backup","Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.",AnnexADomain.TechnologicalControls,72),
        Make("8.14","Redundancy of information processing facilities","Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.",AnnexADomain.TechnologicalControls,73),
        Make("8.15","Logging","Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.",AnnexADomain.TechnologicalControls,74),
        Make("8.16","Monitoring activities","Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.",AnnexADomain.TechnologicalControls,75),
        Make("8.17","Clock synchronisation","The clocks of information processing systems used by the organisation shall be synchronised to approved time sources.",AnnexADomain.TechnologicalControls,76),
        Make("8.18","Use of privileged utility programs","The use of utility programs that might be capable of overriding system and application controls shall be restricted and tightly controlled.",AnnexADomain.TechnologicalControls,77),
        Make("8.19","Installation of software on operational systems","Procedures and measures shall be implemented to securely manage software installation on operational systems.",AnnexADomain.TechnologicalControls,78),
        Make("8.20","Networks security","Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.",AnnexADomain.TechnologicalControls,79),
        Make("8.21","Security of network services","Security mechanisms, service levels and service requirements of all network services shall be identified, implemented and monitored.",AnnexADomain.TechnologicalControls,80),
        Make("8.22","Segregation of networks","Groups of information services, users and information systems shall be segregated in the organisation networks.",AnnexADomain.TechnologicalControls,81),
        Make("8.23","Web filtering","Access to external websites shall be managed to reduce exposure to malicious content.",AnnexADomain.TechnologicalControls,82),
        Make("8.24","Use of cryptography","Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.",AnnexADomain.TechnologicalControls,83),
        Make("8.25","Secure development life cycle","Rules for the secure development of software and systems shall be established and applied to developments within the organisation.",AnnexADomain.TechnologicalControls,84),
        Make("8.26","Application security requirements","Information security requirements shall be identified, specified and approved when developing or acquiring applications.",AnnexADomain.TechnologicalControls,85),
        Make("8.27","Secure system architecture and engineering principles","Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.",AnnexADomain.TechnologicalControls,86),
        Make("8.28","Secure coding","Secure coding principles shall be applied to software development.",AnnexADomain.TechnologicalControls,87),
        Make("8.29","Security testing in development and acceptance","Security testing processes shall be defined and implemented in the development life cycle.",AnnexADomain.TechnologicalControls,88),
        Make("8.30","Outsourced development","The organisation shall direct, monitor and review the activities related to outsourced system development.",AnnexADomain.TechnologicalControls,89),
        Make("8.31","Separation of development, test and production environments","Development, testing and production environments shall be identified and secured.",AnnexADomain.TechnologicalControls,90),
        Make("8.32","Change management","Changes to information processing facilities and information systems shall be subject to change management procedures.",AnnexADomain.TechnologicalControls,91),
        Make("8.33","Test information","Test information shall be appropriately selected, protected and managed.",AnnexADomain.TechnologicalControls,92),
        Make("8.34","Protection of information systems during audit testing","Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.",AnnexADomain.TechnologicalControls,93),
    };
}

public class SoaRepository(SoaDbContext db) : ISoaRepository
{
    public async Task<List<AnnexAControl>> GetAllAsync(CancellationToken ct = default) =>
        await db.Controls.OrderBy(c => c.SortOrder).ToListAsync(ct);

    public async Task<AnnexAControl?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Controls.FindAsync([id], ct);

    public Task UpdateAsync(AnnexAControl control, CancellationToken ct = default)
    {
        db.Controls.Update(control);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
