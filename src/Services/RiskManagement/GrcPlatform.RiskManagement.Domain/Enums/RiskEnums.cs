namespace GrcPlatform.RiskManagement.Domain.Enums;
public enum RiskStatus { Identified = 1, Assessed = 2, Mitigating = 3, Accepted = 4, Closed = 5 }
public enum RiskLikelihood { Rare = 1, Unlikely = 2, Possible = 3, Likely = 4, AlmostCertain = 5 }
public enum RiskImpact { Insignificant = 1, Minor = 2, Moderate = 3, Major = 4, Catastrophic = 5 }
public enum RiskCategory { Strategic = 1, Operational = 2, Financial = 3, Compliance = 4, Technology = 5, Reputational = 6, Legal = 7 }
public enum TreatmentType { Avoid = 1, Reduce = 2, Transfer = 3, Accept = 4 }
