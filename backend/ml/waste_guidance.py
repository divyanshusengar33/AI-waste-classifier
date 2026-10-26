
GUIDANCE = {
    "Plastic": {
        "category": "Usually non-biodegradable",
        "action": "Check local plastic recycling rules.",
        "caveat": "Recyclability depends on plastic type and local facilities.",
    },
    "Paper_Cardboard": {
        "category": "Usually recyclable",
        "action": "Keep clean and dry; recycle if accepted locally.",
        "caveat": "Wet, greasy, or contaminated paper may not be recyclable.",
    },
    "Metal": {
        "category": "Usually recyclable",
        "action": "Use an accepted metal collection service.",
        "caveat": "Acceptance depends on metal type and local facilities.",
    },
    "Glass": {
        "category": "Usually recyclable",
        "action": "Use an accepted glass collection point.",
        "caveat": "Broken glass requires safe handling; not all glass types are accepted.",
    },
    "Other_Waste": {
        "category": "Unknown — inspect the item",
        "action": "Identify the material before choosing a disposal route.",
        "caveat": "This class can contain different waste materials.",
    },
}


def get_waste_guidance(predicted_label: str) -> dict:
    return GUIDANCE.get(
        predicted_label,
        {
            "category": "Unknown",
            "action": "Review the item manually.",
            "caveat": "No guidance is available for this class.",
        },
    )
