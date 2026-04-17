# QMS Module — Video Script & Structure Guide
**Task 2: Understanding QMS Modules in Supply Chain OS (Life Sciences)**

---

## Video Structure (10–15 minutes)

| Segment | Duration | Content |
|---|---|---|
| 1. Introduction | 1–2 min | Who you are, what QMS is, why it matters |
| 2. In-Process Quality | 3–4 min | Deviation Management + CAPA |
| 3. In-Product Quality | 3–4 min | Product Complaints + Recall + Adverse Events |
| 4. QMS Management | 2 min | Supplier Management |
| 5. Roles (SME perspective) | 2 min | QA Officer vs Production Manager |
| 6. Closing | 1 min | Summary + personal understanding |

---

## Segment 1: Introduction (1–2 min)

### What to Say

> "Hello, I'm [Your Name]. In this video I'll be explaining the Quality Management System — or QMS — module in the context of a Life Sciences Supply Chain OS platform. This platform is used by manufacturers of APIs — Active Pharmaceutical Ingredients — and FDFs — Finished Dosage Forms — like tablets, capsules, and injectables.
>
> QMS is not just a software module. It is the backbone of pharmaceutical manufacturing compliance. Every batch that leaves a factory must pass through documented quality checkpoints. If it doesn't, the consequences can range from product recalls to regulatory shutdowns by bodies like the FDA or EMA.
>
> This platform organizes QMS into three areas: In-Process Quality, In-Product Quality, and QMS Management. Let me walk through each one."

### Key Point to Draw / Show
- Simple diagram: **Raw Material → API Manufacturing → FDF Production → Quality Release → Market**
- Mark where each QMS module sits along this chain.

---

## Segment 2: In-Process Quality (3–4 min)

### What It Covers
- **Deviation Management**
- **CAPA (Corrective and Preventive Actions)**

---

### 2A. Deviation Management

#### What is a Deviation?
A deviation is any event during manufacturing where a planned process step did not happen as specified. It is not automatically a defect — it is a documented departure from the standard.

#### End-to-End Flow

```
Step 1: Detection
    ↓
Step 2: Immediate Containment (stop / quarantine)
    ↓
Step 3: Deviation Report Created (who, what, when, where)
    ↓
Step 4: Root Cause Investigation
    ↓
Step 5: Impact Assessment (does it affect product quality?)
    ↓
Step 6: Classification (Minor / Major / Critical)
    ↓
Step 7: QA Review & Approval
    ↓
Step 8: CAPA Initiated (if needed)
    ↓
Step 9: Batch Disposition Decision (Accept / Reject / Rework)
    ↓
Step 10: Closure & Documentation
```

#### API Example — Deviation in API Synthesis
> A reactor temperature exceeded the allowed range (±2°C) during a crystallization step for an antibiotic API. The batch is immediately quarantined. A deviation report is raised. The investigation reveals a faulty temperature sensor. Impact assessment shows the API yield dropped 3% but purity is within spec. Classification: **Major**. CAPA initiated to replace all sensors. Batch is accepted after re-testing; deviation is closed with documented evidence.

#### Raw Material Example — Deviation in Raw Material Receipt
> A shipment of solvent (acetone) arrives with a Certificate of Analysis showing water content at 0.12% — the spec is ≤0.10%. A deviation is raised at goods receipt. The QA team quarantines the material. Root cause: supplier used a different drying method. Impact: cannot be used for current batch. Decision: reject the lot, raise a supplier complaint. CAPA: update supplier qualification requirements.

#### What to Say
> "A deviation is not an alarm — it is a formal record. The moment something deviates from the SOP, it gets documented, investigated, and classified. In an SME, this is often handled on paper, but in a Supply Chain OS, it is a digital workflow where you can see the status in real time."

---

### 2B. CAPA — Corrective and Preventive Actions

#### What is CAPA?
- **Corrective Action (CA):** Fix the specific problem that already happened.
- **Preventive Action (PA):** Change the system so it cannot happen again.

#### End-to-End Flow

```
Step 1: CAPA Trigger (from Deviation / Complaint / Audit / Trend)
    ↓
Step 2: CAPA Owner Assigned
    ↓
Step 3: Problem Statement Defined
    ↓
Step 4: Root Cause Analysis (5 Whys / Fishbone / FMEA)
    ↓
Step 5: Corrective Action Plan Drafted
    ↓
Step 6: Preventive Action Plan Drafted
    ↓
Step 7: Actions Implemented (SOP update / training / equipment fix)
    ↓
Step 8: Effectiveness Check (verify the fix actually works)
    ↓
Step 9: QA Review & Closure
    ↓
Step 10: Trend Monitoring (watch for recurrence)
```

#### API Example — CAPA After Repeated Deviation
> Three batches in 6 months showed the same pH deviation in fermentation of a biologic API. **5 Whys root cause:** operators were not recalibrating pH probes per schedule because the schedule was buried in a shared folder. **Corrective Action:** recalibrate immediately + test all three batches. **Preventive Action:** digitize calibration reminders in the QMS system, add a mandatory digital sign-off before batch start. **Effectiveness Check:** no pH deviation in next 10 batches. CAPA closed.

#### Raw Material Example — CAPA for Contaminated Excipient
> Lactose (an excipient used in tablet coating) was found with microbial contamination. **CA:** Quarantine and destroy the batch. **PA:** Introduce microbiological testing at goods receipt for all excipients from this supplier, add supplier audit to annual plan. **Effectiveness:** 12-month trend shows zero recurrence. CAPA closed.

#### What to Say
> "CAPA is the engine of continuous improvement. In an SME, the QA Officer typically owns CAPA records. Without a proper system, CAPAs get opened and never closed — which is a major red flag during FDA or WHO inspections."

---

## Segment 3: In-Product Quality (3–4 min)

### What It Covers
- **Product Complaints**
- **Recall Management**
- **Adverse Event Reporting**

---

### 3A. Product Complaints

#### What is a Product Complaint?
A complaint is any written or verbal communication from a customer — hospital, pharmacist, patient — that indicates a quality problem with a released product.

#### End-to-End Flow

```
Step 1: Complaint Received (call / email / portal)
    ↓
Step 2: Complaint Logged (date, product lot, complainant details)
    ↓
Step 3: Initial Assessment (Is this safety-related? → escalate to Adverse Event)
    ↓
Step 4: Sample Retrieval (retain sample tested if available)
    ↓
Step 5: Investigation (lab testing, batch record review)
    ↓
Step 6: Root Cause Determination
    ↓
Step 7: Customer Communication (acknowledge + update)
    ↓
Step 8: CAPA Initiated if Systemic
    ↓
Step 9: Regulatory Reporting if Required
    ↓
Step 10: Complaint Closed
```

#### API Example — Complaint on API Potency
> A pharmaceutical manufacturer using your API for blood pressure tablets reports that three of their batches failed potency testing. They file a complaint. Your QMS team retrieves the retain sample from the same API lot and re-tests it. Investigation finds a degradation issue in the API caused by improper storage temperature during transit — the freight company did not maintain 2–8°C. Root cause: cold chain failure. CAPA: mandatory GPS + temperature tracking on all API shipments. Regulatory notification filed per ICH Q10.

#### Raw Material Example — Complaint on Contaminated Capsule Shell
> A hospital pharmacist reports that gelatin capsule shells have visible black specks. The lot is traced back to a raw material supplier. Investigation reveals carbon contamination in the supplier's gelatin processing line. Complaint logged, supplier notified, lot recalled from all customers. CAPA: add visual inspection step at goods receipt, update supplier audit checklist.

---

### 3B. Recall Management

#### What is a Recall?
A recall is the removal of a product from the market because it poses a risk — safety, efficacy, or labeling. It can be voluntary (manufacturer-initiated) or regulatory (FDA/CDSCO mandate).

#### Recall Classes (FDA standard)
| Class | Risk Level | Example |
|---|---|---|
| Class I | Serious health risk or death | Wrong API, contaminated sterile product |
| Class II | May cause health problem, unlikely death | Sub-potent tablet |
| Class III | Unlikely to cause health problem | Packaging defect, label typo |

#### End-to-End Flow

```
Step 1: Recall Trigger (complaint / adverse event / internal finding / regulator)
    ↓
Step 2: Recall Committee Convened (QA + Regulatory + Supply Chain + Legal)
    ↓
Step 3: Affected Lots Identified (batch traceability in QMS)
    ↓
Step 4: Recall Strategy Decided (Class I/II/III, scope — market/distribution/consumer)
    ↓
Step 5: Regulatory Authority Notified (FDA Form 3177 / CDSCO)
    ↓
Step 6: Customer/Distributor Notification (recall letters)
    ↓
Step 7: Product Retrieved & Quarantined
    ↓
Step 8: Effectiveness Check (% recovered)
    ↓
Step 9: Root Cause Investigation & CAPA
    ↓
Step 10: Recall Closed with Regulatory
```

#### API Example — Class I Recall
> An injectable API is found to contain a nitrosamine impurity (a probable human carcinogen) above the acceptable limit. A Class I recall is initiated. All lots distributed in the last 12 months are identified via lot traceability. Hospitals and distributors receive recall letters. Product is returned and destroyed. FDA is notified within 3 days. Root cause: a new reagent introduced by the supplier introduced the impurity. CAPA: ban reagent, requalify supplier.

#### What to Say
> "Recall management is where batch traceability becomes critical. If your QMS doesn't link every batch to its raw materials, suppliers, and customers, a recall can take weeks instead of hours. The Supply Chain OS makes this instant through linked lot records."

---

### 3C. Adverse Event Reporting

#### What is an Adverse Event?
An adverse event (AE) is any undesirable medical occurrence in a patient who used a pharmaceutical product — whether or not it is causally related to the product.

#### Flow

```
Patient / Doctor Reports AE
    ↓
Medical Affairs Team Receives Report
    ↓
Seriousness Assessment (Serious / Non-Serious)
    ↓
Causality Assessment (Related / Unrelated / Possibly Related)
    ↓
If Serious + Related → Expedited Report to Regulator (15 days)
    ↓
If Non-Serious → Periodic Safety Update Report (PSUR)
    ↓
Signal Detection (is this a pattern across multiple patients?)
    ↓
If Signal Confirmed → Safety Label Update / Recall / DHCP Letter
```

#### Example
> Multiple oncologists report that patients on a new chemotherapy formulation are experiencing severe liver enzyme elevation (hepatotoxicity) — not seen in clinical trials. This is a **serious, possibly related** adverse event. The company files an expedited 15-day report to the FDA. Signal is confirmed across 12 patients. The label is updated with a black-box warning. A Dear Healthcare Professional (DHCP) letter is issued.

---

## Segment 4: QMS Management — Supplier Management (2 min)

### What It Covers
Managing the quality of suppliers who provide raw materials, excipients, packaging, and APIs.

#### End-to-End Flow

```
Step 1: Supplier Identification
    ↓
Step 2: Supplier Qualification (audit, questionnaire, sample testing)
    ↓
Step 3: Approved Supplier List (ASL) Updated
    ↓
Step 4: Purchase Order Linked to Approved Supplier
    ↓
Step 5: Goods Receipt — CoA Verification + Incoming QC Testing
    ↓
Step 6: Approved / Rejected / Quarantined
    ↓
Step 7: Periodic Supplier Re-audit (annual or triggered by deviations)
    ↓
Step 8: Supplier Performance Scorecard Updated (on-time delivery, rejection rate, CAPA response time)
    ↓
Step 9: Escalation or Disqualification if Performance Drops
```

#### API Example — New API Supplier Qualification
> Your company wants to source a new API from a manufacturer in Hyderabad. Before the first purchase, the QA team conducts a remote audit and sends a 50-question GMP questionnaire. The supplier submits test reports, impurity profiles, and a DMF (Drug Master File) reference. Three pilot batches are tested in-house — all pass. The supplier is added to the Approved Supplier List. Annual re-audit is scheduled.

#### Raw Material Example — Excipient Supplier Disqualification
> A microcrystalline cellulose supplier receives three non-conformance reports in 6 months: two for moisture content out of spec, one for a failed CoA. Their CAPA responses were late. The supplier performance score drops below threshold. They are moved from "Approved" to "Conditional" status and a re-audit is triggered. If no improvement in 90 days, they are disqualified and removed from the ASL.

#### What to Say
> "In an SME, supplier management is often informal — you call the same vendor you've used for years and trust the CoA. But a single bad batch from a non-qualified supplier can contaminate an entire production run. The QMS module makes supplier qualification and monitoring systematic and auditable."

---

## Segment 5: Roles in an SME (2 min)

### Quality Executive / QA Officer

**Day-to-day responsibilities:**
- Reviewing and approving deviation reports before batch release
- Owning and tracking all open CAPAs — ensuring deadlines are met
- Reviewing incoming supplier CoAs and approving or rejecting materials
- Processing product complaints and coordinating investigations
- Filing regulatory reports (adverse events, recall notifications)
- Maintaining the Approved Supplier List
- Conducting internal GMP audits

**Perspective on QMS:**
> "The QMS module is my audit trail. Every record I create here is what the FDA inspector will look at. If a deviation has no investigation, or a CAPA has no effectiveness check — that's a 483 observation. This system keeps me accountable and my team organized."

---

### Production Manager

**Day-to-day responsibilities:**
- Reporting deviations that happen on the shop floor (equipment failures, process excursions)
- Implementing CAPA actions (retraining operators, fixing equipment, updating SOPs)
- Coordinating with QA for batch release after investigations are closed
- Managing raw material usage — flagging when a quarantined material is about to be used
- Ensuring recall-affected lots are physically segregated and labeled

**Perspective on QMS:**
> "My job is to keep production running. Every deviation I raise slows things down — but if I don't raise it, I risk releasing a bad batch. The QMS system helps me raise issues quickly so QA can investigate and release the batch as fast as possible. I also use CAPA records to justify equipment budget requests to management."

---

## Segment 6: Closing (1 min)

### What to Say

> "To summarize: the QMS module in a Life Sciences Supply Chain OS connects every quality event — from a deviation on the shop floor, to a complaint from a hospital, to a supplier failing a re-audit — into a single traceable system.
>
> What I personally understand from this module is that quality in pharmaceuticals is not about perfection — it is about documentation, investigation, and systematic improvement. A company that finds deviations and handles them properly is actually safer than one that never reports any. The QMS module makes that culture of quality measurable and inspectable.
>
> In an SME, where you might have a team of 5–10 people handling QMS manually, this platform can replace folders of paper forms with a digital workflow that gives you real-time visibility, automatic escalation, and a complete audit trail. That is the real value it provides."

---

## Quick Reference: Key Regulatory Terms for the Video

| Term | Meaning |
|---|---|
| API | Active Pharmaceutical Ingredient — the biologically active component |
| FDF | Finished Dosage Form — the final product (tablet, capsule, injection) |
| CoA | Certificate of Analysis — supplier document showing test results |
| SOP | Standard Operating Procedure — documented step-by-step instructions |
| GMP | Good Manufacturing Practice — regulatory standard for pharma manufacturing |
| DMF | Drug Master File — confidential technical document filed with FDA |
| ICH Q10 | International guideline for pharmaceutical quality systems |
| 483 | FDA observation of non-compliance found during inspection |
| PSUR | Periodic Safety Update Report — regular AE summary sent to regulators |
| DHCP | Dear Healthcare Professional — safety communication letter |
| ASL | Approved Supplier List — list of qualified, audited vendors |

---

## Flowchart Suggestion (Hand-draw for the video)

Draw a single page with 4 boxes connected left-to-right:

```
[Raw Material In]
       ↓
 Supplier Mgmt
(Qualification + CoA)
       ↓
[Manufacturing Process]
       ↓
 Deviation Mgmt
 + CAPA
       ↓
[Finished Product]
       ↓
 Product Complaints
 Adverse Event
 Recall Mgmt
       ↓
[Market / Patient]
```

Label each arrow with the relevant QMS module name. This single diagram shows how QMS sits at every stage of the supply chain — a visual that will impress the evaluator.
