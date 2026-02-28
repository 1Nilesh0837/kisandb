export interface Scheme {
    id: string;
    name: string;
    name_hi: string;
    benefit: string;
    benefit_hi: string;
    type: "subsidy" | "loan" |
    "insurance" | "service" |
    "loan_waiver" | "price_support";
    max_benefit: string;
    eligibility: {
        min_land_acres?: number;
        max_land_acres?: number;
        states?: string[];
        all_states?: boolean;
        eligible_crops?: string[];
        all_crops?: boolean;
        max_revenue?: number | null;
        deadline_months?: number[];
    };
    apply_url: string;
    deadline: string;
    deadline_hi: string;
    documents: string[];
    documents_hi: string[];
    urgency?: "high" | "medium" | "low";
}

const STATE_ALIASES: Record<string, string> = {
    "UP": "Uttar Pradesh",
    "MP": "Madhya Pradesh",
    "MH": "Maharashtra",
    "RJ": "Rajasthan",
    "HR": "Haryana",
    "PB": "Punjab",
    "GJ": "Gujarat",
    "BR": "Bihar",
    "AP": "Andhra Pradesh",
    "TS": "Telangana",
    "KA": "Karnataka",
};

const CROP_ALIASES: Record<string, string> = {
    "gehu": "Wheat",
    "gehun": "Wheat",
    "dhan": "Rice",
    "chawal": "Rice",
    "makka": "Maize",
    "makai": "Maize",
    "sarson": "Mustard",
    "rai": "Mustard",
    "chana": "Gram",
    "pyaaz": "Onion",
    "tamatar": "Tomato",
    "aloo": "Potato",
};

export const ALL_SCHEMES: Scheme[] = [

    // ── CENTRAL SCHEMES ──────────────────
    {
        id: "pm_kisan",
        name: "PM-KISAN Samman Nidhi",
        name_hi: "पीएम किसान सम्मान निधि",
        benefit: "₹6,000/year direct to bank",
        benefit_hi: "₹6,000 प्रति वर्ष सीधे बैंक में",
        type: "subsidy",
        max_benefit: "₹6,000/year",
        eligibility: {
            min_land_acres: 0.1,
            max_land_acres: 999,
            all_states: true,
            all_crops: true,
            max_revenue: null,
        },
        apply_url: "https://pmkisan.gov.in",
        deadline: "No deadline — ongoing",
        deadline_hi: "कोई अंतिम तारीख नहीं — चालू",
        documents: [
            "Aadhaar Card",
            "Bank Account Passbook",
            "Land Records (Khasra/Khatauni)",
            "Mobile Number linked to Aadhaar",
        ],
        documents_hi: [
            "आधार कार्ड",
            "बैंक पासबुक",
            "जमीन के कागज (खसरा/खतौनी)",
            "आधार से लिंक मोबाइल नंबर",
        ],
        urgency: "high",
    },

    {
        id: "kcc",
        name: "Kisan Credit Card (KCC)",
        name_hi: "किसान क्रेडिट कार्ड",
        benefit: "Loan up to ₹3 Lakh @ 4% interest",
        benefit_hi: "₹3 लाख तक ऋण — सिर्फ 4% ब्याज",
        type: "loan",
        max_benefit: "₹3,00,000",
        eligibility: {
            min_land_acres: 0.25,
            all_states: true,
            all_crops: true,
            max_revenue: null,
        },
        apply_url: "https://pmkisan.gov.in/KCC.aspx",
        deadline: "No deadline — apply anytime",
        deadline_hi: "कभी भी आवेदन करें",
        documents: [
            "Aadhaar Card",
            "Land Records",
            "Bank Account",
            "Passport Size Photo",
            "Crop Details",
        ],
        documents_hi: [
            "आधार कार्ड",
            "जमीन के कागज",
            "बैंक खाता",
            "पासपोर्ट फोटो",
            "फसल की जानकारी",
        ],
        urgency: "high",
    },

    {
        id: "fasal_bima",
        name: "PM Fasal Bima Yojana",
        name_hi: "प्रधानमंत्री फसल बीमा योजना",
        benefit: "Crop loss insurance coverage",
        benefit_hi: "फसल बर्बाद होने पर सरकारी मुआवजा",
        type: "insurance",
        max_benefit: "Up to ₹2,00,000",
        eligibility: {
            all_states: true,
            eligible_crops: [
                "Wheat", "Rice", "Maize", "Cotton",
                "Soybean", "Groundnut", "Mustard",
                "Gram", "Onion", "Tomato", "Potato",
            ],
            all_crops: false,
            deadline_months: [3, 6],
        },
        apply_url: "https://pmfby.gov.in",
        deadline: "March 31 (Rabi) / June 30 (Kharif)",
        deadline_hi: "31 मार्च (रबी) / 30 जून (खरीफ)",
        documents: [
            "Land Records",
            "Aadhaar Card",
            "Bank Account",
            "Crop Sowing Certificate",
        ],
        documents_hi: [
            "जमीन के कागज",
            "आधार कार्ड",
            "बैंक खाता",
            "फसल बुवाई प्रमाण पत्र",
        ],
        urgency: "high",
    },

    {
        id: "soil_health",
        name: "Soil Health Card Scheme",
        name_hi: "मृदा स्वास्थ्य कार्ड योजना",
        benefit: "FREE soil testing + fertilizer advice",
        benefit_hi: "मुफ्त मिट्टी जांच + खाद की सलाह",
        type: "service",
        max_benefit: "FREE",
        eligibility: {
            all_states: true,
            all_crops: true,
        },
        apply_url: "https://soilhealth.dac.gov.in",
        deadline: "No deadline",
        deadline_hi: "कोई तारीख नहीं",
        documents: ["Aadhaar Card", "Land Records"],
        documents_hi: ["आधार कार्ड", "जमीन के कागज"],
        urgency: "low",
    },

    {
        id: "drip_irrigation",
        name: "PM Krishi Sinchayee Yojana",
        name_hi: "पीएम कृषि सिंचाई योजना",
        benefit: "55% subsidy on drip irrigation",
        benefit_hi: "ड्रिप सिंचाई पर 55% सब्सिडी",
        type: "subsidy",
        max_benefit: "55% subsidy",
        eligibility: {
            min_land_acres: 1,
            all_states: true,
            eligible_crops: [
                "Vegetables", "Fruits", "Cotton",
                "Sugarcane", "Banana", "Grapes",
            ],
        },
        apply_url: "https://pmksy.gov.in",
        deadline: "Varies by state",
        deadline_hi: "राज्य के अनुसार अलग",
        documents: [
            "Land Records", "Aadhaar", "Bank Account"
        ],
        documents_hi: [
            "जमीन के कागज", "आधार", "बैंक खाता"
        ],
        urgency: "medium",
    },

    {
        id: "agri_infra_fund",
        name: "Agriculture Infrastructure Fund",
        name_hi: "कृषि अवसंरचना निधि",
        benefit: "Loan up to ₹2 Cr @ 3% interest subsidy",
        benefit_hi: "₹2 करोड़ तक ऋण — 3% ब्याज सब्सिडी",
        type: "loan",
        max_benefit: "₹2,00,00,000",
        eligibility: {
            all_states: true,
            all_crops: true,
            min_land_acres: 1,
        },
        apply_url: "https://agriinfra.dac.gov.in",
        deadline: "2025-26 — Apply now",
        deadline_hi: "2025-26 — अभी आवेदन करें",
        documents: [
            "Aadhaar", "PAN Card",
            "Land Records", "Bank Account",
            "Project Report",
        ],
        documents_hi: [
            "आधार", "पैन कार्ड",
            "जमीन के कागज", "बैंक खाता",
            "प्रोजेक्ट रिपोर्ट",
        ],
        urgency: "medium",
    },

    // ── STATE SCHEMES ─────────────────────
    {
        id: "up_kisan_rin",
        name: "UP Kisan Karj Rahat Yojana",
        name_hi: "यूपी किसान कर्ज राहत योजना",
        benefit: "Loan waiver up to ₹1 Lakh",
        benefit_hi: "₹1 लाख तक कर्ज माफ",
        type: "loan_waiver",
        max_benefit: "₹1,00,000",
        eligibility: {
            states: ["Uttar Pradesh"],
            max_land_acres: 5,
            all_crops: true,
        },
        apply_url: "https://www.upkisankarjrahat.upsdc.gov.in",
        deadline: "Check official website",
        deadline_hi: "आधिकारिक वेबसाइट देखें",
        documents: [
            "Aadhaar", "Land Records",
            "Loan Documents", "Bank Passbook",
        ],
        documents_hi: [
            "आधार", "जमीन के कागज",
            "ऋण दस्तावेज", "बैंक पासबुक",
        ],
        urgency: "high",
    },

    {
        id: "mp_bhavantar",
        name: "MP Bhavantar Bhugtan Yojana",
        name_hi: "एमपी भावांतर भुगतान योजना",
        benefit: "Price difference compensation",
        benefit_hi: "बाजार दाम कम होने पर सरकार देगी फर्क",
        type: "price_support",
        max_benefit: "Varies per crop",
        eligibility: {
            states: ["Madhya Pradesh"],
            eligible_crops: [
                "Soybean", "Maize", "Urad", "Tur",
                "Moong", "Groundnut", "Sesame",
            ],
        },
        apply_url: "https://mpeuparjan.nic.in",
        deadline: "Season-wise registration",
        deadline_hi: "मौसम के अनुसार पंजीकरण",
        documents: [
            "Aadhaar", "Land Records",
            "Bank Account", "Crop Details",
        ],
        documents_hi: [
            "आधार", "जमीन के कागज",
            "बैंक खाता", "फसल विवरण",
        ],
        urgency: "medium",
    },

    {
        id: "maha_shetkari",
        name: "Maharashtra Shetkari Samman Yojana",
        name_hi: "महाराष्ट्र शेतकरी सन्मान योजना",
        benefit: "₹12,000/year + irrigation subsidy",
        benefit_hi: "₹12,000 प्रति वर्ष + सिंचाई सब्सिडी",
        type: "subsidy",
        max_benefit: "₹12,000/year",
        eligibility: {
            states: ["Maharashtra"],
            all_crops: true,
        },
        apply_url: "https://mahadbt.maharashtra.gov.in",
        deadline: "Ongoing",
        deadline_hi: "जारी है",
        documents: ["Aadhaar", "7/12 Utara", "Bank Account"],
        documents_hi: ["आधार", "7/12 उतारा", "बैंक खाता"],
        urgency: "medium",
    },

    {
        id: "raj_krishi_yojana",
        name: "Rajasthan Krishi Upkaran Subsidy",
        name_hi: "राजस्थान कृषि उपकरण सब्सिडी",
        benefit: "40-50% subsidy on farm equipment",
        benefit_hi: "कृषि उपकरण पर 40-50% सब्सिडी",
        type: "subsidy",
        max_benefit: "50% subsidy",
        eligibility: {
            states: ["Rajasthan"],
            min_land_acres: 0.5,
            all_crops: true,
        },
        apply_url: "https://rajkisan.rajasthan.gov.in",
        deadline: "Annual — check website",
        deadline_hi: "वार्षिक — वेबसाइट देखें",
        documents: ["Aadhaar", "Land Records", "Bank Account"],
        documents_hi: ["आधार", "जमीन के कागज", "बैंक खाता"],
        urgency: "medium",
    },
];

// ── ELIGIBILITY CHECKER ──────────────────

export interface FarmerProfile {
    name: string;
    state: string;
    land_acres: number;
    crops: string[];
    revenue: number;
    has_aadhaar: boolean;
    has_bank: boolean;
}

export type EligibilityResult =
    "eligible" | "partial" | "ineligible";

export interface SchemeResult {
    scheme: Scheme;
    result: EligibilityResult;
    reasons: string[];
    reasons_hi: string[];
    missing: string[];
    missing_hi: string[];
    deadline_urgent: boolean;
}

export function checkEligibility(
    farmer: FarmerProfile
): SchemeResult[] {

    const results: SchemeResult[] = [];
    const currentMonth = new Date().getMonth() + 1;

    // Normalize state
    let normalizedState = farmer.state.trim();
    if (STATE_ALIASES[normalizedState.toUpperCase()]) {
        normalizedState = STATE_ALIASES[normalizedState.toUpperCase()];
    }

    // Normalize crops
    const normalizedCrops = farmer.crops.map(crop => {
        const c = crop.trim().toLowerCase();
        return CROP_ALIASES[c] || crop.trim(); // Fallback to original if no alias
    });

    for (const scheme of ALL_SCHEMES) {
        const e = scheme.eligibility;
        const reasons: string[] = [];
        const reasons_hi: string[] = [];
        const missing: string[] = [];
        const missing_hi: string[] = [];
        let eligible = true;

        // Check state
        if (e.states && !e.states.some(s => s.toLowerCase() === normalizedState.toLowerCase())) {
            eligible = false;
            reasons.push(
                `Only for: ${e.states.join(", ")}`
            );
            reasons_hi.push(
                `सिर्फ ${e.states.join(", ")} के लिए`
            );
        }

        // Check land size
        if (e.min_land_acres &&
            farmer.land_acres < e.min_land_acres) {
            eligible = false;
            reasons.push(
                `Min land required: ${e.min_land_acres} acres`
            );
            reasons_hi.push(
                `न्यूनतम ${e.min_land_acres} एकड़ जमीन चाहिए`
            );
        }

        if (e.max_land_acres &&
            e.max_land_acres < 999 &&
            farmer.land_acres > e.max_land_acres) {
            eligible = false;
            reasons.push(
                `Max land: ${e.max_land_acres} acres (you have ${farmer.land_acres})`
            );
            reasons_hi.push(
                `अधिकतम ${e.max_land_acres} एकड़ — आपके पास ज्यादा है`
            );
        }

        // Check crops
        if (!e.all_crops && e.eligible_crops) {
            const hasEligibleCrop = normalizedCrops
                .some(c => e.eligible_crops!
                    .some(ec =>
                        ec.toLowerCase() === c.toLowerCase()
                    )
                );
            if (!hasEligibleCrop) {
                eligible = false;
                reasons.push(
                    `Your crops not covered. Need: ${e.eligible_crops.slice(0, 3).join(", ")}`
                );
                reasons_hi.push(
                    `आपकी फसल इसमें नहीं। चाहिए: ${e.eligible_crops.slice(0, 3).join(", ")}`
                );
            }
        }

        // Check revenue limit
        if (e.max_revenue &&
            farmer.revenue > e.max_revenue) {
            eligible = false;
            reasons.push(
                `Income too high (max ₹${e.max_revenue.toLocaleString()})`
            );
            reasons_hi.push(
                `आय सीमा से ज्यादा (अधिकतम ₹${e.max_revenue.toLocaleString()})`
            );
        }

        // Check deadline urgency
        let deadline_urgent = false;
        if (e.deadline_months) {
            const monthsUntil = e.deadline_months
                .map(m => {
                    const diff = m - currentMonth;
                    return diff < 0 ? diff + 12 : diff;
                });
            const nearest = Math.min(...monthsUntil);
            if (nearest <= 1) deadline_urgent = true;
        }

        // Add to results
        results.push({
            scheme,
            result: eligible ? "eligible" : "ineligible",
            reasons,
            reasons_hi,
            missing,
            missing_hi,
            deadline_urgent,
        });
    }

    // Sort: eligible first, then by urgency
    return results.sort((a, b) => {
        if (a.result === "eligible" &&
            b.result !== "eligible") return -1;
        if (b.result === "eligible" &&
            a.result !== "eligible") return 1;
        const urgencyMap: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (
            urgencyMap[a.scheme.urgency || "low"] -
            urgencyMap[b.scheme.urgency || "low"]
        );
    });
}

// Generate SMS summary
export function buildSMSSummary(
    farmerName: string,
    results: SchemeResult[]
): string {
    const eligible = results.filter(
        r => r.result === "eligible"
    );
    const urgent = eligible.filter(
        r => r.deadline_urgent
    );

    let msg = `KisanDB Yojana Report\n`;
    msg += `Namaste ${farmerName}!\n`;
    msg += `Aap ${eligible.length} yojanaon ke liye eligible hain:\n`;
    eligible.slice(0, 3).forEach(r => {
        msg += `✅ ${r.scheme.name}: ${r.scheme.max_benefit}\n`;
    });
    if (urgent.length > 0) {
        msg += `\n⚠️ JALDI: ${urgent[0].scheme.name_hi} ki deadline aa rahi hai!\n`;
    }
    msg += `\nApp mein poori jaankari dekhein.\n-KisanDB`;
    return msg;
}
