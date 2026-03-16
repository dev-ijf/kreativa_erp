# PRODUCT & TECHNICAL REQUIREMENTS DOCUMENT  
## System: Kreativa Education Network Admin Panel

Version: 1.1  
Architecture Revision: 2.0  
Focus: Multi-Tenant School Management, Tuition Billing & Bilingual Support  
Architecture Goals: Multi-Agent Ready, Modular Services, Reusable Components, Event Driven Integration

---

# PART 0: SYSTEM ARCHITECTURE CONTEXT (NEW)

This document defines the **Product Requirements (PRD)** and **Technical Requirements (TRD)** for the **Kreativa Education Network Admin Panel**.

The system is designed using **modern SaaS architecture principles** to ensure:

- Multi-tenant scalability
- Modular services
- Reusable UI and backend components
- Event-driven integrations
- AI / Automation agent compatibility

---

# 0.1 Architecture Goals

The system must support the following capabilities:

### Multi-Tenant SaaS Platform
A single platform serving multiple schools under a foundation.

### Modular Domain Services
Each major business domain must be implemented as an independent module:

- Student Service
- Academic Service
- Billing Service
- Payment Service
- Notification Service
- Reporting Service
- Integration Service

These modules may later evolve into **microservices** without breaking the system.

---

### Multi-Agent Ready System

The architecture must support **automation agents and AI-driven workflows**.

Example agents:

Billing Agent  
Automatically generates tuition bills.

Reminder Agent  
Detects arrears and triggers reminder notifications.

Accounting Sync Agent  
Synchronizes financial transactions to ZAINS accounting system.

Analytics Agent  
Produces financial and student insights.

These agents communicate through **event queues or background workers**.

---

### Event Driven Integration

All important business events must emit **domain events**.

Examples:

```
BillGenerated
BillPaid
StudentPromoted
StudentRegistered
TransactionCreated
NotificationSent
```

Events can trigger:

- Notifications
- Accounting synchronization
- Reports
- Automation agents

---

### Reusable Component Strategy

The system must use reusable components for both:

Frontend  
Backend

Frontend reusable components:

- Form components
- Table components
- CRUD generators
- File upload modules
- Matrix visualization widgets

Backend reusable modules:

- Auth middleware
- Multi-tenant query guard
- Billing engine
- Notification engine
- Audit logger

---

### API First Design

All system functionality must be accessible through APIs.

This allows:

- Admin Panel
- Parent Portal
- Mobile apps
- AI agents
- Integrations

To reuse the same backend services.

---

# PART 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

# 1.1 Summary & Objectives

The Admin Panel serves as the **command center for the operational activities of both the schools and the foundation**.

Its primary objectives are:

---

### Multi-Tenant Architecture

Support a structure where:

Foundation (Superadmin) can monitor multiple schools.

School Administration / Finance staff can only access data pertaining to their assigned school.

---

### Comprehensive Student Profiling

Record highly detailed student data including:

- Biodata
- Digital documents
- Complete medical / health history

---

### Streamlined Financial Administration

Eliminate administrative bottlenecks through:

Automated Mass Billing Generator  
Example: generating **12 months of tuition fees at once**

Intuitive Visual Tracker  
Understandable by **non-technical staff**

---

### Bilingual Support

Provide a fully bilingual experience:

- Indonesian
- English

Applies to:

- UI
- WhatsApp notifications
- Email notifications

---

# 1.2 User Personas

---

## Superadmin (Foundation)

Responsibilities:

- Manage global master data
- Manage schools
- Manage academic years
- Manage regional setup

Capabilities:

- Access data across **all school branches**
- No `school_id` restriction

---

## School Finance / Admin Staff (TU)

Responsibilities:

- Manage student billing
- Input manual payments
- Monitor arrears
- Generate financial reports

Restrictions:

Access strictly limited to **assigned `school_id`**.

---

# 1.3 Core Feature Requirements

---

# A. Master Data Module (Core Setup)

---

## Foundation Management

CRUD operations for:

- `schools`
- `academic_years`

---

## Regional Management

CRUD hierarchy:

```
provinces
  cities
    districts
      subdistricts
```

Purpose:

Standardize student address data.

---

## Academic Management

CRUD for:

- `level_grades`  
Example: Primary 1, Grade 10

- `classes`  
Example: 1A, 1B

---

# B. Student Management Module (Student CRM)

---

## Comprehensive Profiling

Multi-tab CRUD forms covering:

- Personal Data
- Relational Address
- Health History

Health information includes:

- Blood type
- Allergies
- Vision problems
- Special needs
- Medical notes

---

## Document Management

Secure upload for:

- Family Card (KK)
- Birth Certificate

Supported formats:

- PDF
- JPG

Stored in:

```
student_documents
```

---

## Parent Relations

Link Parent User accounts to Students.

Table:

```
parent_student_relations
```

Roles:

- Father
- Mother
- Guardian

---

## Class Promotions

Promote or transfer students to new classes.

History stored in:

```
student_class_histories
```

---

# C. Finance & Integration Setup (Finance Master)

---

## Product (Fee) Management

Define billing types in:

```
products
```

Types:

- Monthly
- Installment
- One-Time

Includes **COA mapping** for ZAINS integration.

---

## Payment Methods

Setup payment methods in:

```
payment_methods
```

Examples:

- eWallet
- Virtual Account
- Cash

Linked to **Cash COA**.

---

## Payment Instructions

Tables:

```
payment_instruction_groups
payment_instruction_steps
```

Supports multi-step payment guides.

---

## Notification Templates

Table:

```
template_notif
```

Variables:

```
{student_name}
{amount}
{due_date}
```

Channels:

- WhatsApp
- Email

---

# D. Billing & Monitoring Module

---

# Use Case 1: 12-Month Mass Billing Generator

Admin staff should **not create bills one by one**.

Solution:

Generate Tuition Tool.

Inputs:

- Product
- Academic Year
- Class

System automatically generates:

```
12 months bills (July – June)
```

Inserted into:

```
bills
```

For every student in the class.

---

# Use Case 2: Intuitive SPP Visual Matrix

Monitoring board with **heatmap style layout**.

Rows:

Student names

Columns:

```
Jul Aug Sep Oct Nov Dec Jan Feb Mar Apr May Jun
```

Icons:

🟢 Paid  
🔴 Unpaid  
🟡 Pending

Features:

- Filter by class
- Send WA reminder per student

---

# Cashier Acceptance (Manual Payment)

Admin workflow:

1. Search student
2. Select unpaid bills
3. Input payment
4. Process payment

System automatically:

- Generates transaction
- Updates bills
- Generates receipt

---

# E. Bilingual Features

---

## UI Localization

Header language switch:

```
ID | EN
```

All UI components must support dynamic translation.

---

## Content Localization

Notifications must follow **parent language preference**.

---

# PART 2: TECHNICAL REQUIREMENTS DOCUMENT (TRD)

---

# 2.1 Multi-Tenant Architecture

All queries executed by role:

```
school_finance
```

Must inject:

```
WHERE school_id = X
```

Exception:

```
superadmin
```

---

## Security Constraint

Backend must validate:

Finance user from School A cannot access:

```
student_id belonging to School B
```

---

# 2.2 Bilingual Architecture

Frontend:

Use i18n libraries such as:

```
react-i18next
vue-i18n
```

Translation dictionaries:

```
/locales/id.json
/locales/en.json
```

---

## Database Localization

Tables:

```
template_notif
payment_instructions
```

Add column:

```
language_code
```

Values:

```
id
en
```

---

# 2.3 Database Schema Coverage Checklist

| Tables | Menu |
|------|------|
| schools, academic_years, level_grades, classes | Academic Settings |
| provinces, cities, districts, subdistricts | Regional Reference |
| users | User Management |
| students, student_documents | Student Master Book |
| parent_student_relations | Student Form |
| student_class_histories | Promotions |
| products, payment_methods | Finance Setup |
| bills | Billing |
| transactions | Cashier |
| template_notif | Notification |

---

# 2.4 Backend Logic

---

# Mass Billing Generator Engine

Endpoint:

```
POST /admin/billing/generate-monthly
```

Backend must:

1 Retrieve active students  
2 Fetch academic year  
3 Generate billing records  

```
students × 12 months
```

Execute inside **single DB transaction**.

Purpose:

Prevent duplicate bills.

---

# Post Payment Trigger

Manual payment must trigger same process as **Muamalat Webhook**.

Steps:

1 Update bills → Paid  
2 Insert journal entry → ZAINS API  
3 Send WhatsApp notification

---

# PART 3: USER JOURNEY

---

# Journey 1 — Generate 12 Month Bills

Actor: Finance Staff

Navigate:

```
Finance → Billing Generator
```

Select:

Academic Year  
Product  
Class

Preview:

```
30 students
360 bills generated
```

Click:

```
Generate Bills
```

Result:

Bills appear in Parent Portal.

---

# Journey 2 — Visual SPP Matrix

Navigate:

```
Finance → Visual SPP Matrix
```

Select:

Academic Year  
Class

View heatmap matrix.

Example:

```
Ahmad Santoso
```

July 🟢  
Aug 🟢  
Sep 🟢  
Oct 🟡  
Nov 🔴  
Dec 🔴  

Meaning:

Paid until September.

Click:

```
Send WA Reminder
```

---

# Journey 3 — Cash Payment

Parent arrives with cash.

Open:

```
Transactions → Cashier Desk
```

Search:

```
Ahmad Santoso
```

Select bills:

```
SPP November
Building Installment
```

Total:

```
Rp 3,500,000
```

Click:

```
Process Payment
```

System:

- Generates receipt
- Updates billing
- Sends WhatsApp confirmation

```
Thank you.
Your cash payment of Rp 3,500,000 has been successfully received.
```

---

# END OF DOCUMENT