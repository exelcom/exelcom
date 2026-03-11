namespace GrcPlatform.AuditManagement.Domain.Enums;
public enum AuditType { Internal=1,External=2,Regulatory=3,Supplier=4 }
public enum AuditStatus { Planning=1,InProgress=2,FieldworkComplete=3,UnderReview=4,Closed=5 }
public enum FindingSeverity { Critical=1,High=2,Medium=3,Low=4,Informational=5 }
public enum FindingStatus { Open=1,InRemediation=2,Resolved=3,Accepted=4,Closed=5 }
public enum EvidenceStatus { Requested=1,Submitted=2,Accepted=3,Rejected=4 }
