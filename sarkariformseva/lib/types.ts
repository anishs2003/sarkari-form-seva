export type NotificationStatus =
  | "draft"
  | "pending-review"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

export type NotificationCategory =
  | "SSC"
  | "UPSC"
  | "Railway"
  | "IBPS"
  | "SBI"
  | "Banking"
  | "Defence"
  | "Police"
  | "Teaching"
  | "State Government Jobs"
  | "Government Schemes"
  | "Scholarship"
  | "Universities"
  | "Colleges"
  | "Board Exams"
  | "Admission"
  | "Answer Key"
  | "Syllabus"
  | "Certificate"
  | "Outsourcing / Offline Jobs"
  | "Admit Card"
  | "Results"
  | "Government Job"
  | "New Form"
  | "Entrance Exam"
  | "Other";

export type NotificationItem = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  category: NotificationCategory;
  shortDescription: string;
  description: string;
  notificationDate: string;
  applicationStartDate: string;
  lastDate: string;
  examDate: string;
  vacancy: string;
  eligibility: string;
  ageLimit: string;
  qualification?: string;
  applicationFee: string;
  notificationPdfUrl?: string;
  officialNotificationUrl: string;
  officialWebsiteUrl: string;
  applyOnlineUrl: string;
  requiredDocuments?: string;
  serviceCharge?: string;
  source: string;
  fetchedDate: string;
  featured?: boolean;
  keepVisibleAfterLastDate?: boolean;
  status: NotificationStatus;
  seoTitle: string;
  metaDescription: string;
};

export type ApplicationStatus =
  | "Draft"
  | "Documents Pending"
  | "Payment Pending"
  | "Payment Verification"
  | "Paid"
  | "Under Review"
  | "Information Required"
  | "Form Filling In Progress"
  | "Form Submitted"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export type ApplicationSummary = {
  id: string;
  studentName: string;
  mobile: string;
  service: string;
  status: ApplicationStatus;
  amount: string;
  paymentStatus: "Pending" | "Verification Pending" | "Paid" | "Rejected";
  lastUpdated: string;
  currentStep: string;
  adminMessage: string;
};
